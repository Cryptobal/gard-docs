/**
 * API Route: /api/fx/sync
 * GET - Sincroniza UF y UTM del día desde CMF (ex-SBIF)
 *
 * Se ejecuta diariamente vía Vercel Cron.
 * También puede invocarse manualmente con ?force=true
 */

import { NextRequest, NextResponse } from "next/server";
import { syncFxRates } from "@/lib/fx-sync";

const CMF_API_KEY = process.env.CMF_API_KEY;

// Header para proteger el cron (Vercel envía este header)
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Validar que viene del cron de Vercel o es forzado manualmente
  const authHeader = request.headers.get("authorization");

  if (!CRON_SECRET && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { success: false, error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  const isCron = CRON_SECRET ? authHeader === `Bearer ${CRON_SECRET}` : true;

  if (!isCron) {
    return NextResponse.json(
      { success: false, error: "No autorizado" },
      { status: 401 }
    );
  }

  if (!CMF_API_KEY) {
    return NextResponse.json(
      { success: false, error: "CMF_API_KEY no configurada" },
      { status: 500 }
    );
  }

  const dateParam = new URL(request.url).searchParams.get("date"); // opcional: 2026-02-10

  const results = await syncFxRates(dateParam ?? undefined);

  return NextResponse.json({
    success: true,
    syncedAt: new Date().toISOString(),
    results,
  });
}
