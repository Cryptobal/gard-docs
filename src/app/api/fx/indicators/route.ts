/**
 * API Route: /api/fx/indicators
 * GET - Retorna UF del día (hoy Chile) y UTM del mes para la barra global.
 * Siempre prioriza UF de la fecha de hoy para que cotizaciones y payroll usen valor vigente.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  formatDateOnlyMonthYearEs,
  formatDateOnlyShortEs,
  formatDateOnlyShortWithYearEs,
  todayChileStr,
} from "@/lib/fx-date";
import { ensureCurrentFxRates } from "@/lib/fx-sync";

export async function GET() {
  try {
    // Autocorrección: si falta UF del día o UTM del mes, intenta sincronizar desde CMF.
    // Esto protege el frontend si un cron diario falla.
    try {
      await ensureCurrentFxRates();
    } catch (error) {
      // No bloquea la UI: si CMF falla, devolvemos el último valor disponible en BD.
      console.warn("FX ensureCurrentFxRates failed:", error);
    }

    const today = new Date(`${todayChileStr()}T00:00:00Z`);

    // UF: preferir la del día de hoy (Chile); si no existe, usar la más reciente
    const ufToday = await prisma.fxUfRate.findUnique({
      where: { date: today },
    });
    const ufFallback = await prisma.fxUfRate.findFirst({
      orderBy: { date: "desc" },
    });
    const latestUf = ufToday ?? ufFallback;

    // UTM: mes actual (vigente)
    const latestUtm = await prisma.fxUtmRate.findFirst({
      orderBy: { month: "desc" },
    });

    const ufValue = latestUf ? Number(latestUf.value) : null;
    const utmValue = latestUtm ? Number(latestUtm.value) : null;
    const ufDate = latestUf?.date ? formatDateOnlyShortEs(new Date(latestUf.date)) : null;
    const utmMonth = latestUtm?.month ? formatDateOnlyMonthYearEs(new Date(latestUtm.month)) : null;
    const utmMonthShort = latestUtm?.month ? formatDateOnlyShortWithYearEs(new Date(latestUtm.month)) : null;
    const utmFetchedAt = latestUtm?.fetchedAt ? formatDateOnlyShortEs(new Date(latestUtm.fetchedAt)) : null;

    return NextResponse.json({
      success: true,
      data: {
        uf: ufValue != null ? { value: ufValue, date: ufDate } : null,
        utm:
          utmValue != null
            ? { value: utmValue, month: utmMonth, monthShort: utmMonthShort, updatedAt: utmFetchedAt }
            : null,
      },
    });
  } catch (error) {
    console.error("Error fetching FX indicators:", error);
    return NextResponse.json(
      { success: false, error: "No se pudieron obtener los indicadores" },
      { status: 500 }
    );
  }
}
