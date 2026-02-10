"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Trash2, Search, ChevronRight, Building2, CheckSquare, Square, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/opai/EmptyState";
import { CrmDates } from "@/components/crm/CrmDates";
import { ViewToggle, type ViewMode } from "./ViewToggle";

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const [accountFilter, setAccountFilter] = useState<string>("all");

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredInstallations.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredInstallations.map((i) => i.id)));
  };
  const clearSelection = () => setSelectedIds(new Set());

  const filteredInstallations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return installations.filter((inst) => {
      if (accountFilter !== "all" && inst.account?.id !== accountFilter) return false;
      if (q) {
        const searchable = `${inst.name} ${inst.address || ""} ${inst.city || ""} ${inst.commune || ""} ${inst.account?.name || ""}`.toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [installations, search, accountFilter]);

  // Get unique accounts for filter pills
  const accountsWithInstallations = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    installations.forEach((inst) => {
      if (inst.account) {
        const existing = map.get(inst.account.id);
        if (existing) {
          existing.count++;
        } else {
          map.set(inst.account.id, { id: inst.account.id, name: inst.account.name, count: 1 });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [installations]);

  const deleteInstallation = async (id: string) => {
    try {
      const res = await fetch(`/api/crm/installations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setInstallations((prev) => prev.filter((i) => i.id !== id));
      setDeleteConfirm({ open: false, id: "" });
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      toast.success("Instalación eliminada");
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  const bulkDeleteInstallations = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkDeleting(true);
    try {
      let ok = 0;
      for (const id of ids) {
        const res = await fetch(`/api/crm/installations/${id}`, { method: "DELETE" });
        if (res.ok) ok++;
      }
      setInstallations((prev) => prev.filter((i) => !ids.includes(i.id)));
      setSelectedIds(new Set());
      setBulkDeleteConfirm(false);
      toast.success(ok === ids.length ? `${ok} instalación${ok > 1 ? "es" : ""} eliminada${ok > 1 ? "s" : ""}` : `Eliminadas ${ok} de ${ids.length}`);
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div className={`space-y-4 ${selectedIds.size > 0 ? "pb-24" : ""}`}>
      {/* ── Search + Filters ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, dirección o cuenta..."
            className="pl-9 h-9 bg-background text-foreground border-input"
          />
        </div>
        {filteredInstallations.length > 0 && (
          <Button variant="ghost" size="sm" className="shrink-0 gap-1.5" onClick={toggleSelectAll}>
            {selectedIds.size === filteredInstallations.length ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
            {selectedIds.size === filteredInstallations.length ? "Deseleccionar todos" : "Seleccionar todos"}
          </Button>
        )}
        <div className="flex items-center gap-2">
          <ViewToggle view={view} onChange={setView} />
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            <button
              type="button"
              onClick={() => setAccountFilter("all")}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors shrink-0 ${
                accountFilter === "all"
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              Todas ({installations.length})
            </button>
            {accountsWithInstallations.slice(0, 5).map((acc) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => setAccountFilter(acc.id)}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors shrink-0 ${
                  accountFilter === acc.id
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground border border-transparent"
                }`}
              >
                {acc.name} ({acc.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Installation list ── */}
      <Card>
        <CardContent className="pt-5">
          {filteredInstallations.length === 0 ? (
            <EmptyState
              icon={<MapPin className="h-8 w-8" />}
              title="Sin instalaciones"
              description={
                search || accountFilter !== "all"
                  ? "No hay instalaciones para los filtros seleccionados."
                  : "No hay instalaciones registradas. Crea instalaciones desde el detalle de una cuenta."
              }
              compact
            />
          ) : view === "list" ? (
            <div className="space-y-2">
              {filteredInstallations.map((inst) => {
                const selected = selectedIds.has(inst.id);
                return (
                  <div
                    key={inst.id}
                    className={`flex items-center gap-2 rounded-lg border p-3 sm:p-4 transition-colors group ${selected ? "border-primary/50 bg-primary/5" : "hover:bg-accent/30"}`}
                  >
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSelection(inst.id); }}
                      className="shrink-0 p-1 rounded text-muted-foreground hover:text-foreground"
                      aria-label={selected ? "Quitar de selección" : "Seleccionar"}
                    >
                      {selected ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5" />}
                    </button>
                    <Link href={`/crm/installations/${inst.id}`} className="flex flex-1 items-center justify-between min-w-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{inst.name}</p>
                        {inst.account && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{inst.account.name}</p>
                        )}
                        {inst.address && (
                          <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {inst.address}
                            {(inst.city || inst.commune) && (
                              <span> · {[inst.commune, inst.city].filter(Boolean).join(", ")}</span>
                            )}
                          </p>
                        )}
                        {inst.createdAt && (
                          <CrmDates createdAt={inst.createdAt} updatedAt={inst.updatedAt} className="mt-0.5" />
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 shrink-0 ml-2" />
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredInstallations.map((inst) => {
                const selected = selectedIds.has(inst.id);
                return (
                  <div
                    key={inst.id}
                    className={`rounded-lg border p-4 transition-colors hover:border-primary/30 group space-y-2.5 ${selected ? "border-primary/50 bg-primary/5" : "hover:bg-accent/30"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSelection(inst.id); }}
                        className="shrink-0 p-0.5 rounded text-muted-foreground hover:text-foreground"
                        aria-label={selected ? "Quitar de selección" : "Seleccionar"}
                      >
                        {selected ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5" />}
                      </button>
                      <Link href={`/crm/installations/${inst.id}`} className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">{inst.name}</p>
                            {inst.account && <p className="text-[11px] text-muted-foreground">{inst.account.name}</p>}
                          </div>
                        </div>
                        {inst.address && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {inst.address}
                          </p>
                        )}
                        {(inst.commune || inst.city) && (
                          <p className="text-xs text-muted-foreground">
                            {[inst.commune, inst.city].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </Link>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card px-4 py-3 shadow-lg sm:left-[var(--sidebar-width,280px)]">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
            <span className="text-sm font-medium">
              {selectedIds.size} instalación{selectedIds.size !== 1 ? "es" : ""} seleccionada{selectedIds.size !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Deseleccionar
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setBulkDeleteConfirm(true)} disabled={bulkDeleting}>
                {bulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={bulkDeleteConfirm}
        onOpenChange={setBulkDeleteConfirm}
        title="Eliminar instalaciones seleccionadas"
        description="Las instalaciones serán eliminadas permanentemente. Esta acción no se puede deshacer."
        onConfirm={bulkDeleteInstallations}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(v) => setDeleteConfirm({ ...deleteConfirm, open: v })}
        title="Eliminar instalación"
        description="La instalación será eliminada permanentemente. Esta acción no se puede deshacer."
        onConfirm={() => deleteInstallation(deleteConfirm.id)}
      />
    </div>
  );
}
