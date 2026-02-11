import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { ensureOpsAccess, parseDateOnly, toISODate } from "@/lib/ops";

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = ensureOpsAccess(ctx);
    if (forbidden) return forbidden;

    const installationId = request.nextUrl.searchParams.get("installationId") || undefined;
    const dateRaw = request.nextUrl.searchParams.get("date") || toISODate(new Date());
    const date = parseDateOnly(dateRaw);

    const ppcItems = await prisma.opsAsistenciaDiaria.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(installationId ? { installationId } : {}),
        date,
        OR: [
          { attendanceStatus: "ppc" },
          { attendanceStatus: "no_asistio" },
          {
            attendanceStatus: "pendiente",
            actualGuardiaId: null,
            replacementGuardiaId: null,
          },
        ],
      },
      include: {
        installation: { select: { id: true, name: true } },
        puesto: { select: { id: true, name: true, shiftStart: true, shiftEnd: true } },
        plannedGuardia: {
          select: {
            id: true,
            code: true,
            persona: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: [{ installation: { name: "asc" } }, { puesto: { name: "asc" } }],
    });

    return NextResponse.json({
      success: true,
      data: {
        date: dateRaw,
        items: ppcItems,
      },
    });
  } catch (error) {
    console.error("[OPS] Error listing PPC:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo obtener la lista de puestos por cubrir" },
      { status: 500 }
    );
  }
}
