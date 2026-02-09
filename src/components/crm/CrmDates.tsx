"use client";

import { formatDateShort } from "@/lib/utils";

/**
 * Fechas de creación y última modificación, minimalistas para listas CRM.
 */
export function CrmDates({
  createdAt,
  updatedAt,
  className = "",
}: {
  createdAt: string;
  updatedAt?: string | null;
  className?: string;
}) {
  if (!createdAt) return null;
  const created = formatDateShort(createdAt);
  if (created === "Invalid Date") return null;
  const updated = updatedAt ? formatDateShort(updatedAt) : null;
  return (
    <p className={`text-[11px] text-muted-foreground/80 ${className}`}>
      Creado {created}
      {updated && updated !== "Invalid Date" && updated !== created ? ` · Modif. ${updated}` : ""}
    </p>
  );
}
