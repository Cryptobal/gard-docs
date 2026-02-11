import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseBody, requireAuth, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { ensureOpsAccess, ensureOpsCapability } from "@/lib/ops";

type Params = { id: string };

const createCommentSchema = z.object({
  comment: z.string().trim().min(1, "Comentario requerido").max(2000),
});

async function ensureGuardia(tenantId: string, guardiaId: string) {
  return prisma.opsGuardia.findFirst({
    where: { id: guardiaId, tenantId },
    select: { id: true },
  });
}

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

    const guardia = await ensureGuardia(ctx.tenantId, id);
    if (!guardia) {
      return NextResponse.json({ success: false, error: "Guardia no encontrado" }, { status: 404 });
    }

    const comments = await prisma.opsComentarioGuardia.findMany({
      where: { tenantId: ctx.tenantId, guardiaId: id },
      orderBy: [{ createdAt: "desc" }],
      take: 100,
    });

    return NextResponse.json({ success: true, data: comments });
  } catch (error) {
    console.error("[PERSONAS] Error listing comments:", error);
    return NextResponse.json(
      { success: false, error: "No se pudieron obtener los comentarios" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = ensureOpsCapability(ctx, "guardias_manage");
    if (forbidden) return forbidden;
    const { id } = await params;

    const guardia = await ensureGuardia(ctx.tenantId, id);
    if (!guardia) {
      return NextResponse.json({ success: false, error: "Guardia no encontrado" }, { status: 404 });
    }

    const parsed = await parseBody(request, createCommentSchema);
    if (parsed.error) return parsed.error;

    const created = await prisma.opsComentarioGuardia.create({
      data: {
        tenantId: ctx.tenantId,
        guardiaId: id,
        comment: parsed.data.comment.trim(),
        createdBy: ctx.userId,
      },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error("[PERSONAS] Error creating comment:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo crear el comentario" },
      { status: 500 }
    );
  }
}
