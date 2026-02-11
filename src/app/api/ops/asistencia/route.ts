import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { createOpsAuditLog, ensureOpsAccess, parseDateOnly, toISODate } from "@/lib/ops";

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = ensureOpsAccess(ctx);
    if (forbidden) return forbidden;

    const installationId = request.nextUrl.searchParams.get("installationId") || undefined;
    const dateRaw = request.nextUrl.searchParams.get("date") || toISODate(new Date());

    if (!installationId) {
      return NextResponse.json(
        { success: false, error: "installationId es requerido" },
        { status: 400 }
      );
    }

    const installation = await prisma.crmInstallation.findFirst({
      where: { id: installationId, tenantId: ctx.tenantId },
      select: { id: true },
    });
    if (!installation) {
      return NextResponse.json(
        { success: false, error: "Instalación no encontrada" },
        { status: 404 }
      );
    }

    const date = parseDateOnly(dateRaw);

    const pauta = await prisma.opsPautaMensual.findMany({
      where: {
        tenantId: ctx.tenantId,
        installationId,
        date,
      },
      select: {
        puestoId: true,
        plannedGuardiaId: true,
      },
    });

    if (pauta.length > 0) {
      await prisma.opsAsistenciaDiaria.createMany({
        data: pauta.map((item) => ({
          tenantId: ctx.tenantId,
          installationId,
          puestoId: item.puestoId,
          date,
          plannedGuardiaId: item.plannedGuardiaId,
          attendanceStatus: "pendiente",
          createdBy: ctx.userId,
        })),
        skipDuplicates: true,
      });
    }

    const asistencia = await prisma.opsAsistenciaDiaria.findMany({
      where: {
        tenantId: ctx.tenantId,
        installationId,
        date,
      },
      include: {
        puesto: {
          select: {
            id: true,
            name: true,
            shiftStart: true,
            shiftEnd: true,
            teMontoClp: true,
          },
        },
        plannedGuardia: {
          select: {
            id: true,
            code: true,
            persona: { select: { firstName: true, lastName: true, rut: true } },
          },
        },
        actualGuardia: {
          select: {
            id: true,
            code: true,
            persona: { select: { firstName: true, lastName: true, rut: true } },
          },
        },
        replacementGuardia: {
          select: {
            id: true,
            code: true,
            persona: { select: { firstName: true, lastName: true, rut: true } },
          },
        },
        turnosExtra: {
          select: {
            id: true,
            status: true,
            amountClp: true,
            guardiaId: true,
          },
        },
      },
      orderBy: [{ puesto: { name: "asc" } }],
    });

    return NextResponse.json({
      success: true,
      data: {
        installationId,
        date: dateRaw,
        items: asistencia,
      },
    });
  } catch (error) {
    console.error("[OPS] Error listing asistencia:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo obtener la asistencia diaria" },
      { status: 500 }
    );
  }
}
