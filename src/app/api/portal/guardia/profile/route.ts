import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // TODO: Replace with Prisma query + guard session validation
  const { searchParams } = new URL(request.url);
  const guardiaId = searchParams.get("guardiaId");

  if (!guardiaId) {
    return NextResponse.json(
      { success: false, error: "guardiaId es requerido" },
      { status: 400 },
    );
  }

  const data = {
    id: "grd_mock_001",
    firstName: "Juan",
    lastName: "Pérez",
    rut: "12.345.678-5",
    email: "juan.perez@example.com",
    phone: "+56 9 1234 5678",
    code: "G-001",
    status: "active",
    currentInstallation: "Sede Central",
    hiredAt: "2023-06-15T00:00:00.000Z",
  };

  return NextResponse.json({ success: true, data });
}
