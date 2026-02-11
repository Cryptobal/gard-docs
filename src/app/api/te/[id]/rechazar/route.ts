import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, requireAuth, unauthorized } from "@/lib/api-auth";
import { rejectTeSchema } from "@/lib/validations/ops";
import { createOpsAuditLog, ensureOpsAccess } from "@/lib/ops";

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
    const parsed = await parseBody(request, rejectTeSchema);
    if (parsed.error) return parsed.error;
    const body = parsed.data;

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
        { success: false, error: "No se puede rechazar un turno extra ya pagado" },
        { status: 400 }
      );
    }

    const turno = await prisma.opsTurnoExtra.update({
      where: { id },
      data: {
        status: "rejected",
        rejectedBy: ctx.userId,
        rejectedAt: new Date(),
        rejectionReason: body.reason ?? null,
      },
    });

    await createOpsAuditLog(ctx, "te.rejected", "te_turno", id, {
      reason: body.reason ?? null,
    });

    return NextResponse.json({ success: true, data: turno });
  } catch (error) {
    console.error("[TE] Error rejecting turno extra:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo rechazar el turno extra" },
      { status: 500 }
    );
  }
}
