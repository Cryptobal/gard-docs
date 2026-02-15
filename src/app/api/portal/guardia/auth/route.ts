import { NextRequest, NextResponse } from "next/server";
import type { GuardSession } from "@/lib/guard-portal";

export async function POST(request: NextRequest) {
  // TODO: Replace with Prisma query + real PIN validation
  try {
    const body = await request.json();
    const { rut, pin, tenantSlug } = body as {
      rut?: string;
      pin?: string;
      tenantSlug?: string;
    };

    if (!rut || !pin) {
      return NextResponse.json(
        { success: false, error: "RUT y PIN son requeridos" },
        { status: 401 },
      );
    }

    // Mock: any rut + pin "1234" succeeds
    if (pin !== "1234") {
      return NextResponse.json(
        { success: false, error: "PIN incorrecto" },
        { status: 401 },
      );
    }

    const session: GuardSession = {
      guardiaId: "grd_mock_001",
      personaId: "per_mock_001",
      tenantId: "tnt_mock_001",
      firstName: "Juan",
      lastName: "Pérez",
      rut,
      code: "G-001",
      currentInstallationId: null,
      currentInstallationName: "Sede Central",
      authenticatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, data: session });
  } catch {
    return NextResponse.json(
      { success: false, error: "Cuerpo de solicitud inválido" },
      { status: 400 },
    );
  }
}
