import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, requireAuth, unauthorized } from "@/lib/api-auth";
import { updateGuardiaSchema } from "@/lib/validations/ops";
import { createOpsAuditLog, ensureOpsAccess } from "@/lib/ops";

type Params = { id: string };

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = ensureOpsAccess(ctx);
    if (forbidden) return forbidden;

    const { id } = await params;

    const guardia = await prisma.opsGuardia.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        persona: true,
        bankAccounts: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        },
        flags: {
          where: { active: true },
          orderBy: [{ createdAt: "desc" }],
        },
        comments: {
          orderBy: [{ createdAt: "desc" }],
          take: 20,
        },
      },
    });

    if (!guardia) {
      return NextResponse.json(
        { success: false, error: "Guardia no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: guardia });
  } catch (error) {
    console.error("[PERSONAS] Error fetching guardia:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo obtener el guardia" },
      { status: 500 }
    );
  }
}

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
    const parsed = await parseBody(request, updateGuardiaSchema);
    if (parsed.error) return parsed.error;
    const body = parsed.data;

    const existing = await prisma.opsGuardia.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: { persona: true },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Guardia no encontrado" },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.opsPersona.update({
        where: { id: existing.personaId },
        data: {
          firstName: body.firstName ?? undefined,
          lastName: body.lastName ?? undefined,
          rut: body.rut ?? undefined,
          email: body.email ?? undefined,
          phone: body.phone ?? undefined,
        },
      });

      return tx.opsGuardia.update({
        where: { id },
        data: {
          code: body.code ?? undefined,
          status: body.status ?? undefined,
        },
        include: {
          persona: true,
          bankAccounts: {
            orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
          },
        },
      });
    });

    await createOpsAuditLog(ctx, "personas.guardia.updated", "ops_guardia", id, {
      changes: body,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[PERSONAS] Error updating guardia:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo actualizar el guardia" },
      { status: 500 }
    );
  }
}
