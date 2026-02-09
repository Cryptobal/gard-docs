/**
 * Utilidades para campos personalizados del CRM.
 * Uso: al mostrar valores de custom fields en Leads, Contactos, Cuentas, Negocios.
 */

export const FIELD_TYPE_LABELS: Record<string, string> = {
  text: "Texto",
  textarea: "Área de texto",
  number: "Número",
  date: "Fecha",
  phone: "Teléfono",
  email: "Correo electrónico",
  url: "URL",
  select: "Selección única",
  select_multiple: "Selección múltiple",
  checkbox: "Sí/No",
};

/**
 * Devuelve la etiqueta para URLs (si existe en options)
 */
export function getUrlLabel(options: unknown): string | null {
  if (options && typeof options === "object" && !Array.isArray(options) && "urlLabel" in options) {
    return (options as { urlLabel?: string }).urlLabel ?? null;
  }
  return null;
}

/**
 * Formatea el valor de un campo para mostrarlo.
 * Para URL: retorna { type: 'url', url, label } para renderizar como enlace clicable.
 * Para phone: retorna { type: 'phone', value } para tel: link.
 * Para email: retorna { type: 'email', value } para mailto:.
 * Para el resto: retorna { type: 'text', value }.
 */
export function formatCustomFieldValue(
  type: string,
  value: unknown,
  options?: unknown
): { type: "url"; url: string; label: string } | { type: "phone"; value: string } | { type: "email"; value: string } | { type: "text"; value: string } {
  const str = value != null ? String(value).trim() : "";
  if (!str) return { type: "text", value: "" };

  if (type === "url") {
    const url = str.startsWith("http") ? str : `https://${str}`;
    const label = getUrlLabel(options) || url;
    return { type: "url", url, label };
  }
  if (type === "phone") return { type: "phone", value: str };
  if (type === "email") return { type: "email", value: str };

  return { type: "text", value: str };
}
