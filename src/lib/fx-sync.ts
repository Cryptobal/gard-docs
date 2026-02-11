import { prisma } from "@/lib/prisma";
import { todayChileStr } from "@/lib/fx-date";

const CMF_BASE = "https://api.cmfchile.cl/api-sbifv3/recursos_api";

type UfData = { value: number; date: string };
type UtmData = { value: number; month: string };

/**
 * Parsea valor CMF "39.703,49" -> 39703.49
 */
function parseCmfValue(raw: string): number {
  const cleaned = raw.replace(/\./g, "").replace(",", ".");
  return parseFloat(cleaned);
}

function toUtcDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00Z`);
}

export async function fetchUfFromCmfForDate(dateStr: string): Promise<UfData | null> {
  const cmfApiKey = process.env.CMF_API_KEY;
  if (!cmfApiKey) throw new Error("CMF_API_KEY no configurada");

  const [year, month, day] = dateStr.split("-");
  if (!year || !month || !day) return null;

  const url = `${CMF_BASE}/uf/${year}/${month}/dias/${day}?apikey=${cmfApiKey}&formato=json`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;

  const data = await res.json();
  const uf = data?.UFs?.[0];
  if (!uf?.Valor || !uf?.Fecha) return null;

  const value = parseCmfValue(uf.Valor);
  if (Number.isNaN(value)) return null;

  return { value, date: uf.Fecha };
}

/**
 * Intenta UF de la fecha pedida; sin fecha intenta hoy Chile y luego ayer.
 */
export async function fetchUfFromCmf(dateStr?: string): Promise<UfData | null> {
  const target = dateStr ?? todayChileStr();
  const uf = await fetchUfFromCmfForDate(target);
  if (uf) return uf;
  if (dateStr) return null;

  const fallbackDate = new Date(`${target}T12:00:00Z`);
  fallbackDate.setUTCDate(fallbackDate.getUTCDate() - 1);
  const yesterday = fallbackDate.toISOString().slice(0, 10);
  return fetchUfFromCmfForDate(yesterday);
}

export async function fetchUtmFromCmf(): Promise<UtmData | null> {
  const cmfApiKey = process.env.CMF_API_KEY;
  if (!cmfApiKey) throw new Error("CMF_API_KEY no configurada");

  const url = `${CMF_BASE}/utm?apikey=${cmfApiKey}&formato=json`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;

  const data = await res.json();
  const utm = data?.UTMs?.[0];
  if (!utm?.Valor || !utm?.Fecha) return null;

  const value = parseCmfValue(utm.Valor);
  if (Number.isNaN(value)) return null;

  return { value, month: `${utm.Fecha.slice(0, 7)}-01` };
}

export async function upsertUfRate(uf: UfData): Promise<void> {
  const dateObj = toUtcDate(uf.date);
  await prisma.fxUfRate.upsert({
    where: { date: dateObj },
    update: {
      value: uf.value,
      fetchedAt: new Date(),
      source: "CMF",
    },
    create: {
      date: dateObj,
      value: uf.value,
      fetchedAt: new Date(),
      source: "CMF",
    },
  });
}

export async function upsertUtmRate(utm: UtmData): Promise<void> {
  const monthObj = toUtcDate(utm.month);
  await prisma.fxUtmRate.upsert({
    where: { month: monthObj },
    update: {
      value: utm.value,
      fetchedAt: new Date(),
      source: "CMF",
    },
    create: {
      month: monthObj,
      value: utm.value,
      fetchedAt: new Date(),
      source: "CMF",
    },
  });
}

/**
 * Asegura que exista UF de hoy y UTM del mes vigente.
 * Si falta, intenta traer desde CMF y guardar en BD.
 */
export async function ensureCurrentFxRates(): Promise<{
  ufSynced: boolean;
  utmSynced: boolean;
}> {
  if (!process.env.CMF_API_KEY) {
    return { ufSynced: false, utmSynced: false };
  }

  const todayStr = todayChileStr();
  const todayDate = toUtcDate(todayStr);
  const currentMonth = toUtcDate(`${todayStr.slice(0, 7)}-01`);

  let ufSynced = false;
  let utmSynced = false;

  const [ufToday, utmMonth] = await Promise.all([
    prisma.fxUfRate.findUnique({ where: { date: todayDate } }),
    prisma.fxUtmRate.findUnique({ where: { month: currentMonth } }),
  ]);

  if (!ufToday) {
    const uf = await fetchUfFromCmf(todayStr);
    if (uf) {
      await upsertUfRate(uf);
      ufSynced = true;
    }
  }

  if (!utmMonth) {
    const utm = await fetchUtmFromCmf();
    if (utm) {
      await upsertUtmRate(utm);
      utmSynced = true;
    }
  }

  return { ufSynced, utmSynced };
}

export async function syncFxRates(dateParam?: string): Promise<{
  uf: { status: "ok" | "no_data" | "error"; value?: number; date?: string; message?: string };
  utm: { status: "ok" | "no_data" | "error"; value?: number; month?: string; message?: string };
}> {
  const result: {
    uf: { status: "ok" | "no_data" | "error"; value?: number; date?: string; message?: string };
    utm: { status: "ok" | "no_data" | "error"; value?: number; month?: string; message?: string };
  } = {
    uf: { status: "no_data" },
    utm: { status: "no_data" },
  };

  try {
    const uf = await fetchUfFromCmf(dateParam);
    if (uf) {
      await upsertUfRate(uf);
      result.uf = { status: "ok", value: uf.value, date: uf.date };
    }
  } catch (error) {
    result.uf = { status: "error", message: String(error) };
  }

  try {
    const utm = await fetchUtmFromCmf();
    if (utm) {
      await upsertUtmRate(utm);
      result.utm = { status: "ok", value: utm.value, month: utm.month };
    }
  } catch (error) {
    result.utm = { status: "error", message: String(error) };
  }

  return result;
}
