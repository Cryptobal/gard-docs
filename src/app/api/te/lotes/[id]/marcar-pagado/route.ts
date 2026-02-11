import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { createOpsAuditLog, ensureOpsAccess } from "@/lib/ops";

type Params = { id: string };

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = ensureOpsAccess(ctx);
    if (forbidden) return forbidden;

    const { id } = await params;

    const lote = await prisma.opsPagoTeLote.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        items: {
          select: {
            id: true,
            turnoExtraId: true,
          },
        },
      },
    });
    if (!lote) {
      return NextResponse.json(
        { success: false, error: "Lote no encontrado" },
        { status: 404 }
      );
    }

    if (lote.status === "paid") {
      return NextResponse.json(
        { success: false, error: "El lote ya fue marcado como pagado" },
        { status: 400 }
      );
    }

    const now = new Date();
    const turnoExtraIds = lote.items.map((item) => item.turnoExtraId);

    const updated = await prisma.$transaction(async (tx) => {
      const updatedLote = await tx.opsPagoTeLote.update({
        where: { id: lote.id },
        data: {
          status: "paid",
          paidAt: now,
        },
      });

      await tx.opsPagoTeItem.updateMany({
        where: {
          loteId: lote.id,
          tenantId: ctx.tenantId,
        },
        data: {
          status: "paid",
          paidAt: now,
        },
      });

      if (turnoExtraIds.length > 0) {
        await tx.opsTurnoExtra.updateMany({
          where: {
            id: { in: turnoExtraIds },
            tenantId: ctx.tenantId,
          },
          data: {
            status: "paid",
            paidAt: now,
          },
        });
      }

      return updatedLote;
    });

    await createOpsAuditLog(ctx, "te.lote.paid", "te_lote", lote.id, {
      items: lote.items.length,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[TE] Error marking lote as paid:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo marcar el lote como pagado" },
      { status: 500 }
    );
  }
}
