import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { ensureOpsAccess } from "@/lib/ops";

/**
 * POST /api/ops/tickets/[id]/transition — Change ticket status
 * Body: { status: TicketStatus, resolutionNotes?: string }
 *
 * Validates transitions: open→in_progress, in_progress→resolved, etc.
 */
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

    if (!body.status) {
      return NextResponse.json(
        { success: false, error: "status es requerido" },
        { status: 400 },
      );
    }

    // TODO (Local phase): Validate transition, update, log in audit
    return NextResponse.json(
      { success: false, error: `Ticket ${id} no encontrado (stub)` },
      { status: 404 },
    );
  } catch (error) {
    console.error("[OPS] Error transitioning ticket:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo cambiar el estado del ticket" },
      { status: 500 },
    );
  }
}
