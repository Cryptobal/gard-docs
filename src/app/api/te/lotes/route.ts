import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, requireAuth, unauthorized } from "@/lib/api-auth";
import { createLoteTeSchema } from "@/lib/validations/ops";
import {
  buildTeBatchCode,
  createOpsAuditLog,
  ensureOpsAccess,
  parseDateOnly,
} from "@/lib/ops";

export async function GET() {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = ensureOpsAccess(ctx);
    if (forbidden) return forbidden;

    const lotes = await prisma.opsPagoTeLote.findMany({
      where: { tenantId: ctx.tenantId },
      include: {
        items: {
          select: {
            id: true,
            amountClp: true,
            status: true,
            turnoExtraId: true,
            guardiaId: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, data: lotes });
  } catch (error) {
    console.error("[TE] Error listing lotes:", error);
    return NextResponse.json(
      { success: false, error: "No se pudieron obtener los lotes de pago" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = ensureOpsAccess(ctx);
    if (forbidden) return forbidden;

    const parsed = await parseBody(request, createLoteTeSchema);
    if (parsed.error) return parsed.error;
    const body = parsed.data;

    const weekStart = parseDateOnly(body.weekStart);
    const weekEnd = parseDateOnly(body.weekEnd);
    if (weekStart > weekEnd) {
      return NextResponse.json(
        { success: false, error: "weekStart no puede ser mayor que weekEnd" },
        { status: 400 }
      );
    }

    const approvedTurnos = await prisma.opsTurnoExtra.findMany({
      where: {
        tenantId: ctx.tenantId,
        status: "approved",
        date: {
          gte: weekStart,
          lte: weekEnd,
        },
        paymentItems: {
          none: {},
        },
      },
      select: {
        id: true,
        guardiaId: true,
        amountClp: true,
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });

    if (approvedTurnos.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No hay turnos extra aprobados sin lote en el rango seleccionado",
        },
        { status: 400 }
      );
    }

    const baseCode = buildTeBatchCode(weekStart);
    const existingCount = await prisma.opsPagoTeLote.count({
      where: {
        tenantId: ctx.tenantId,
        code: {
          startsWith: baseCode,
        },
      },
    });
    const code =
      existingCount > 0
        ? `${baseCode}-${String(existingCount + 1).padStart(2, "0")}`
        : baseCode;

    const totalAmountClp = approvedTurnos.reduce(
      (acc, item) => acc + Number(item.amountClp),
      0
    );

    const lote = await prisma.$transaction(async (tx) => {
      const createdLote = await tx.opsPagoTeLote.create({
        data: {
          tenantId: ctx.tenantId,
          code,
          weekStart,
          weekEnd,
          status: "draft",
          totalAmountClp,
          createdBy: ctx.userId,
        },
      });

      await tx.opsPagoTeItem.createMany({
        data: approvedTurnos.map((turno) => ({
          tenantId: ctx.tenantId,
          loteId: createdLote.id,
          turnoExtraId: turno.id,
          guardiaId: turno.guardiaId,
          amountClp: turno.amountClp,
          status: "pending",
        })),
      });

      return tx.opsPagoTeLote.findUnique({
        where: { id: createdLote.id },
        include: {
          items: {
            select: {
              id: true,
              turnoExtraId: true,
              guardiaId: true,
              amountClp: true,
              status: true,
            },
          },
        },
      });
    });

    await createOpsAuditLog(ctx, "te.lote.created", "te_lote", lote?.id, {
      weekStart: body.weekStart,
      weekEnd: body.weekEnd,
      items: approvedTurnos.length,
      totalAmountClp,
      code,
    });

    return NextResponse.json(
      {
        success: true,
        data: lote,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[TE] Error creating lote:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo crear el lote de pago" },
      { status: 500 }
    );
  }
}
