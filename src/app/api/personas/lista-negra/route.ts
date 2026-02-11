import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { ensureOpsAccess } from "@/lib/ops";

export async function GET() {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = ensureOpsAccess(ctx);
    if (forbidden) return forbidden;

    const guardias = await prisma.opsGuardia.findMany({
      where: {
        tenantId: ctx.tenantId,
        isBlacklisted: true,
      },
      include: {
        persona: {
          select: { firstName: true, lastName: true, rut: true, phone: true, email: true },
        },
      },
      orderBy: [{ blacklistedAt: "desc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json({ success: true, data: guardias });
  } catch (error) {
    console.error("[PERSONAS] Error fetching blacklist:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo obtener la lista negra" },
      { status: 500 }
    );
  }
}
