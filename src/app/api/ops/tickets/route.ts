import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { ensureOpsAccess } from "@/lib/ops";
import type { Ticket } from "@/lib/tickets";

/**
 * GET /api/ops/tickets — List tickets
 * Query params: status, priority, assignedTeam, categoryId, installationId, search
 *
 * POST /api/ops/tickets — Create a ticket
 * Body: { categoryId, title, description?, priority?, installationId?, tags?, source?, sourceGuardEventId? }
 *
 * TODO (Local phase): Replace stubs with Prisma queries on OpsTicket
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = await ensureOpsAccess(ctx);
    if (forbidden) return forbidden;

    // STUB: return empty list until DB migration
    const items: Ticket[] = [];

    return NextResponse.json({
      success: true,
      data: { items, total: 0 },
    });
  } catch (error) {
    console.error("[OPS] Error listing tickets:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo obtener los tickets" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = await ensureOpsAccess(ctx);
    if (forbidden) return forbidden;

    const body = await request.json();

    if (!body.categoryId || !body.title) {
      return NextResponse.json(
        { success: false, error: "Campos requeridos: categoryId, title" },
        { status: 400 },
      );
    }

    // TODO (Local phase): Create in DB, calculate SLA, generate code
    const now = new Date().toISOString();
    const stubTicket: Ticket = {
      id: crypto.randomUUID(),
      tenantId: ctx.tenantId,
      code: `TK-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-0001`,
      categoryId: body.categoryId,
      status: "open",
      priority: body.priority ?? "p3",
      title: body.title,
      description: body.description ?? null,
      assignedTeam: body.assignedTeam ?? "ops",
      ticketTypeId: body.ticketTypeId ?? null,
      assignedTo: null,
      installationId: body.installationId ?? null,
      source: body.source ?? "manual",
      sourceLogId: null,
      sourceGuardEventId: body.sourceGuardEventId ?? null,
      guardiaId: body.guardiaId ?? null,
      reportedBy: ctx.userId,
      slaDueAt: null,
      slaBreached: false,
      resolvedAt: null,
      closedAt: null,
      resolutionNotes: null,
      tags: body.tags ?? [],
      currentApprovalStep: null,
      approvalStatus: null,
      createdAt: now,
      updatedAt: now,
      commentsCount: 0,
      attachmentsCount: 0,
    };

    return NextResponse.json({ success: true, data: stubTicket }, { status: 201 });
  } catch (error) {
    console.error("[OPS] Error creating ticket:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo crear el ticket" },
      { status: 500 },
    );
  }
}
