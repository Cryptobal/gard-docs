import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, requireAuth, unauthorized } from "@/lib/api-auth";
import { generatePautaSchema } from "@/lib/validations/ops";
import {
  createOpsAuditLog,
  ensureOpsAccess,
  getMonthDateRange,
  getWeekdayKey,
  listDatesBetween,
} from "@/lib/ops";

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = ensureOpsAccess(ctx);
    if (forbidden) return forbidden;

    const parsed = await parseBody(request, generatePautaSchema);
    if (parsed.error) return parsed.error;
    const body = parsed.data;

    const installation = await prisma.crmInstallation.findFirst({
      where: { id: body.installationId, tenantId: ctx.tenantId },
      select: { id: true, name: true },
    });
    if (!installation) {
      return NextResponse.json(
        { success: false, error: "Instalación no encontrada" },
        { status: 404 }
      );
    }

    if (body.defaultGuardiaId) {
      const guardia = await prisma.opsGuardia.findFirst({
        where: { id: body.defaultGuardiaId, tenantId: ctx.tenantId },
        select: { id: true, isBlacklisted: true, status: true },
      });
      if (!guardia) {
        return NextResponse.json(
          { success: false, error: "Guardia por defecto no encontrado" },
          { status: 404 }
        );
      }
      if (guardia.isBlacklisted || guardia.status !== "active") {
        return NextResponse.json(
          { success: false, error: "El guardia por defecto debe estar activo y fuera de lista negra" },
          { status: 400 }
        );
      }
    }

    const puestos = await prisma.opsPuestoOperativo.findMany({
      where: {
        tenantId: ctx.tenantId,
        installationId: body.installationId,
        active: true,
      },
      select: {
        id: true,
        weekdays: true,
      },
      orderBy: { createdAt: "asc" },
    });

    if (puestos.length === 0) {
      return NextResponse.json(
        { success: false, error: "No hay puestos activos para la instalación seleccionada" },
        { status: 400 }
      );
    }

    const { start, end } = getMonthDateRange(body.year, body.month);
    const monthDates = listDatesBetween(start, end);

    const data = monthDates.flatMap((date) => {
      const weekday = getWeekdayKey(date);
      return puestos
        .filter((puesto) => puesto.weekdays.includes(weekday))
        .map((puesto) => ({
          tenantId: ctx.tenantId,
          installationId: body.installationId,
          puestoId: puesto.id,
          date,
          plannedGuardiaId: body.defaultGuardiaId ?? null,
          status: "planificado",
          createdBy: ctx.userId,
        }));
    });

    if (data.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          created: 0,
          message: "No se generaron filas: revisa días activos en puestos",
        },
      });
    }

    if (body.overwrite) {
      await prisma.opsPautaMensual.deleteMany({
        where: {
          tenantId: ctx.tenantId,
          installationId: body.installationId,
          date: { gte: start, lte: end },
        },
      });

      await prisma.opsPautaMensual.createMany({
        data,
        skipDuplicates: false,
      });
    } else {
      await prisma.opsPautaMensual.createMany({
        data,
        skipDuplicates: true,
      });
    }

    await createOpsAuditLog(ctx, "ops.pauta.generated", "ops_pauta", undefined, {
      installationId: body.installationId,
      month: body.month,
      year: body.year,
      overwrite: body.overwrite,
      generatedRows: data.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        created: data.length,
        overwrite: body.overwrite,
      },
    });
  } catch (error) {
    console.error("[OPS] Error generating pauta mensual:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo generar la pauta mensual" },
      { status: 500 }
    );
  }
}
