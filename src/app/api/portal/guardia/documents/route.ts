import { NextRequest, NextResponse } from "next/server";
import type { GuardDocument } from "@/lib/guard-portal";

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

  const data: GuardDocument[] = [
    {
      id: "doc_mock_001",
      title: "Contrato de Trabajo - Juan Pérez",
      type: "contrato",
      createdAt: "2025-03-01T12:00:00.000Z",
      url: null, // TODO: generate signed URL from storage
    },
    {
      id: "doc_mock_002",
      title: "Liquidación Enero 2026",
      type: "liquidacion",
      createdAt: "2026-02-01T09:00:00.000Z",
      url: null, // TODO: generate signed URL from storage
    },
  ];

  return NextResponse.json({ success: true, data });
}
