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

    const existing = await prisma.opsTurnoExtra.findFirst({
      where: { id, tenantId: ctx.tenantId },
      select: { id: true, status: true },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Turno extra no encontrado" },
        { status: 404 }
      );
    }
    if (existing.status === "paid") {
      return NextResponse.json(
        { success: false, error: "No se puede aprobar un turno extra ya pagado" },
        { status: 400 }
      );
    }

    const turno = await prisma.opsTurnoExtra.update({
      where: { id },
      data: {
        status: "approved",
        approvedBy: ctx.userId,
        approvedAt: new Date(),
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
      },
    });

    await createOpsAuditLog(ctx, "te.approved", "te_turno", id);

    return NextResponse.json({ success: true, data: turno });
  } catch (error) {
    console.error("[TE] Error approving turno extra:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo aprobar el turno extra" },
      { status: 500 }
    );
  }
}
