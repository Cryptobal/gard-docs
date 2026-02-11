import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, requireAuth, unauthorized } from "@/lib/api-auth";
import { createPuestoSchema } from "@/lib/validations/ops";
import { createOpsAuditLog, ensureOpsAccess } from "@/lib/ops";

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = ensureOpsAccess(ctx);
    if (forbidden) return forbidden;

    const installationId = request.nextUrl.searchParams.get("installationId") || undefined;

    const puestos = await prisma.opsPuestoOperativo.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(installationId ? { installationId } : {}),
      },
      include: {
        installation: {
          select: { id: true, name: true, teMontoClp: true },
        },
      },
      orderBy: [{ active: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, data: puestos });
  } catch (error) {
    console.error("[OPS] Error listing puestos:", error);
    return NextResponse.json(
      { success: false, error: "No se pudieron obtener los puestos operativos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = ensureOpsAccess(ctx);
    if (forbidden) return forbidden;

    const parsed = await parseBody(request, createPuestoSchema);
    if (parsed.error) return parsed.error;
    const body = parsed.data;

    const installation = await prisma.crmInstallation.findFirst({
      where: { id: body.installationId, tenantId: ctx.tenantId },
      select: { id: true, teMontoClp: true },
    });
    if (!installation) {
      return NextResponse.json(
        { success: false, error: "Instalación no encontrada" },
        { status: 404 }
      );
    }

    const puesto = await prisma.opsPuestoOperativo.create({
      data: {
        tenantId: ctx.tenantId,
        installationId: body.installationId,
        name: body.name,
        shiftStart: body.shiftStart,
        shiftEnd: body.shiftEnd,
        weekdays: body.weekdays,
        requiredGuards: body.requiredGuards,
        teMontoClp: body.teMontoClp ?? installation.teMontoClp,
        active: body.active ?? true,
        createdBy: ctx.userId,
      },
      include: {
        installation: {
          select: { id: true, name: true, teMontoClp: true },
        },
      },
    });

    await createOpsAuditLog(ctx, "ops.puesto.created", "ops_puesto", puesto.id, {
      installationId: body.installationId,
      name: body.name,
    });

    return NextResponse.json({ success: true, data: puesto }, { status: 201 });
  } catch (error) {
    console.error("[OPS] Error creating puesto:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo crear el puesto operativo" },
      { status: 500 }
    );
  }
}
