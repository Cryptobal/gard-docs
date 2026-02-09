"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CrmDates } from "@/components/crm/CrmDates";

export type InstallationRow = {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  commune?: string | null;
  lat?: number | null;
  lng?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  account?: { id: string; name: string } | null;
};

export function CrmInstallationsListClient({
  initialInstallations,
}: {
  initialInstallations: InstallationRow[];
}) {
  const [installations, setInstallations] = useState<InstallationRow[]>(initialInstallations);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: "" });

  const deleteInstallation = async (id: string) => {
    try {
      const res = await fetch(`/api/crm/installations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setInstallations((prev) => prev.filter((i) => i.id !== id));
      setDeleteConfirm({ open: false, id: "" });
      toast.success("Instalación eliminada");
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  if (installations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        <MapPin className="mx-auto h-10 w-10 opacity-50" />
        <p className="mt-2 text-sm">No hay instalaciones registradas.</p>
        <p className="text-xs mt-1">Crea instalaciones desde el detalle de una cuenta.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {installations.map((inst) => (
          <div
            key={inst.id}
            className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent/30"
          >
            <Link
              href={`/crm/installations/${inst.id}`}
              className="flex-1 min-w-0"
            >
              <p className="font-medium text-sm truncate">{inst.name}</p>
              {inst.account && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {inst.account.name}
                </p>
              )}
              {inst.address && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {inst.address}
                </p>
              )}
              {(inst.city || inst.commune) && (
                <p className="text-xs text-muted-foreground ml-4">
                  {[inst.commune, inst.city].filter(Boolean).join(", ")}
                </p>
              )}
              {inst.createdAt && (
                <CrmDates
                  createdAt={inst.createdAt}
                  updatedAt={inst.updatedAt}
                  className="mt-0.5 ml-0"
                />
              )}
            </Link>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
              onClick={() => setDeleteConfirm({ open: true, id: inst.id })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(v) => setDeleteConfirm({ ...deleteConfirm, open: v })}
        title="Eliminar instalación"
        description="La instalación será eliminada permanentemente. Esta acción no se puede deshacer."
        onConfirm={() => deleteInstallation(deleteConfirm.id)}
      />
    </>
  );
}
