import { NextRequest, NextResponse } from "next/server";
import type { GuardMarcacion } from "@/lib/guard-portal";

export async function GET(request: NextRequest) {
  // TODO: Replace with Prisma query + guard session validation
  const { searchParams } = new URL(request.url);
  const guardiaId = searchParams.get("guardiaId");
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);

  if (!guardiaId) {
    return NextResponse.json(
      { success: false, error: "guardiaId es requerido" },
      { status: 400 },
    );
  }

  const now = new Date();
  const data: GuardMarcacion[] = [];

  for (let i = 0; i < 5; i++) {
    const isEntrada = i % 2 === 0;
    const hoursAgo = i * 12; // alternating every ~12 hours
    const ts = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

    data.push({
      id: `marc_mock_${String(i + 1).padStart(3, "0")}`,
      type: isEntrada ? "entrada" : "salida",
      timestamp: ts.toISOString(),
      installationName: "Sede Central",
      geoValidated: true,
      geoDistanceM: Math.floor(Math.random() * 50) + 5,
    });
  }

  return NextResponse.json({ success: true, data: data.slice(0, limit) });
}
