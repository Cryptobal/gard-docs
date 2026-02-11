/* eslint-disable @typescript-eslint/no-misused-promises */
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Building2, ExternalLink, Trash2, ArrowLeft, Info, FileText } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/opai/EmptyState";
import { CollapsibleSection } from "./CollapsibleSection";
import { RecordActions } from "./RecordActions";
import { toast } from "sonner";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export type InstallationDetail = {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  commune?: string | null;
  lat?: number | null;
  lng?: number | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  puestosActivos?: Array<{
    id: string;
    name: string;
    shiftStart: string;
    shiftEnd: string;
    weekdays: string[];
    requiredGuards: number;
    teMontoClp?: number | string | null;
  }>;
  quotesInstalacion?: Array<{
    id: string;
    code: string;
    status: string;
    totalPositions: number;
    totalGuards: number;
    updatedAt: string;
  }>;
  account?: { id: string; name: string } | null;
};

export function CrmInstallationDetailClient({
  installation,
}: {
  installation: InstallationDetail;
}) {
  const router = useRouter();
  const hasCoords = installation.lat != null && installation.lng != null;
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const dotacionDesdeCotizacion = (
    installation.metadata &&
    typeof installation.metadata === "object" &&
    "dotacionActiva" in installation.metadata &&
    (installation.metadata.dotacionActiva as Record<string, unknown>) &&
    typeof installation.metadata.dotacionActiva === "object"
      ? (installation.metadata.dotacionActiva as Record<string, unknown>)
      : null
  );

  const dotacionItems = Array.isArray(dotacionDesdeCotizacion?.items)
    ? (dotacionDesdeCotizacion?.items as Array<Record<string, unknown>>)
    : [];

  const sourceQuoteId =
    typeof dotacionDesdeCotizacion?.sourceQuoteId === "string"
      ? dotacionDesdeCotizacion.sourceQuoteId
      : null;
  const sourceQuoteCode =
    typeof dotacionDesdeCotizacion?.sourceQuoteCode === "string"
      ? dotacionDesdeCotizacion.sourceQuoteCode
      : null;
  const sourceUpdatedAt =
    typeof dotacionDesdeCotizacion?.updatedAt === "string"
      ? dotacionDesdeCotizacion.updatedAt
      : null;

  const deleteInstallation = async () => {
    try {
      const res = await fetch(`/api/crm/installations/${installation.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Instalación eliminada");
      router.push("/crm/installations");
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between">
        <Link
          href="/crm/installations"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a instalaciones
        </Link>
        <RecordActions
          actions={[
            { label: "Eliminar instalación", icon: Trash2, onClick: () => setDeleteConfirm(true), variant: "destructive" },
          ]}
        />
      </div>

      {/* ── Section 1: Datos generales + mapa a la derecha (desktop) ── */}
      <CollapsibleSection
        icon={<Info className="h-4 w-4" />}
        title="Datos generales"
      >
        <div className="flex flex-col lg:flex-row lg:gap-6">
          {/* Datos */}
          <div className="flex-1 space-y-3 text-sm">
            <InfoRow label="Dirección">
              {installation.address ? (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {installation.address}
                </span>
              ) : (
                <span className="text-muted-foreground">Sin dirección</span>
              )}
            </InfoRow>
            <InfoRow label="Comuna / Ciudad">
              {(installation.commune || installation.city)
                ? [installation.commune, installation.city].filter(Boolean).join(", ")
                : "—"}
            </InfoRow>
            {installation.notes && (
              <div className="rounded-md border border-border bg-muted/20 p-3 text-xs text-muted-foreground mt-2">
                {installation.notes}
              </div>
            )}
          </div>

          {/* Mapa — a la derecha en desktop, abajo en móvil */}
          {hasCoords && MAPS_KEY ? (
            <a
              href={`https://www.google.com/maps/@${installation.lat},${installation.lng},17z`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 lg:mt-0 shrink-0 block rounded-lg overflow-hidden border border-border hover:opacity-95 transition-opacity lg:w-[220px] lg:h-[160px]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://maps.googleapis.com/maps/api/staticmap?center=${installation.lat},${installation.lng}&zoom=16&size=440x320&scale=2&markers=color:red%7C${installation.lat},${installation.lng}&key=${MAPS_KEY}`}
                alt={`Mapa de ${installation.name}`}
                className="w-full h-[140px] lg:h-[130px] object-cover"
              />
              <div className="flex items-center justify-center gap-1 py-1.5 text-xs text-muted-foreground hover:text-foreground">
                <ExternalLink className="h-3 w-3" />
                Google Maps
              </div>
            </a>
          ) : (
            <div className="mt-4 lg:mt-0 shrink-0 lg:w-[220px] flex items-center justify-center rounded-lg border border-dashed border-border p-4">
              <p className="text-xs text-muted-foreground text-center">
                {hasCoords && !MAPS_KEY
                  ? "Configura GOOGLE_MAPS_API_KEY"
                  : "Sin ubicación"}
              </p>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* ── Section 2: Cuenta ── */}
      <CollapsibleSection
        icon={<Building2 className="h-4 w-4" />}
        title="Cuenta"
      >
        {installation.account ? (
          <Link
            href={`/crm/accounts/${installation.account.id}`}
            className="flex items-center justify-between rounded-lg border p-3 sm:p-4 transition-colors hover:bg-accent/30 group"
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <p className="font-medium text-sm">{installation.account.name}</p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
          </Link>
        ) : (
          <EmptyState icon={<Building2 className="h-8 w-8" />} title="Sin cuenta" description="Esta instalación no está vinculada a una cuenta." compact />
        )}
      </CollapsibleSection>

      {/* ── Section 3: Dotación activa ── */}
      <CollapsibleSection
        icon={<FileText className="h-4 w-4" />}
        title="Dotación activa"
      >
        <div className="space-y-3">
          {sourceQuoteId && sourceQuoteCode ? (
            <div className="rounded-md border border-emerald-500/25 bg-emerald-500/5 p-3 text-xs text-emerald-200">
              Dotación sincronizada desde cotización{" "}
              <Link href={`/cpq/${sourceQuoteId}`} className="underline underline-offset-2 hover:text-emerald-100">
                {sourceQuoteCode}
              </Link>
              {sourceUpdatedAt ? (
                <span className="text-emerald-300/80"> · {new Date(sourceUpdatedAt).toLocaleString("es-CL")}</span>
              ) : null}
            </div>
          ) : null}

          {dotacionItems.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="min-w-full text-xs sm:text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Puesto</th>
                    <th className="px-3 py-2 text-left font-medium">Cargo / Rol</th>
                    <th className="px-3 py-2 text-left font-medium">Horario</th>
                    <th className="px-3 py-2 text-left font-medium">Días</th>
                    <th className="px-3 py-2 text-right font-medium">Dotación</th>
                    <th className="px-3 py-2 text-right font-medium">Sueldo base</th>
                  </tr>
                </thead>
                <tbody>
                  {dotacionItems.map((item, idx) => {
                    const puesto = (typeof item.customName === "string" && item.customName) || (item.puestoTrabajoName as string) || "Puesto";
                    const cargo = (item.cargoName as string) || "—";
                    const rol = (item.rolName as string) || "—";
                    const shiftStart = (item.shiftStart as string) || "--:--";
                    const shiftEnd = (item.shiftEnd as string) || "--:--";
                    const weekdays = Array.isArray(item.weekdays) ? item.weekdays.join(", ") : "—";
                    const requiredGuards = Number(item.requiredGuards ?? 0);
                    const baseSalary = Number(item.baseSalary ?? 0);

                    return (
                      <tr key={`${String(item.positionId ?? idx)}-${idx}`} className="border-t border-border/60">
                        <td className="px-3 py-2">{puesto}</td>
                        <td className="px-3 py-2 text-muted-foreground">{cargo} / {rol}</td>
                        <td className="px-3 py-2">{shiftStart} - {shiftEnd}</td>
                        <td className="px-3 py-2 text-muted-foreground">{weekdays}</td>
                        <td className="px-3 py-2 text-right">{requiredGuards}</td>
                        <td className="px-3 py-2 text-right">${baseSalary.toLocaleString("es-CL")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : installation.puestosActivos && installation.puestosActivos.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="min-w-full text-xs sm:text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Puesto</th>
                    <th className="px-3 py-2 text-left font-medium">Horario</th>
                    <th className="px-3 py-2 text-left font-medium">Días</th>
                    <th className="px-3 py-2 text-right font-medium">Dotación</th>
                  </tr>
                </thead>
                <tbody>
                  {installation.puestosActivos.map((item) => (
                    <tr key={item.id} className="border-t border-border/60">
                      <td className="px-3 py-2">{item.name}</td>
                      <td className="px-3 py-2">{item.shiftStart} - {item.shiftEnd}</td>
                      <td className="px-3 py-2 text-muted-foreground">{item.weekdays.join(", ")}</td>
                      <td className="px-3 py-2 text-right">{item.requiredGuards}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<FileText className="h-8 w-8" />}
              title="Sin dotación activa"
              description="Aún no hay estructura activa para esta instalación."
              compact
            />
          )}

          {installation.quotesInstalacion && installation.quotesInstalacion.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Cotizaciones asociadas a esta instalación</p>
              <div className="space-y-2">
                {installation.quotesInstalacion.map((quote) => (
                  <Link
                    key={quote.id}
                    href={`/cpq/${quote.id}`}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:bg-accent/30"
                  >
                    <div>
                      <p className="font-medium">{quote.code}</p>
                      <p className="text-xs text-muted-foreground">
                        {quote.totalPositions} puestos · {quote.totalGuards} guardias · {quote.status}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(quote.updatedAt).toLocaleDateString("es-CL")}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </CollapsibleSection>

      <ConfirmDialog
        open={deleteConfirm}
        onOpenChange={setDeleteConfirm}
        title="Eliminar instalación"
        description="La instalación será eliminada permanentemente. Esta acción no se puede deshacer."
        onConfirm={deleteInstallation}
      />
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}
