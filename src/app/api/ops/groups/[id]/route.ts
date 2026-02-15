import { NextRequest, NextResponse } from "next/server";
import type { AdminGroup } from "@/lib/groups";

/**
 * Cloud-only stub — no real DB access yet.
 * TODO: Replace with Prisma queries when DB migration is ready.
 */

type Params = { id: string };

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  // TODO: Replace with Prisma query when DB migration is ready
  const { id } = await params;
  const now = new Date().toISOString();

  const group: AdminGroup = {
    id,
    tenantId: "stub-tenant",
    slug: "stub-group",
    name: "Stub Group",
    description: "This is a stub group",
    color: "#6B7280",
    isSystem: false,
    isActive: true,
    membersCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  return NextResponse.json({ success: true, data: group });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  // TODO: Replace with Prisma query when DB migration is ready
  try {
    const { id } = await params;
    const body = await request.json();
    const now = new Date().toISOString();

    const updated: AdminGroup = {
      id,
      tenantId: "stub-tenant",
      slug: (body.slug as string) ?? "stub-group",
      name: (body.name as string) ?? "Stub Group",
      description: (body.description as string) ?? null,
      color: (body.color as string) ?? "#6B7280",
      isSystem: false,
      isActive: (body.isActive as boolean) ?? true,
      membersCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[GROUPS] Error updating group:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo actualizar el grupo" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  // TODO: Replace with Prisma query when DB migration is ready
  const { id } = await params;
  return NextResponse.json({ success: true, data: { id, deleted: true } });
}
