import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { ensureOpsAccess } from "@/lib/ops";

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = ensureOpsAccess(ctx);
    if (forbidden) return forbidden;

    const status = request.nextUrl.searchParams.get("status") || undefined;
    const installationId = request.nextUrl.searchParams.get("installationId") || undefined;
    const guardiaId = request.nextUrl.searchParams.get("guardiaId") || undefined;
    const from = request.nextUrl.searchParams.get("from");
    const to = request.nextUrl.searchParams.get("to");

    const turnos = await prisma.opsTurnoExtra.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(status ? { status } : {}),
        ...(installationId ? { installationId } : {}),
        ...(guardiaId ? { guardiaId } : {}),
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}),
                ...(to ? { lte: new Date(`${to}T00:00:00.000Z`) } : {}),
              },
            }
          : {}),
      },
      include: {
        installation: {
          select: { id: true, name: true },
        },
        puesto: {
          select: { id: true, name: true, shiftStart: true, shiftEnd: true },
        },
        guardia: {
          select: {
            id: true,
            code: true,
            persona: { select: { firstName: true, lastName: true, rut: true } },
          },
        },
        paymentItems: {
          select: {
            id: true,
            loteId: true,
            amountClp: true,
            status: true,
          },
        },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, data: turnos });
  } catch (error) {
    console.error("[TE] Error listing turnos extra:", error);
    return NextResponse.json(
      { success: false, error: "No se pudieron obtener los turnos extra" },
      { status: 500 }
    );
  }
}
