import { NextRequest, NextResponse } from "next/server";
import type { GuardTicket } from "@/lib/guard-portal";

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

  const data: GuardTicket[] = [];

  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  // TODO: Replace with Prisma create + guard session validation
  try {
    const body = await request.json();
    const { guardiaId, ticketTypeId, title, description } = body as {
      guardiaId?: string;
      ticketTypeId?: string;
      title?: string;
      description?: string;
    };

    if (!guardiaId || !ticketTypeId || !title || !description) {
      return NextResponse.json(
        { success: false, error: "guardiaId, ticketTypeId, title y description son requeridos" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    const ticket: GuardTicket = {
      id: `tkt_mock_${Date.now()}`,
      code: `TK-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      title,
      typeName: "Solicitud General",
      status: "open",
      statusLabel: "Abierto",
      priority: "medium",
      createdAt: now,
      updatedAt: now,
    };

    return NextResponse.json({ success: true, data: ticket }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Cuerpo de solicitud inválido" },
      { status: 400 },
    );
  }
}
