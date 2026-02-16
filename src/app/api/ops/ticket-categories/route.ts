import { NextResponse } from "next/server";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { ensureOpsAccess } from "@/lib/ops";
import { TICKET_CATEGORIES_SEED } from "@/lib/tickets";

/**
 * GET /api/ops/ticket-categories — List ticket categories
 * Returns seed data as stub (will come from DB later)
 */
export async function GET() {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = await ensureOpsAccess(ctx);
    if (forbidden) return forbidden;

    const items = TICKET_CATEGORIES_SEED.map((c, i) => ({
      id: `cat-${i}`,
      ...c,
    }));

    return NextResponse.json({ success: true, data: { items } });
  } catch (error) {
    console.error("[OPS] Error listing ticket categories:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo obtener las categorías de tickets" },
      { status: 500 },
    );
  }
}
