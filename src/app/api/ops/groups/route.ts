import { NextRequest, NextResponse } from "next/server";
import { GROUP_SEEDS, type AdminGroup } from "@/lib/groups";

/**
 * Cloud-only stub — no real DB access yet.
 * TODO: Replace with Prisma queries when DB migration is ready.
 */

// Hydrate seeds into full AdminGroup shapes for the response
function seedsToGroups(): AdminGroup[] {
  const now = new Date().toISOString();
  return GROUP_SEEDS.map((seed, idx) => ({
    id: `grp_seed_${idx}`,
    tenantId: "stub-tenant",
    slug: seed.slug,
    name: seed.name,
    description: seed.description ?? null,
    color: seed.color,
    isSystem: seed.isSystem,
    isActive: seed.isActive,
    membersCount: 0,
    createdAt: now,
    updatedAt: now,
  }));
}

export async function GET() {
  // TODO: Replace with Prisma query when DB migration is ready
  const groups = seedsToGroups();
  return NextResponse.json({ success: true, data: groups });
}

export async function POST(request: NextRequest) {
  // TODO: Replace with Prisma query when DB migration is ready
  try {
    const body = await request.json();
    const { name, description, color, slug } = body as {
      name?: string;
      description?: string;
      color?: string;
      slug?: string;
    };

    if (!name) {
      return NextResponse.json(
        { success: false, error: "name is required" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const created: AdminGroup = {
      id: `grp_${crypto.randomUUID()}`,
      tenantId: "stub-tenant",
      slug: slug ?? name.toLowerCase().replace(/\s+/g, "_"),
      name,
      description: description ?? null,
      color: color ?? "#6B7280",
      isSystem: false,
      isActive: true,
      membersCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error("[GROUPS] Error creating group:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo crear el grupo" },
      { status: 500 }
    );
  }
}
