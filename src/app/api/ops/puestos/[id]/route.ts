import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, requireAuth, unauthorized } from "@/lib/api-auth";
import { updatePuestoSchema } from "@/lib/validations/ops";
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

    const existing = await prisma.opsPuestoOperativo.findFirst({
      where: { id, tenantId: ctx.tenantId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Puesto no encontrado" },
        { status: 404 }
      );
    }

    const parsed = await parseBody(request, updatePuestoSchema);
    if (parsed.error) return parsed.error;

    const updated = await prisma.opsPuestoOperativo.update({
      where: { id },
      data: parsed.data,
    });

    await createOpsAuditLog(ctx, "ops.puesto.updated", "ops_puesto", id, parsed.data);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[OPS] Error updating puesto:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo actualizar el puesto" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = ensureOpsAccess(ctx);
    if (forbidden) return forbidden;

    const { id } = await params;

    const existing = await prisma.opsPuestoOperativo.findFirst({
      where: { id, tenantId: ctx.tenantId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Puesto no encontrado" },
        { status: 404 }
      );
    }

    await prisma.opsPuestoOperativo.delete({ where: { id } });

    await createOpsAuditLog(ctx, "ops.puesto.deleted", "ops_puesto", id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[OPS] Error deleting puesto:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo eliminar el puesto" },
      { status: 500 }
    );
  }
}
