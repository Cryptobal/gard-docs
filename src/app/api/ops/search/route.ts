/**
 * GET /api/ops/search
 * Búsqueda global en Ops: guardias por nombre, código o RUT.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { ensureOpsAccess } from "@/lib/ops";

const LIMIT = 10;

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = ensureOpsAccess(ctx);
    if (forbidden) return forbidden;

    const q = request.nextUrl.searchParams.get("q")?.trim().toLowerCase();
    if (!q || q.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    const guardias = await prisma.opsGuardia.findMany({
      where: { tenantId: ctx.tenantId },
      take: 50,
      select: {
        id: true,
        code: true,
        persona: {
          select: {
            firstName: true,
            lastName: true,
            rut: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const searchable = (g: (typeof guardias)[0]) =>
      `${g.persona.firstName} ${g.persona.lastName} ${g.code ?? ""} ${g.persona.rut ?? ""}`.toLowerCase();
    const filtered = guardias.filter((g) => searchable(g).includes(q)).slice(0, LIMIT);

    const data = filtered.map((g) => ({
      id: g.id,
      type: "guardia" as const,
      title: `${g.persona.firstName} ${g.persona.lastName}`.trim(),
      subtitle: g.code ? `Cód. ${g.code}` : g.persona.rut ?? undefined,
      href: `/personas/guardias/${g.id}`,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[ops/search] Error:", error);
    return NextResponse.json(
      { success: false, error: "Error en la búsqueda" },
      { status: 500 }
    );
  }
}
