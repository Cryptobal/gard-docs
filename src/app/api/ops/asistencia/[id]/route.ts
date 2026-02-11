import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, requireAuth, unauthorized } from "@/lib/api-auth";
import { updateAsistenciaSchema } from "@/lib/validations/ops";
import {
  createOpsAuditLog,
  decimalToNumber,
  ensureOpsAccess,
  parseDateOnly,
} from "@/lib/ops";

type Params = { id: string };

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = ensureOpsAccess(ctx);
    if (forbidden) return forbidden;

    const { id } = await params;

    const parsed = await parseBody(request, updateAsistenciaSchema);
    if (parsed.error) return parsed.error;
    const body = parsed.data;

    const asistencia = await prisma.opsAsistenciaDiaria.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        puesto: {
          select: {
            id: true,
            installationId: true,
            teMontoClp: true,
          },
        },
        installation: {
          select: {
            id: true,
            teMontoClp: true,
          },
        },
      },
    });
    if (!asistencia) {
      return NextResponse.json(
        { success: false, error: "Asistencia no encontrada" },
        { status: 404 }
      );
    }

    const guardiaIdsToValidate = [body.actualGuardiaId, body.replacementGuardiaId].filter(
      (value): value is string => Boolean(value)
    );
    if (guardiaIdsToValidate.length > 0) {
      const guardias = await prisma.opsGuardia.findMany({
        where: {
          id: { in: guardiaIdsToValidate },
          tenantId: ctx.tenantId,
        },
        select: { id: true, status: true, isBlacklisted: true },
      });
      if (guardias.length !== guardiaIdsToValidate.length) {
        return NextResponse.json(
          { success: false, error: "Uno o más guardias no existen" },
          { status: 404 }
        );
      }
      const invalid = guardias.find((g) => g.status !== "active" || g.isBlacklisted);
      if (invalid) {
        return NextResponse.json(
          { success: false, error: "No se puede asignar guardia inactivo o en lista negra" },
          { status: 400 }
        );
      }
    }

    const nextStatus =
      body.attendanceStatus ?? (body.replacementGuardiaId ? "reemplazo" : asistencia.attendanceStatus);
    const nextReplacementGuardiaId =
      body.replacementGuardiaId !== undefined
        ? body.replacementGuardiaId
        : asistencia.replacementGuardiaId;
    const nextActualGuardiaId =
      body.actualGuardiaId !== undefined
        ? body.actualGuardiaId
        : body.replacementGuardiaId ?? asistencia.actualGuardiaId;

    const existingTe = await prisma.opsTurnoExtra.findFirst({
      where: { tenantId: ctx.tenantId, asistenciaId: asistencia.id },
      select: { id: true, status: true, guardiaId: true },
    });

    if (
      existingTe &&
      (existingTe.status === "approved" || existingTe.status === "paid") &&
      nextReplacementGuardiaId &&
      existingTe.guardiaId !== nextReplacementGuardiaId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No se puede cambiar el guardia de un turno extra ya aprobado/pagado. Rechaza o crea uno nuevo.",
        },
        { status: 400 }
      );
    }

    const checkInAt = body.checkInAt ? new Date(body.checkInAt) : undefined;
    const checkOutAt = body.checkOutAt ? new Date(body.checkOutAt) : undefined;

    const updatedAsistencia = await prisma.opsAsistenciaDiaria.update({
      where: { id: asistencia.id },
      data: {
        attendanceStatus: nextStatus,
        actualGuardiaId: nextActualGuardiaId,
        replacementGuardiaId: nextReplacementGuardiaId,
        notes: body.notes !== undefined ? body.notes : asistencia.notes,
        checkInAt: body.checkInAt !== undefined ? checkInAt : asistencia.checkInAt,
        checkOutAt: body.checkOutAt !== undefined ? checkOutAt : asistencia.checkOutAt,
      },
    });

    let teId: string | null = existingTe?.id ?? null;
    const shouldGenerateTe =
      nextStatus === "reemplazo" && Boolean(updatedAsistencia.replacementGuardiaId);

    if (shouldGenerateTe && updatedAsistencia.replacementGuardiaId) {
      const amountClp =
        decimalToNumber(asistencia.puesto.teMontoClp) ||
        decimalToNumber(asistencia.installation.teMontoClp) ||
        0;

      const date = parseDateOnly(updatedAsistencia.date.toISOString().slice(0, 10));

      const te = existingTe
        ? await prisma.opsTurnoExtra.update({
            where: { id: existingTe.id },
            data: {
              installationId: asistencia.installationId,
              puestoId: asistencia.puestoId,
              guardiaId: updatedAsistencia.replacementGuardiaId,
              date,
              amountClp,
              status: existingTe.status === "paid" ? "paid" : "pending",
              rejectedAt: null,
              rejectedBy: null,
              rejectionReason: null,
            },
          })
        : await prisma.opsTurnoExtra.create({
            data: {
              tenantId: ctx.tenantId,
              asistenciaId: asistencia.id,
              installationId: asistencia.installationId,
              puestoId: asistencia.puestoId,
              guardiaId: updatedAsistencia.replacementGuardiaId,
              date,
              amountClp,
              status: "pending",
              createdBy: ctx.userId,
            },
          });

      teId = te.id;

      await prisma.opsAsistenciaDiaria.update({
        where: { id: asistencia.id },
        data: { teGenerated: true },
      });
    } else if (existingTe && existingTe.status === "pending") {
      await prisma.opsTurnoExtra.delete({ where: { id: existingTe.id } });
      teId = null;
      await prisma.opsAsistenciaDiaria.update({
        where: { id: asistencia.id },
        data: { teGenerated: false },
      });
    }

    const result = await prisma.opsAsistenciaDiaria.findFirst({
      where: { id: asistencia.id, tenantId: ctx.tenantId },
      include: {
        puesto: {
          select: { id: true, name: true, shiftStart: true, shiftEnd: true, teMontoClp: true },
        },
        plannedGuardia: {
          select: { id: true, code: true, persona: { select: { firstName: true, lastName: true } } },
        },
        actualGuardia: {
          select: { id: true, code: true, persona: { select: { firstName: true, lastName: true } } },
        },
        replacementGuardia: {
          select: { id: true, code: true, persona: { select: { firstName: true, lastName: true } } },
        },
        turnosExtra: {
          select: { id: true, status: true, amountClp: true, guardiaId: true },
        },
      },
    });

    await createOpsAuditLog(ctx, "ops.asistencia.updated", "ops_asistencia", asistencia.id, {
      attendanceStatus: nextStatus,
      replacementGuardiaId: updatedAsistencia.replacementGuardiaId,
      turnoExtraId: teId,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[OPS] Error updating asistencia:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo actualizar la asistencia" },
      { status: 500 }
    );
  }
}
