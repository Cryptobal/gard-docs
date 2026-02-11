const CHILE_TZ = "America/Santiago";

/**
 * Fecha de hoy en zona Chile (America/Santiago).
 * Usa Intl para no depender del timezone del servidor.
 */
export function todayChileStr(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: CHILE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value ?? "";
  const m = parts.find((p) => p.type === "month")?.value ?? "";
  const d = parts.find((p) => p.type === "day")?.value ?? "";
  return `${y}-${m}-${d}`;
}

/** Objeto Date para “hoy” en Chile (mediodía para evitar bordes de timezone) */
export function todayChileDate(): Date {
  return new Date(todayChileStr() + "T12:00:00");
}

function getDateOnlyParts(date: Date): { year: number; month: number; day: number } {
  const [year, month, day] = date.toISOString().slice(0, 10).split("-").map(Number);
  return { year, month, day };
}

/**
 * Formatea una fecha DATE de BD (sin timezone real) evitando desfases por zona horaria.
 * Ej: 2026-02-11 -> "11-feb"
 */
export function formatDateOnlyShortEs(date: Date): string {
  const { month, day } = getDateOnlyParts(date);
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"];
  return `${String(day).padStart(2, "0")}-${months[Math.max(0, month - 1)]}`;
}

/**
 * Ej: 2026-02-01 -> "febrero 2026"
 */
export function formatDateOnlyMonthYearEs(date: Date): string {
  const { year, month } = getDateOnlyParts(date);
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  return `${months[Math.max(0, month - 1)]} ${year}`;
}

/**
 * Ej: 2026-02-01 -> "01-feb-2026"
 */
export function formatDateOnlyShortWithYearEs(date: Date): string {
  const { year, month, day } = getDateOnlyParts(date);
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"];
  return `${String(day).padStart(2, "0")}-${months[Math.max(0, month - 1)]}-${year}`;
}
