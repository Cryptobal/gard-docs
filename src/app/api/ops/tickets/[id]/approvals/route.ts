import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { ensureOpsAccess } from "@/lib/ops";
import type { TicketApproval } from "@/lib/tickets";

/**
 * GET  /api/ops/tickets/[id]/approvals — List approval records for a ticket
 * POST /api/ops/tickets/[id]/approvals — Submit an approval decision
 * Body: { decision: "approved" | "rejected", comment?: string }
 *
 * TODO: Replace with Prisma query when DB migration is ready
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

    const { id: _ticketId } = await params;

    // TODO: Replace with Prisma query when DB migration is ready
    const items: TicketApproval[] = [];

    return NextResponse.json({ success: true, data: { items } });
  } catch (error) {
    console.error("[OPS] Error listing ticket approvals:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo obtener las aprobaciones del ticket" },
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

    const { id: ticketId } = await params;
    const body = await request.json();

    if (!body.decision || !["approved", "rejected"].includes(body.decision)) {
      return NextResponse.json(
        { success: false, error: "Campo requerido: decision ('approved' | 'rejected')" },
        { status: 400 },
      );
    }

    // TODO: Replace with Prisma query when DB migration is ready
    const now = new Date().toISOString();
    const stubApproval: TicketApproval = {
      id: crypto.randomUUID(),
      ticketId,
      stepOrder: 1,
      stepLabel: "Aprobación stub",
      approverType: "group",
      approverGroupId: null,
      approverGroupName: null,
      approverUserId: null,
      approverUserName: null,
      decision: body.decision,
      decidedById: ctx.userId,
      decidedByName: ctx.userEmail ?? null,
      comment: body.comment ?? null,
      decidedAt: now,
      createdAt: now,
    };

    return NextResponse.json({ success: true, data: stubApproval }, { status: 201 });
  } catch (error) {
    console.error("[OPS] Error creating ticket approval:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo registrar la aprobación" },
      { status: 500 },
    );
  }
}
