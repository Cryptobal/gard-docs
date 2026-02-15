import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { ensureOpsAccess } from "@/lib/ops";
import {
  TICKET_TYPE_SEEDS,
  type TicketType,
  type TicketTypeApprovalStep,
} from "@/lib/tickets";

/**
 * GET /api/ops/ticket-types — List ticket types
 * Returns seed data mapped to TicketType objects (Cloud stub).
 *
 * POST /api/ops/ticket-types — Create a ticket type
 * Body: { slug, name, description?, origin, requiresApproval, assignedTeam, defaultPriority, slaHours, icon?, approvalChainGroupSlugs? }
 *
 * TODO: Replace with Prisma query when DB migration is ready
 */
export async function GET() {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = await ensureOpsAccess(ctx);
    if (forbidden) return forbidden;

    // TODO: Replace with Prisma query when DB migration is ready
    const items: TicketType[] = TICKET_TYPE_SEEDS.map((seed, i) => {
      const id = `ttype-${i}`;
      const now = new Date().toISOString();

      const approvalSteps: TicketTypeApprovalStep[] =
        seed.approvalChainGroupSlugs.map((groupSlug, stepIdx) => ({
          id: `step-${i}-${stepIdx}`,
          ticketTypeId: id,
          stepOrder: stepIdx + 1,
          approverType: "group" as const,
          approverGroupId: `group-${groupSlug}`,
          approverUserId: null,
          label: `Aprobación ${groupSlug}`,
          isRequired: true,
          approverGroupName: groupSlug,
        }));

      return {
        id,
        tenantId: ctx.tenantId,
        slug: seed.slug,
        name: seed.name,
        description: seed.description,
        origin: seed.origin,
        requiresApproval: seed.requiresApproval,
        assignedTeam: seed.assignedTeam,
        defaultPriority: seed.defaultPriority,
        slaHours: seed.slaHours,
        icon: seed.icon,
        isActive: true,
        sortOrder: i + 1,
        approvalSteps,
        createdAt: now,
        updatedAt: now,
      };
    });

    return NextResponse.json({ success: true, data: { items } });
  } catch (error) {
    console.error("[OPS] Error listing ticket types:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo obtener los tipos de ticket" },
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

    if (!body.slug || !body.name || !body.assignedTeam) {
      return NextResponse.json(
        { success: false, error: "Campos requeridos: slug, name, assignedTeam" },
        { status: 400 },
      );
    }

    // TODO: Replace with Prisma query when DB migration is ready
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const approvalSteps: TicketTypeApprovalStep[] = (
      body.approvalChainGroupSlugs ?? []
    ).map((groupSlug: string, stepIdx: number) => ({
      id: crypto.randomUUID(),
      ticketTypeId: id,
      stepOrder: stepIdx + 1,
      approverType: "group" as const,
      approverGroupId: `group-${groupSlug}`,
      approverUserId: null,
      label: `Aprobación ${groupSlug}`,
      isRequired: true,
      approverGroupName: groupSlug,
    }));

    const stubType: TicketType = {
      id,
      tenantId: ctx.tenantId,
      slug: body.slug,
      name: body.name,
      description: body.description ?? null,
      origin: body.origin ?? "internal",
      requiresApproval: body.requiresApproval ?? false,
      assignedTeam: body.assignedTeam,
      defaultPriority: body.defaultPriority ?? "p3",
      slaHours: body.slaHours ?? 72,
      icon: body.icon ?? null,
      isActive: true,
      sortOrder: 99,
      approvalSteps,
      createdAt: now,
      updatedAt: now,
    };

    return NextResponse.json({ success: true, data: stubType }, { status: 201 });
  } catch (error) {
    console.error("[OPS] Error creating ticket type:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo crear el tipo de ticket" },
      { status: 500 },
    );
  }
}
