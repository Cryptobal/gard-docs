import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { ensureOpsAccess } from "@/lib/ops";

/**
 * GET /api/ops/tickets/[id]/comments — List ticket comments
 * POST /api/ops/tickets/[id]/comments — Add comment
 * Body: { body: string, isInternal?: boolean }
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = await ensureOpsAccess(ctx);
    if (forbidden) return forbidden;

    const { id } = await params;
    return NextResponse.json({ success: true, data: { items: [] } });
  } catch (error) {
    console.error("[OPS] Error listing ticket comments:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo obtener los comentarios" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = await ensureOpsAccess(ctx);
    if (forbidden) return forbidden;

    const { id } = await params;
    const body = await request.json();

    if (!body.body) {
      return NextResponse.json(
        { success: false, error: "body es requerido" },
        { status: 400 },
      );
    }

    // TODO (Local phase): Create comment in DB
    return NextResponse.json(
      { success: false, error: `Ticket ${id} no encontrado (stub)` },
      { status: 404 },
    );
  } catch (error) {
    console.error("[OPS] Error adding ticket comment:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo agregar el comentario" },
      { status: 500 },
    );
  }
}
