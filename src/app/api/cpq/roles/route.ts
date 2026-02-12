/**
 * API Route: /api/cpq/roles
 * GET  - Listar roles CPQ
 * POST - Crear rol
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasAppAccess } from "@/lib/app-access";
import { requireAuth, unauthorized } from "@/lib/api-auth";

function normalizeColorHex(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return /^#[0-9a-f]{6}$/.test(normalized) ? normalized : null;
}

function forbiddenCpq() {
  return NextResponse.json(
    { success: false, error: "Sin permisos para módulo CPQ" },
    { status: 403 }
  );
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    if (!hasAppAccess(ctx.userRole, "cpq")) return forbiddenCpq();

    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");

    const roles = await prisma.cpqRol.findMany({
      where: active ? { active: active === "true" } : undefined,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: roles });
  } catch (error) {
    console.error("Error fetching CPQ roles:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    if (!hasAppAccess(ctx.userRole, "cpq")) return forbiddenCpq();

    const body = await request.json();
    if (!body.name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Nombre es requerido" },
        { status: 400 }
      );
    }

    const patternWork = typeof body.patternWork === "number" ? body.patternWork : null;
    const patternOff = typeof body.patternOff === "number" ? body.patternOff : null;

    const rol = await prisma.cpqRol.create({
      data: {
        name: body.name.trim(),
        description: body.description?.trim() || null,
        colorHex: normalizeColorHex(body.colorHex),
        patternWork,
        patternOff,
        active: body.active ?? true,
      },
    });

    return NextResponse.json({ success: true, data: rol }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Ya existe un rol con ese nombre" },
        { status: 409 }
      );
    }
    console.error("Error creating rol:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create rol" },
      { status: 500 }
    );
  }
}
