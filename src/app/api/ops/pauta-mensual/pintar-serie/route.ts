import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, requireAuth, unauthorized } from "@/lib/api-auth";
import { pintarSerieSchema } from "@/lib/validations/ops";
import {
  createOpsAuditLog,
  ensureOpsAccess,
  getMonthDateRange,
  listDatesBetween,
  parseDateOnly,
} from "@/lib/ops";

/**
 * Generates shift codes for a month based on a rotation pattern.
 */
function generateSerieForMonth(
  startDate: Date,
  startPosition: number,
  patternWork: number,
  patternOff: number,
  monthDates: Date[]
): { date: Date; shiftCode: string }[] {
  const cycleLength = patternWork + patternOff;
  const results: { date: Date; shiftCode: string }[] = [];

  for (const d of monthDates) {
    const diffMs = d.getTime() - startDate.getTime();
    const daysDiff = Math.round(diffMs / (1000 * 60 * 60 * 24));

    const positionInCycle =
      ((daysDiff + (startPosition - 1)) % cycleLength + cycleLength) % cycleLength;

    const isWorkDay = positionInCycle < patternWork;

    results.push({
      date: new Date(d),
      shiftCode: isWorkDay ? "T" : "-",
    });
  }

  return results;
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = ensureOpsAccess(ctx);
    if (forbidden) return forbidden;

    const parsed = await parseBody(request, pintarSerieSchema);
    if (parsed.error) return parsed.error;
    const body = parsed.data;

    // Validate puesto exists
    const puesto = await prisma.opsPuestoOperativo.findFirst({
      where: { id: body.puestoId, tenantId: ctx.tenantId },
      select: { id: true, installationId: true, requiredGuards: true },
    });
    if (!puesto) {
      return NextResponse.json(
        { success: false, error: "Puesto operativo no encontrado" },
        { status: 404 }
      );
    }
    if (body.slotNumber > puesto.requiredGuards) {
      return NextResponse.json(
        { success: false, error: `Slot ${body.slotNumber} excede dotación del puesto (${puesto.requiredGuards})` },
        { status: 400 }
      );
    }

    // Check if there's a guard assigned to this slot (for plannedGuardiaId)
    const asignacion = await prisma.opsAsignacionGuardia.findFirst({
      where: {
        tenantId: ctx.tenantId,
        puestoId: body.puestoId,
        slotNumber: body.slotNumber,
        isActive: true,
      },
      select: { guardiaId: true, startDate: true },
    });

    const startDate = parseDateOnly(body.startDate);
    const { start: monthStart, end: monthEnd } = getMonthDateRange(body.year, body.month);
    const paintDates = listDatesBetween(monthStart, monthEnd);

    // Generate the series pattern for the full month
    const serieEntries = generateSerieForMonth(
      startDate,
      body.startPosition,
      body.patternWork,
      body.patternOff,
      paintDates
    );

    // Save the serie definition (deactivate previous ones for same puesto+slot)
    await prisma.opsSerieAsignacion.updateMany({
      where: {
        tenantId: ctx.tenantId,
        puestoId: body.puestoId,
        slotNumber: body.slotNumber,
        isActive: true,
      },
      data: { isActive: false, endDate: monthStart },
    });

    await prisma.opsSerieAsignacion.create({
      data: {
        tenantId: ctx.tenantId,
        puestoId: body.puestoId,
        slotNumber: body.slotNumber,
        guardiaId: asignacion?.guardiaId ?? null,
        patternCode: body.patternCode,
        patternWork: body.patternWork,
        patternOff: body.patternOff,
        startDate,
        startPosition: body.startPosition,
        isActive: true,
        createdBy: ctx.userId,
      },
    });

    // Determine plannedGuardiaId: only set if guard is assigned AND date >= assignment start
    const getPlannedGuardiaId = (entry: { date: Date; shiftCode: string }) => {
      if (entry.shiftCode !== "T") return null;
      if (!asignacion) return null;
      if (entry.date < asignacion.startDate) return null;
      return asignacion.guardiaId;
    };

    // Update pauta entries for this slot
    let updated = 0;
    for (const entry of serieEntries) {
      try {
        const plannedGuardiaId = getPlannedGuardiaId(entry);
        await prisma.opsPautaMensual.upsert({
          where: {
            puestoId_slotNumber_date: {
              puestoId: body.puestoId,
              slotNumber: body.slotNumber,
              date: entry.date,
            },
          },
          create: {
            tenantId: ctx.tenantId,
            installationId: puesto.installationId,
            puestoId: body.puestoId,
            slotNumber: body.slotNumber,
            date: entry.date,
            plannedGuardiaId,
            shiftCode: entry.shiftCode,
            status: "planificado",
            createdBy: ctx.userId,
          },
          update: {
            plannedGuardiaId,
            shiftCode: entry.shiftCode,
          },
        });
        updated++;
      } catch (e) {
        console.error("[OPS] Error upserting pauta entry:", e);
      }
    }

    await createOpsAuditLog(ctx, "ops.pauta.serie_painted", "ops_pauta", undefined, {
      puestoId: body.puestoId,
      slotNumber: body.slotNumber,
      guardiaId: asignacion?.guardiaId ?? null,
      patternCode: body.patternCode,
      startDate: body.startDate,
      startPosition: body.startPosition,
      updatedEntries: updated,
    });

    return NextResponse.json({
      success: true,
      data: {
        updated,
        patternCode: body.patternCode,
        guardiaId: asignacion?.guardiaId ?? null,
        slotNumber: body.slotNumber,
      },
    });
  } catch (error) {
    console.error("[OPS] Error painting serie:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo pintar la serie" },
      { status: 500 }
    );
  }
}
