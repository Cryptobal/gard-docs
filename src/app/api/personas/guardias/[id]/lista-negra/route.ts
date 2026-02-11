import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, requireAuth, unauthorized } from "@/lib/api-auth";
import { updateBlacklistSchema } from "@/lib/validations/ops";
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
    const parsed = await parseBody(request, updateBlacklistSchema);
    if (parsed.error) return parsed.error;
    const body = parsed.data;

    const guardia = await prisma.opsGuardia.findFirst({
      where: { id, tenantId: ctx.tenantId },
      select: { id: true, isBlacklisted: true },
    });
    if (!guardia) {
      return NextResponse.json(
        { success: false, error: "Guardia no encontrado" },
        { status: 404 }
      );
    }

    const updated = await prisma.opsGuardia.update({
      where: { id },
      data: {
        isBlacklisted: body.isBlacklisted,
        blacklistReason: body.isBlacklisted ? body.reason ?? "Sin detalle" : null,
        blacklistedAt: body.isBlacklisted ? new Date() : null,
      },
      include: {
        persona: {
          select: { firstName: true, lastName: true, rut: true },
        },
      },
    });

    await createOpsAuditLog(ctx, "personas.guardia.blacklist_updated", "ops_guardia", id, {
      isBlacklisted: body.isBlacklisted,
      reason: body.reason ?? null,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[PERSONAS] Error updating blacklist:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo actualizar la lista negra" },
      { status: 500 }
    );
  }
}
