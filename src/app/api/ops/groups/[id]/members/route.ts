import { NextRequest, NextResponse } from "next/server";
import type { AdminGroupMembership, GroupMemberRole } from "@/lib/groups";

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
  const { id: _groupId } = await params;
  const members: AdminGroupMembership[] = [];
  return NextResponse.json({ success: true, data: members });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  // TODO: Replace with Prisma query when DB migration is ready
  try {
    const { id: groupId } = await params;
    const body = await request.json();
    const { adminId, role } = body as { adminId?: string; role?: GroupMemberRole };

    if (!adminId) {
      return NextResponse.json(
        { success: false, error: "adminId is required" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const membership: AdminGroupMembership = {
      id: `gm_${crypto.randomUUID()}`,
      groupId,
      adminId,
      role: role ?? "member",
      joinedAt: now,
    };

    return NextResponse.json({ success: true, data: membership }, { status: 201 });
  } catch (error) {
    console.error("[GROUPS] Error adding member:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo agregar el miembro al grupo" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  // TODO: Replace with Prisma query when DB migration is ready
  try {
    const { id: groupId } = await params;
    const body = await request.json();
    const { adminId } = body as { adminId?: string };

    if (!adminId) {
      return NextResponse.json(
        { success: false, error: "adminId is required" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { groupId, adminId, removed: true },
    });
  } catch (error) {
    console.error("[GROUPS] Error removing member:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo remover el miembro del grupo" },
      { status: 500 }
    );
  }
}
