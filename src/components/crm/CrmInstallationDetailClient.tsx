"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Building2, ExternalLink, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-6">
      {/* Mapa destacado */}
      {hasCoords && MAPS_KEY && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-teal-500" />
              Ubicación
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <a
              href={`https://www.google.com/maps/@${installation.lat},${installation.lng},17z`}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-b-lg overflow-hidden border-t border-border hover:opacity-95 transition-opacity"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://maps.googleapis.com/maps/api/staticmap?center=${installation.lat},${installation.lng}&zoom=16&size=800x320&scale=2&markers=color:red%7C${installation.lat},${installation.lng}&key=${MAPS_KEY}`}
                alt={`Mapa de ${installation.name}`}
                className="w-full h-auto min-h-[200px] object-cover"
              />
              <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground">
                <ExternalLink className="h-4 w-4" />
                Abrir en Google Maps
              </div>
            </a>
          </CardContent>
        </Card>
      )}

      {hasCoords && !MAPS_KEY && (
        <p className="text-sm text-muted-foreground">
          Coordenadas: {installation.lat}, {installation.lng}. Configura{" "}
          <code className="text-xs">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> para ver el mapa.
        </p>
      )}

      {/* Mensaje cuando no hay coordenadas para el mapa */}
      {!hasCoords && (
        <Card className="border-dashed">
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground text-center">
              <MapPin className="inline h-4 w-4 mr-1 align-middle" />
              Sin ubicación en mapa. Edita la instalación y selecciona una dirección para ver el mapa en Google Maps.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Datos generales */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Datos generales</CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteConfirm(true)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Eliminar
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {installation.address ? (
              <p className="flex items-start gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                <span>{installation.address}</span>
              </p>
            ) : (
              <p className="text-muted-foreground italic">Sin dirección</p>
            )}
            {(installation.commune || installation.city) && (
              <p className="text-muted-foreground">
                {[installation.commune, installation.city].filter(Boolean).join(", ")}
              </p>
            )}
            {installation.notes && (
              <p className="pt-2 border-t border-border text-muted-foreground">
                {installation.notes}
              </p>
            )}
          </CardContent>
        </Card>

        {installation.account && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Cuenta</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/crm/accounts/${installation.account.id}`}
                className="inline-flex items-center gap-2 text-sm text-teal-500 hover:underline"
              >
                <Building2 className="h-4 w-4" />
                {installation.account.name}
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

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
