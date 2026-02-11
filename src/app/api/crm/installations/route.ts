/**
 * API Route: /api/crm/installations
 * GET  - Listar instalaciones (filtro por accountId)
 * POST - Crear instalación
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized, parseBody } from "@/lib/api-auth";
import { createInstallationSchema } from "@/lib/validations/crm";

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();

    const accountId = request.nextUrl.searchParams.get("accountId") || undefined;

    const installations = await prisma.crmInstallation.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(accountId ? { accountId } : {}),
      },
      include: { account: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: installations });
  } catch (error) {
    console.error("Error fetching installations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch installations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();

    const parsed = await parseBody(request, createInstallationSchema);
    if (parsed.error) return parsed.error;
    const body = parsed.data;

    // Verify account belongs to tenant
    const account = await prisma.crmAccount.findFirst({
      where: { id: body.accountId, tenantId: ctx.tenantId },
    });
    if (!account) {
      return NextResponse.json(
        { success: false, error: "Cuenta no encontrada" },
        { status: 404 }
      );
    }

    const installation = await prisma.crmInstallation.create({
      data: {
        tenantId: ctx.tenantId,
        accountId: body.accountId,
        name: body.name,
        address: body.address || null,
        city: body.city || null,
        commune: body.commune || null,
        lat: body.lat || null,
        lng: body.lng || null,
        geoRadiusM: body.geoRadiusM ?? 100,
        teMontoClp: body.teMontoClp ?? 0,
        notes: body.notes || null,
      },
      include: { account: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ success: true, data: installation }, { status: 201 });
  } catch (error) {
    console.error("Error creating installation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create installation" },
      { status: 500 }
    );
  }
}
