import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, requireAuth, unauthorized } from "@/lib/api-auth";
import { updateBlacklistSchema } from "@/lib/validations/ops";
import { createOpsAuditLog, ensureOpsCapability } from "@/lib/ops";
import { lifecycleToLegacyStatus } from "@/lib/personas";

type Params = { id: string };

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = ensureOpsCapability(ctx, "guardias_blacklist");
    if (forbidden) return forbidden;

    const { id } = await params;
    const parsed = await parseBody(request, updateBlacklistSchema);
    if (parsed.error) return parsed.error;
    const body = parsed.data;

    const guardia = await prisma.opsGuardia.findFirst({
      where: { id, tenantId: ctx.tenantId },
      select: { id: true, isBlacklisted: true, lifecycleStatus: true },
    });
    if (!guardia) {
      return NextResponse.json(
        { success: false, error: "Guardia no encontrado" },
        { status: 404 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedGuardia = await tx.opsGuardia.update({
        where: { id },
        data: {
          isBlacklisted: body.isBlacklisted,
          blacklistReason: body.isBlacklisted ? body.reason ?? "Sin detalle" : null,
          blacklistedAt: body.isBlacklisted ? new Date() : null,
          lifecycleStatus:
            body.isBlacklisted && guardia.lifecycleStatus === "contratado_activo"
              ? "inactivo"
              : undefined,
          status:
            body.isBlacklisted && guardia.lifecycleStatus === "contratado_activo"
              ? lifecycleToLegacyStatus("inactivo")
              : undefined,
        },
        include: {
          persona: {
            select: { firstName: true, lastName: true, rut: true },
          },
        },
      });

      await tx.opsGuardiaHistory.create({
        data: {
          tenantId: ctx.tenantId,
          guardiaId: id,
          eventType: body.isBlacklisted ? "blacklist_on" : "blacklist_off",
          previousValue: {
            isBlacklisted: guardia.isBlacklisted,
          },
          newValue: {
            isBlacklisted: body.isBlacklisted,
            reason: body.reason ?? null,
          },
          reason: body.reason ?? null,
          createdBy: ctx.userId,
        },
      });

      return updatedGuardia;
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
