import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { createOpsAuditLog, ensureOpsAccess, parseDateOnly, toISODate } from "@/lib/ops";
import type { AuthContext } from "@/lib/api-auth";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const asignarSchema = z.object({
  guardiaId: z.string().uuid(),
  puestoId: z.string().uuid(),
  slotNumber: z.number().int().min(1).max(20),
  startDate: z.string().regex(dateRegex).optional(),
  reason: z.string().max(500).optional().nullable(),
});

const desasignarSchema = z.object({
  asignacionId: z.string().uuid(),
  endDate: z.string().regex(dateRegex).optional(),
  reason: z.string().max(500).optional().nullable(),
});

/* Check action: return existing assignment info without modifying */
const checkSchema = z.object({
  guardiaId: z.string().uuid(),
});

/**
 * Cleans pauta mensual entries for a guard from a date forward.
 * Removes the guard from planned slots (sets plannedGuardiaId to null).
 * Does NOT erase shiftCode — the series pattern stays painted.
 */
async function cleanPautaFromDate(
  tenantId: string,
  puestoId: string,
  slotNumber: number,
  guardiaId: string,
  fromDate: Date
) {
  // Remove guard from work days but keep shiftCode (series stays painted)
  const cleaned = await prisma.opsPautaMensual.updateMany({
    where: {
      tenantId,
      puestoId,
      slotNumber,
      plannedGuardiaId: guardiaId,
      date: { gte: fromDate },
    },
    data: {
      plannedGuardiaId: null,
    },
  });

  return cleaned.count;
}

/**
 * GET /api/ops/asignaciones
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = await ensureOpsAccess(ctx);
    if (forbidden) return forbidden;

    const installationId = request.nextUrl.searchParams.get("installationId") || undefined;
    const puestoId = request.nextUrl.searchParams.get("puestoId") || undefined;
    const guardiaId = request.nextUrl.searchParams.get("guardiaId") || undefined;
    const activeOnly = request.nextUrl.searchParams.get("activeOnly") !== "false";

    const asignaciones = await prisma.opsAsignacionGuardia.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(installationId ? { installationId } : {}),
        ...(puestoId ? { puestoId } : {}),
        ...(guardiaId ? { guardiaId } : {}),
        ...(activeOnly ? { isActive: true } : {}),
      },
      include: {
        guardia: {
          select: {
            id: true,
            code: true,
            status: true,
            lifecycleStatus: true,
            persona: {
              select: { firstName: true, lastName: true, rut: true },
            },
          },
        },
        puesto: {
          select: {
            id: true,
            name: true,
            shiftStart: true,
            shiftEnd: true,
            requiredGuards: true,
          },
        },
        installation: {
          select: {
            id: true,
            name: true,
            account: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ isActive: "desc" }, { startDate: "desc" }],
    });

    return NextResponse.json({ success: true, data: asignaciones });
  } catch (error) {
    console.error("[OPS] Error listing asignaciones:", error);
    return NextResponse.json(
      { success: false, error: "No se pudieron obtener las asignaciones" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ops/asignaciones
 * Actions: "asignar" (default), "desasignar", "check"
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = await ensureOpsAccess(ctx);
    if (forbidden) return forbidden;

    const rawBody = await request.json();
    const action = rawBody?.action as string;

    if (action === "desasignar") {
      return handleDesasignar(ctx, rawBody);
    }
    if (action === "check") {
      return handleCheck(ctx, rawBody);
    }

    // Default: asignar
    const parsed = asignarSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Datos inválidos" },
        { status: 400 }
      );
    }
    const body = parsed.data;

    // Validate guardia
    const guardia = await prisma.opsGuardia.findFirst({
      where: { id: body.guardiaId, tenantId: ctx.tenantId },
      select: { id: true, status: true, lifecycleStatus: true, isBlacklisted: true },
    });
    if (!guardia) {
      return NextResponse.json({ success: false, error: "Guardia no encontrado" }, { status: 404 });
    }
    if (!["seleccionado", "contratado_activo"].includes(guardia.lifecycleStatus)) {
      return NextResponse.json(
        { success: false, error: `Guardia debe estar en estado 'seleccionado' o 'contratado_activo' (actual: ${guardia.lifecycleStatus})` },
        { status: 400 }
      );
    }
    if (guardia.isBlacklisted) {
      return NextResponse.json(
        { success: false, error: "No se puede asignar un guardia en lista negra" },
        { status: 400 }
      );
    }

    // Validate puesto
    const puesto = await prisma.opsPuestoOperativo.findFirst({
      where: { id: body.puestoId, tenantId: ctx.tenantId },
      select: { id: true, installationId: true, requiredGuards: true },
    });
    if (!puesto) {
      return NextResponse.json({ success: false, error: "Puesto no encontrado" }, { status: 404 });
    }
    if (body.slotNumber > puesto.requiredGuards) {
      return NextResponse.json(
        { success: false, error: `Slot ${body.slotNumber} excede la dotación del puesto (${puesto.requiredGuards})` },
        { status: 400 }
      );
    }

    const startDate = body.startDate
      ? parseDateOnly(body.startDate)
      : parseDateOnly(toISODate(new Date()));

    // 1. If guardia already has active assignment → close it + clean pauta
    const existingGuardiaAssignment = await prisma.opsAsignacionGuardia.findFirst({
      where: { guardiaId: body.guardiaId, tenantId: ctx.tenantId, isActive: true },
    });

    if (existingGuardiaAssignment) {
      await prisma.opsAsignacionGuardia.update({
        where: { id: existingGuardiaAssignment.id },
        data: {
          isActive: false,
          endDate: startDate,
          reason: body.reason || "Traslado a otro puesto",
        },
      });

      // Clean pauta from startDate forward for the OLD assignment
      await cleanPautaFromDate(
        ctx.tenantId,
        existingGuardiaAssignment.puestoId,
        existingGuardiaAssignment.slotNumber,
        body.guardiaId,
        startDate
      );

      await createOpsAuditLog(ctx, "ops.asignacion.closed", "ops_asignacion", existingGuardiaAssignment.id, {
        guardiaId: body.guardiaId,
        previousPuestoId: existingGuardiaAssignment.puestoId,
        reason: body.reason || "Traslado a otro puesto",
        pautaCleaned: true,
      });
    }

    // 2. If slot is already occupied → close that assignment + clean pauta
    const existingSlotAssignment = await prisma.opsAsignacionGuardia.findFirst({
      where: {
        puestoId: body.puestoId,
        slotNumber: body.slotNumber,
        tenantId: ctx.tenantId,
        isActive: true,
      },
    });

    if (existingSlotAssignment) {
      await prisma.opsAsignacionGuardia.update({
        where: { id: existingSlotAssignment.id },
        data: {
          isActive: false,
          endDate: startDate,
          reason: "Reemplazado por otro guardia",
        },
      });

      // Clean pauta for the displaced guard
      await cleanPautaFromDate(
        ctx.tenantId,
        existingSlotAssignment.puestoId,
        existingSlotAssignment.slotNumber,
        existingSlotAssignment.guardiaId,
        startDate
      );
    }

    // 3. Create new assignment (no se exige serie pintada; se puede asignar y pintar después)
    const asignacion = await prisma.opsAsignacionGuardia.create({
      data: {
        tenantId: ctx.tenantId,
        guardiaId: body.guardiaId,
        puestoId: body.puestoId,
        slotNumber: body.slotNumber,
        installationId: puesto.installationId,
        startDate,
        isActive: true,
        reason: body.reason || "Asignación inicial",
        createdBy: ctx.userId,
      },
      include: {
        guardia: {
          select: {
            id: true,
            code: true,
            persona: { select: { firstName: true, lastName: true } },
          },
        },
        puesto: { select: { id: true, name: true } },
      },
    });

    // 4. Write plannedGuardiaId on all "T" days from startDate forward (si ya hay serie pintada)
    const pautaUpdated = await prisma.opsPautaMensual.updateMany({
      where: {
        tenantId: ctx.tenantId,
        puestoId: body.puestoId,
        slotNumber: body.slotNumber,
        shiftCode: "T",
        date: { gte: startDate },
      },
      data: {
        plannedGuardiaId: body.guardiaId,
      },
    });

    // Also update the serie to reference the new guard
    await prisma.opsSerieAsignacion.updateMany({
      where: {
        tenantId: ctx.tenantId,
        puestoId: body.puestoId,
        slotNumber: body.slotNumber,
        isActive: true,
      },
      data: { guardiaId: body.guardiaId },
    });

    // 5. Auto-sync currentInstallationId on guard profile
    await prisma.opsGuardia.update({
      where: { id: body.guardiaId },
      data: { currentInstallationId: puesto.installationId },
    });

    // If the displaced guard has no other active assignments, clear their currentInstallationId
    if (existingSlotAssignment && existingSlotAssignment.guardiaId !== body.guardiaId) {
      const otherActive = await prisma.opsAsignacionGuardia.findFirst({
        where: {
          guardiaId: existingSlotAssignment.guardiaId,
          tenantId: ctx.tenantId,
          isActive: true,
        },
      });
      if (!otherActive) {
        await prisma.opsGuardia.update({
          where: { id: existingSlotAssignment.guardiaId },
          data: { currentInstallationId: null },
        });
      }
    }

    await createOpsAuditLog(ctx, "ops.asignacion.created", "ops_asignacion", asignacion.id, {
      guardiaId: body.guardiaId,
      puestoId: body.puestoId,
      slotNumber: body.slotNumber,
      startDate: toISODate(startDate),
      pautaUpdated: pautaUpdated.count,
    });

    return NextResponse.json({ success: true, data: asignacion }, { status: 201 });
  } catch (error) {
    console.error("[OPS] Error creating asignacion:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo crear la asignación" },
      { status: 500 }
    );
  }
}

/**
 * Desasignar: close assignment + clean pauta from endDate forward
 */
async function handleDesasignar(ctx: AuthContext, rawBody: unknown) {
  const parsed = desasignarSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || "Datos inválidos" },
      { status: 400 }
    );
  }
  const body = parsed.data;

  const asignacion = await prisma.opsAsignacionGuardia.findFirst({
    where: { id: body.asignacionId, tenantId: ctx.tenantId, isActive: true },
  });
  if (!asignacion) {
    return NextResponse.json(
      { success: false, error: "Asignación activa no encontrada" },
      { status: 404 }
    );
  }

  const endDate = body.endDate
    ? parseDateOnly(body.endDate)
    : parseDateOnly(toISODate(new Date()));

  // Close assignment
  const updated = await prisma.opsAsignacionGuardia.update({
    where: { id: asignacion.id },
    data: {
      isActive: false,
      endDate,
      reason: body.reason || "Desasignado manualmente",
    },
  });

  // Clean pauta from endDate forward
  const cleanedCount = await cleanPautaFromDate(
    ctx.tenantId,
    asignacion.puestoId,
    asignacion.slotNumber,
    asignacion.guardiaId,
    endDate
  );

  // Auto-sync: if guard has no other active assignments, clear currentInstallationId
  const otherActive = await prisma.opsAsignacionGuardia.findFirst({
    where: {
      guardiaId: asignacion.guardiaId,
      tenantId: ctx.tenantId,
      isActive: true,
    },
  });
  if (!otherActive) {
    await prisma.opsGuardia.update({
      where: { id: asignacion.guardiaId },
      data: { currentInstallationId: null },
    });
  }

  await createOpsAuditLog(ctx, "ops.asignacion.closed", "ops_asignacion", asignacion.id, {
    guardiaId: asignacion.guardiaId,
    puestoId: asignacion.puestoId,
    reason: body.reason || "Desasignado manualmente",
    pautaCleaned: cleanedCount,
  });

  return NextResponse.json({ success: true, data: { ...updated, pautaCleaned: cleanedCount } });
}

/**
 * Check: returns existing assignment info for a guard (for UI warnings)
 */
async function handleCheck(ctx: AuthContext, rawBody: unknown) {
  const parsed = checkSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "guardiaId inválido" },
      { status: 400 }
    );
  }

  const existing = await prisma.opsAsignacionGuardia.findFirst({
    where: { guardiaId: parsed.data.guardiaId, tenantId: ctx.tenantId, isActive: true },
    include: {
      puesto: { select: { id: true, name: true } },
      installation: {
        select: {
          id: true,
          name: true,
          account: { select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      hasActiveAssignment: !!existing,
      assignment: existing
        ? {
            id: existing.id,
            puestoName: existing.puesto.name,
            installationName: existing.installation.name,
            accountName: existing.installation.account?.name ?? null,
            slotNumber: existing.slotNumber,
            startDate: existing.startDate,
          }
        : null,
    },
  });
}
