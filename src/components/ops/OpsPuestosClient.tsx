"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/opai";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Building2, ExternalLink, UserPlus, UserMinus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/* ── constants ─────────────────────────────────── */

const LIFECYCLE_COLORS: Record<string, string> = {
  postulante: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  seleccionado: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  contratado_activo: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  inactivo: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  desvinculado: "bg-red-500/15 text-red-300 border-red-500/30",
};

const LIFECYCLE_LABELS: Record<string, string> = {
  postulante: "Postulante",
  seleccionado: "Seleccionado",
  contratado_activo: "Contratado",
  inactivo: "Inactivo",
  desvinculado: "Desvinculado",
};

/* ── types ─────────────────────────────────────── */

type InstallationOption = { id: string; name: string; teMontoClp?: number | string | null };
type ClientOption = { id: string; name: string; rut?: string | null; installations: InstallationOption[] };

type PuestoItem = {
  id: string;
  installationId: string;
  name: string;
  shiftStart: string;
  shiftEnd: string;
  weekdays: string[];
  requiredGuards: number;
  active: boolean;
  cargo?: { id: string; name: string } | null;
  rol?: { id: string; name: string } | null;
};

type AsignacionItem = {
  id: string;
  guardiaId: string;
  puestoId: string;
  slotNumber: number;
  installationId: string;
  isActive: boolean;
  startDate: string;
  guardia: {
    id: string;
    code?: string | null;
    lifecycleStatus: string;
    persona: { firstName: string; lastName: string; rut?: string | null };
  };
};

type GuardiaOption = {
  id: string;
  code?: string | null;
  lifecycleStatus: string;
  persona: { firstName: string; lastName: string; rut?: string | null };
};

interface OpsPuestosClientProps {
  initialClients: ClientOption[];
  initialPuestos: PuestoItem[];
  initialAsignaciones: AsignacionItem[];
  guardias: GuardiaOption[];
}

/* ── component ─────────────────────────────────── */

export function OpsPuestosClient({
  initialClients,
  initialPuestos,
  initialAsignaciones,
  guardias,
}: OpsPuestosClientProps) {
  const [clients] = useState<ClientOption[]>(initialClients);
  const [clientId, setClientId] = useState<string>(initialClients[0]?.id ?? "");
  const [installationId, setInstallationId] = useState<string>(
    initialClients[0]?.installations?.[0]?.id ?? ""
  );
  const [puestos, setPuestos] = useState<PuestoItem[]>(initialPuestos);
  const [asignaciones, setAsignaciones] = useState<AsignacionItem[]>(initialAsignaciones);

  // Assignment modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<{ puestoId: string; slotNumber: number; puestoName: string } | null>(null);
  const [assignGuardiaId, setAssignGuardiaId] = useState("");
  const [assignSearch, setAssignSearch] = useState("");
  const [assignDate, setAssignDate] = useState(toDateInput(new Date()));
  const [assignWarning, setAssignWarning] = useState<{
    puestoName: string;
    installationName: string;
    accountName?: string | null;
  } | null>(null);
  const [assignSaving, setAssignSaving] = useState(false);

  // Unassign modal
  const [unassignConfirm, setUnassignConfirm] = useState<{ open: boolean; asignacionId: string; guardiaName: string }>({
    open: false, asignacionId: "", guardiaName: "",
  });
  const [unassignDate, setUnassignDate] = useState(toDateInput(new Date()));
  const [unassignSaving, setUnassignSaving] = useState(false);

  const currentClient = useMemo(() => clients.find((c) => c.id === clientId), [clients, clientId]);
  const installations = currentClient?.installations ?? [];

  useEffect(() => {
    setInstallationId(installations[0]?.id ?? "");
  }, [clientId, installations]);

  const filtered = useMemo(() => {
    if (!installationId) return [];
    return puestos.filter((item) => item.installationId === installationId && item.active);
  }, [puestos, installationId]);

  // Fetch puestos + asignaciones when installation changes
  const fetchData = useCallback(async () => {
    if (!installationId) return;
    try {
      const [pRes, aRes] = await Promise.all([
        fetch(`/api/ops/puestos?installationId=${installationId}`, { cache: "no-store" }),
        fetch(`/api/ops/asignaciones?installationId=${installationId}&activeOnly=true`, { cache: "no-store" }),
      ]);
      const pData = await pRes.json();
      const aData = await aRes.json();
      if (pRes.ok && pData.success) {
        setPuestos((prev) => {
          const other = prev.filter((p) => p.installationId !== installationId);
          return [...other, ...(pData.data as PuestoItem[])];
        });
      }
      if (aRes.ok && aData.success) {
        setAsignaciones((prev) => {
          const other = prev.filter((a) => a.installationId !== installationId);
          return [...other, ...(aData.data as AsignacionItem[])];
        });
      }
    } catch { /* silent */ }
  }, [installationId]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  // Get asignacion for a specific puesto+slot
  const getSlotAssignment = (puestoId: string, slot: number) =>
    asignaciones.find((a) => a.puestoId === puestoId && a.slotNumber === slot && a.isActive);

  // Guardias already assigned (cannot assign twice)
  const assignedGuardiaIds = useMemo(
    () => new Set(asignaciones.filter((a) => a.isActive).map((a) => a.guardiaId)),
    [asignaciones]
  );

  // Filtered guardias for assignment modal
  const availableGuardias = useMemo(() => {
    const q = assignSearch.trim().toLowerCase();
    return guardias.filter((g) => {
      if (assignedGuardiaIds.has(g.id)) return false;
      if (q) {
        const hay = `${g.persona.firstName} ${g.persona.lastName} ${g.code ?? ""} ${g.persona.rut ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [guardias, assignedGuardiaIds, assignSearch]);

  // Open assign modal
  const openAssign = (puestoId: string, slotNumber: number, puestoName: string) => {
    setAssignTarget({ puestoId, slotNumber, puestoName });
    setAssignGuardiaId("");
    setAssignSearch("");
    setAssignDate(toDateInput(new Date()));
    setAssignWarning(null);
    setAssignModalOpen(true);
  };

  // Check if selected guardia has existing assignment
  useEffect(() => {
    if (!assignGuardiaId) {
      setAssignWarning(null);
      return;
    }
    const controller = new AbortController();
    fetch("/api/ops/asignaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "check", guardiaId: assignGuardiaId }),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((payload) => {
        if (payload.success && payload.data?.hasActiveAssignment) {
          setAssignWarning({
            puestoName: payload.data.assignment.puestoName,
            installationName: payload.data.assignment.installationName,
            accountName: payload.data.assignment.accountName,
          });
        } else {
          setAssignWarning(null);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [assignGuardiaId]);

  // Assign guardia
  const handleAssign = async () => {
    if (!assignTarget || !assignGuardiaId) {
      toast.error("Selecciona un guardia");
      return;
    }
    setAssignSaving(true);
    try {
      const res = await fetch("/api/ops/asignaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guardiaId: assignGuardiaId,
          puestoId: assignTarget.puestoId,
          slotNumber: assignTarget.slotNumber,
          startDate: assignDate,
        }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) throw new Error(payload.error || "Error");
      toast.success("Guardia asignado");
      setAssignModalOpen(false);
      await fetchData();
    } catch (error: any) {
      toast.error(error?.message || "No se pudo asignar");
    } finally {
      setAssignSaving(false);
    }
  };

  // Unassign guardia
  const handleUnassign = async () => {
    setUnassignSaving(true);
    try {
      const res = await fetch("/api/ops/asignaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "desasignar",
          asignacionId: unassignConfirm.asignacionId,
          endDate: unassignDate,
          reason: "Desasignado manualmente",
        }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) throw new Error(payload.error || "Error");
      toast.success("Guardia desasignado");
      setUnassignConfirm({ open: false, asignacionId: "", guardiaName: "" });
      await fetchData();
    } catch (error: any) {
      toast.error(error?.message || "No se pudo desasignar");
    } finally {
      setUnassignSaving(false);
    }
  };

  const isNightShift = (shiftStart: string) => {
    const h = parseInt(shiftStart.split(":")[0], 10);
    return h >= 18 || h < 6;
  };

  return (
    <div className="space-y-4">
      {/* Client / Installation selectors */}
      <Card>
        <CardContent className="pt-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                {clients.length === 0 && <option value="">Sin clientes activos</option>}
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}{c.rut ? ` (${c.rut})` : ""}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Instalación</Label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={installationId}
                onChange={(e) => setInstallationId(e.target.value)}
              >
                {installations.length === 0 && <option value="">Sin instalaciones activas</option>}
                {installations.map((inst) => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Puestos with slots */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Puestos operativos</h3>
              <p className="text-xs text-muted-foreground">
                {currentClient?.name ?? "—"} · {installations.find((i) => i.id === installationId)?.name ?? "—"}
              </p>
            </div>
            {installationId && (
              <Link
                href={`/crm/installations/${installationId}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Ver en CRM
              </Link>
            )}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Building2 className="h-8 w-8" />}
              title="Sin puestos"
              description={installationId ? "No hay puestos activos para esta instalación." : "Selecciona un cliente e instalación."}
              compact
            />
          ) : (
            <div className="space-y-3">
              {filtered.map((puesto) => {
                const night = isNightShift(puesto.shiftStart);
                return (
                  <div key={puesto.id} className="rounded-lg border border-border p-4 space-y-3">
                    {/* Puesto header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{puesto.name}</p>
                          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold border ${
                            night
                              ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                              : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          }`}>
                            {night ? "Noche" : "Día"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {(puesto.cargo?.name || puesto.rol?.name) ? (
                            <>{puesto.cargo?.name ?? "—"} / {puesto.rol?.name ?? "—"} · </>
                          ) : null}
                          {puesto.shiftStart} - {puesto.shiftEnd} · {puesto.requiredGuards} slot(s)
                        </p>
                      </div>
                    </div>

                    {/* Slots */}
                    <div className="space-y-1.5">
                      {Array.from({ length: puesto.requiredGuards }, (_, i) => i + 1).map((slotNum) => {
                        const assignment = getSlotAssignment(puesto.id, slotNum);
                        return (
                          <div
                            key={slotNum}
                            className={`flex items-center justify-between rounded-md border px-3 py-2 text-xs ${
                              assignment
                                ? "border-border/60 bg-card"
                                : "border-dashed border-amber-500/30 bg-amber-500/5"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground font-mono text-[10px] w-10">
                                Slot {slotNum}
                              </span>
                              {assignment ? (
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/personas/guardias/${assignment.guardiaId}`}
                                    className="font-medium hover:text-primary transition-colors hover:underline underline-offset-2"
                                  >
                                    {assignment.guardia.persona.firstName} {assignment.guardia.persona.lastName}
                                  </Link>
                                  {assignment.guardia.code && (
                                    <span className="text-muted-foreground">({assignment.guardia.code})</span>
                                  )}
                                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium border ${
                                    LIFECYCLE_COLORS[assignment.guardia.lifecycleStatus] ?? LIFECYCLE_COLORS.postulante
                                  }`}>
                                    {LIFECYCLE_LABELS[assignment.guardia.lifecycleStatus] ?? assignment.guardia.lifecycleStatus}
                                  </span>
                                  <span className="text-[9px] text-muted-foreground">
                                    desde {(() => {
                                      const d = new Date(assignment.startDate);
                                      return `${String(d.getUTCDate()).padStart(2,"0")}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${d.getUTCFullYear()}`;
                                    })()}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-amber-400 italic">Vacante (PPC)</span>
                              )}
                            </div>

                            <div>
                              {assignment ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 sm:h-6 text-xs sm:text-[10px] px-2.5 sm:px-2 text-muted-foreground"
                                  onClick={() =>
                                    setUnassignConfirm({
                                      open: true,
                                      asignacionId: assignment.id,
                                      guardiaName: `${assignment.guardia.persona.firstName} ${assignment.guardia.persona.lastName}`,
                                    })
                                  }
                                >
                                  <UserMinus className="h-3 w-3 mr-1" />
                                  Desasignar
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 sm:h-6 text-xs sm:text-[10px] px-2.5 sm:px-2"
                                  onClick={() => openAssign(puesto.id, slotNum, puesto.name)}
                                >
                                  <UserPlus className="h-3 w-3 mr-1" />
                                  Asignar
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-[10px] text-muted-foreground/60 border-t border-border pt-3">
            Los puestos se gestionan desde el CRM. Aquí se asignan guardias a cada slot.
          </p>
        </CardContent>
      </Card>

      {/* Assign modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar guardia</DialogTitle>
            <DialogDescription>
              {assignTarget ? `${assignTarget.puestoName} — Slot ${assignTarget.slotNumber}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Date */}
            <div className="space-y-1.5">
              <Label>Fecha efectiva</Label>
              <input
                type="date"
                value={assignDate}
                onChange={(e) => setAssignDate(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
              <p className="text-[10px] text-muted-foreground">
                El guardia será asignado desde esta fecha. La pauta anterior no se modifica.
              </p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, código o RUT..."
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Warning */}
            {assignWarning && (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-300">
                Este guardia ya está asignado a <span className="font-semibold">{assignWarning.puestoName}</span> en{" "}
                <span className="font-semibold">{assignWarning.installationName}</span>
                {assignWarning.accountName && ` (${assignWarning.accountName})`}.
                <br />
                Al confirmar, se cerrará esa asignación y se limpiará la pauta desde la fecha indicada.
              </div>
            )}

            {/* Guard list */}
            <div className="max-h-[250px] overflow-y-auto space-y-1 rounded-md border border-border p-1">
              {availableGuardias.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No hay guardias disponibles
                </p>
              ) : (
                availableGuardias.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setAssignGuardiaId(g.id)}
                    className={`w-full text-left rounded-md px-3 py-2 text-xs transition-colors ${
                      assignGuardiaId === g.id
                        ? "bg-primary/15 border border-primary/30"
                        : "hover:bg-accent border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">
                          {g.persona.firstName} {g.persona.lastName}
                        </span>
                        {g.code && <span className="text-muted-foreground ml-1">({g.code})</span>}
                        {g.persona.rut && <span className="text-muted-foreground ml-1">· {g.persona.rut}</span>}
                      </div>
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium border ${
                        LIFECYCLE_COLORS[g.lifecycleStatus] ?? LIFECYCLE_COLORS.postulante
                      }`}>
                        {LIFECYCLE_LABELS[g.lifecycleStatus] ?? g.lifecycleStatus}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAssign} disabled={assignSaving || !assignGuardiaId}>
              {assignSaving ? "Asignando..." : "Asignar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unassign confirmation */}
      <Dialog open={unassignConfirm.open} onOpenChange={(open) => {
        if (open) setUnassignDate(toDateInput(new Date()));
        setUnassignConfirm((p) => ({ ...p, open }));
      }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Desasignar guardia</DialogTitle>
            <DialogDescription>
              ¿Desasignar a {unassignConfirm.guardiaName} de este puesto?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Fecha efectiva</Label>
              <input
                type="date"
                value={unassignDate}
                onChange={(e) => setUnassignDate(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
              <p className="text-[10px] text-muted-foreground">
                Se limpiará la pauta desde esta fecha. El slot quedará vacante (PPC).
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnassignConfirm((p) => ({ ...p, open: false }))}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleUnassign} disabled={unassignSaving}>
              {unassignSaving ? "Desasignando..." : "Desasignar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
