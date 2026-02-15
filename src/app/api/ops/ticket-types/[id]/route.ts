import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { ensureOpsAccess } from "@/lib/ops";
import type { TicketType } from "@/lib/tickets";

/**
 * GET    /api/ops/ticket-types/[id] — Single ticket type detail
 * PATCH  /api/ops/ticket-types/[id] — Partial update
 * DELETE /api/ops/ticket-types/[id] — Deactivate / delete
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

    const { id } = await params;

    // TODO: Replace with Prisma query when DB migration is ready
    const now = new Date().toISOString();
    const stubType: TicketType = {
      id,
      tenantId: ctx.tenantId,
      slug: "stub_type",
      name: "Stub ticket type",
      description: null,
      origin: "internal",
      requiresApproval: false,
      assignedTeam: "ops",
      defaultPriority: "p3",
      slaHours: 72,
      icon: null,
      isActive: true,
      sortOrder: 1,
      approvalSteps: [],
      createdAt: now,
      updatedAt: now,
    };

    return NextResponse.json({ success: true, data: stubType });
  } catch (error) {
    console.error("[OPS] Error fetching ticket type:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo obtener el tipo de ticket" },
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
    const body = await request.json();

    // TODO: Replace with Prisma query when DB migration is ready
    const now = new Date().toISOString();
    const stubType: TicketType = {
      id,
      tenantId: ctx.tenantId,
      slug: body.slug ?? "stub_type",
      name: body.name ?? "Stub ticket type",
      description: body.description ?? null,
      origin: body.origin ?? "internal",
      requiresApproval: body.requiresApproval ?? false,
      assignedTeam: body.assignedTeam ?? "ops",
      defaultPriority: body.defaultPriority ?? "p3",
      slaHours: body.slaHours ?? 72,
      icon: body.icon ?? null,
      isActive: body.isActive ?? true,
      sortOrder: body.sortOrder ?? 1,
      approvalSteps: [],
      createdAt: now,
      updatedAt: now,
    };

    return NextResponse.json({ success: true, data: stubType });
  } catch (error) {
    console.error("[OPS] Error updating ticket type:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo actualizar el tipo de ticket" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = await ensureOpsAccess(ctx);
    if (forbidden) return forbidden;

    const { id } = await params;

    // TODO: Replace with Prisma query when DB migration is ready
    return NextResponse.json({ success: true, data: { id, deleted: true } });
  } catch (error) {
    console.error("[OPS] Error deleting ticket type:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo eliminar el tipo de ticket" },
      { status: 500 },
    );
  }
}
