import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { ensureOpsAccess } from "@/lib/ops";

/**
 * GET /api/ops/tickets/[id] — Ticket detail (includes comments + attachments)
 * PATCH /api/ops/tickets/[id] — Update ticket fields
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
    return NextResponse.json(
      { success: false, error: `Ticket ${id} no encontrado (stub)` },
      { status: 404 },
    );
  } catch (error) {
    console.error("[OPS] Error fetching ticket:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo obtener el ticket" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = await ensureOpsAccess(ctx);
    if (forbidden) return forbidden;

    const { id } = await params;
    const _body = await request.json();

    return NextResponse.json(
      { success: false, error: `Ticket ${id} no encontrado (stub)` },
      { status: 404 },
    );
  } catch (error) {
    console.error("[OPS] Error updating ticket:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo actualizar el ticket" },
      { status: 500 },
    );
  }
}
