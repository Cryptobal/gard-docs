import { NextRequest, NextResponse } from "next/server";
import type { GuardExtraShift } from "@/lib/guard-portal";

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

  const data: GuardExtraShift[] = [
    {
      id: "ext_mock_001",
      date: "2026-02-05",
      installationName: "Sede Central",
      hours: 4,
      amountClp: 28000,
      status: "pending",
      statusLabel: "Pendiente",
    },
    {
      id: "ext_mock_002",
      date: "2026-01-28",
      installationName: "Bodega Norte",
      hours: 8,
      amountClp: 56000,
      status: "approved",
      statusLabel: "Aprobado",
    },
    {
      id: "ext_mock_003",
      date: "2026-01-15",
      installationName: "Sede Central",
      hours: 6,
      amountClp: 42000,
      status: "paid",
      statusLabel: "Pagado",
    },
  ];

  return NextResponse.json({ success: true, data });
}
