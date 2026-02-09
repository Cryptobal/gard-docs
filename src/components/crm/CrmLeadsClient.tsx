/* eslint-disable @typescript-eslint/no-misused-promises */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CrmLead } from "@/types";
import { Plus, Loader2, CheckCircle2, Clock, XCircle, AlertTriangle, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CrmDates } from "@/components/crm/CrmDates";
import { toast } from "sonner";

/* ─── Form types ─── */

type LeadFormState = {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source: string;
};

type ApproveFormState = {
  accountName: string;
  contactFirstName: string;
  contactLastName: string;
  email: string;
  phone: string;
  dealTitle: string;
  rut: string;
  industry: string;
  segment: string;
  roleTitle: string;
};

const DEFAULT_FORM: LeadFormState = {
  companyName: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  source: "",
};

type DuplicateAccount = { id: string; name: string; rut?: string | null; type?: string };

/* ─── Status badge helper ─── */

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="border-amber-500/30 text-amber-400 gap-1">
          <Clock className="h-3 w-3" /> Pendiente
        </Badge>
      );
    case "approved":
      return (
        <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 gap-1">
          <CheckCircle2 className="h-3 w-3" /> Aprobado
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="outline" className="border-red-500/30 text-red-400 gap-1">
          <XCircle className="h-3 w-3" /> Rechazado
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function CrmLeadsClient({ initialLeads }: { initialLeads: CrmLead[] }) {
  const [leads, setLeads] = useState<CrmLead[]>(initialLeads);
  const [form, setForm] = useState<LeadFormState>(DEFAULT_FORM);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);

  // Approve modal state
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveLeadId, setApproveLeadId] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateAccount[]>([]);
  const [duplicateChecked, setDuplicateChecked] = useState(false);
  const [approveForm, setApproveForm] = useState<ApproveFormState>({
    accountName: "",
    contactFirstName: "",
    contactLastName: "",
    email: "",
    phone: "",
    dealTitle: "",
    rut: "",
    industry: "",
    segment: "",
    roleTitle: "",
  });

  const [industries, setIndustries] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/crm/industries?active=true")
      .then((r) => r.json())
      .then((res) => res.success && setIndustries(res.data || []))
      .catch(() => {});
  }, []);

  const inputClassName =
    "bg-background text-foreground placeholder:text-muted-foreground border-input focus-visible:ring-ring";
  const selectClassName =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  const pendingLeads = useMemo(
    () => leads.filter((lead) => lead.status === "pending"),
    [leads]
  );

  const processedLeads = useMemo(
    () => leads.filter((lead) => lead.status !== "pending"),
    [leads]
  );

  const updateForm = (key: keyof LeadFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateApproveForm = (key: keyof ApproveFormState, value: string) => {
    setApproveForm((prev) => ({ ...prev, [key]: value }));
    if (key === "accountName") {
      setDuplicateChecked(false);
      setDuplicates([]);
    }
  };

  const createLead = async () => {
    setCreating(true);
    try {
      const response = await fetch("/api/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Error creando prospecto");
      }
      setLeads((prev) => [payload.data, ...prev]);
      setForm(DEFAULT_FORM);
      setOpen(false);
      toast.success("Lead creado exitosamente");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo crear el lead.");
    } finally {
      setCreating(false);
    }
  };

  const openApproveModal = (lead: CrmLead) => {
    setApproveLeadId(lead.id);
    setDuplicates([]);
    setDuplicateChecked(false);
    const fullName = [lead.firstName, lead.lastName].filter(Boolean).join(" ");
    setApproveForm({
      accountName: lead.companyName || "",
      contactFirstName: lead.firstName || "",
      contactLastName: lead.lastName || "",
      email: lead.email || "",
      phone: lead.phone || "",
      dealTitle: `Oportunidad ${lead.companyName || fullName || ""}`.trim(),
      rut: "",
      industry: lead.industry || "",
      segment: "",
      roleTitle: "",
    });
    setApproveOpen(true);
  };

  const approveLead = async () => {
    if (!approveLeadId) return;
    if (!approveForm.accountName.trim()) {
      toast.error("El nombre de la empresa es obligatorio.");
      return;
    }

    setApproving(true);
    try {
      // First check for duplicates if not already checked
      if (!duplicateChecked) {
        const checkRes = await fetch(`/api/crm/leads/${approveLeadId}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...approveForm, checkDuplicates: true }),
        });
        const checkData = await checkRes.json();
        if (checkData.duplicates && checkData.duplicates.length > 0) {
          setDuplicates(checkData.duplicates);
          setDuplicateChecked(true);
          setApproving(false);
          return; // Show duplicates, user must confirm
        }
        setDuplicateChecked(true);
      }

      // Proceed with approval
      const response = await fetch(`/api/crm/leads/${approveLeadId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(approveForm),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Error aprobando lead");
      }
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === approveLeadId ? { ...lead, status: "approved" } : lead
        )
      );
      setApproveOpen(false);
      setApproveLeadId(null);
      setDuplicates([]);
      setDuplicateChecked(false);
      toast.success("Lead aprobado — Cuenta, contacto y negocio creados");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo aprobar el lead.");
    } finally {
      setApproving(false);
    }
  };

  const leadDisplayName = (lead: CrmLead) => {
    const parts = [lead.firstName, lead.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "Sin contacto";
  };

  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: "" });

  const deleteLead = async (id: string) => {
    try {
      const res = await fetch(`/api/crm/leads/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setLeads((prev) => prev.filter((l) => l.id !== id));
      setDeleteConfirm({ open: false, id: "" });
      toast.success("Prospecto eliminado");
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Solicitudes entrantes para aprobación manual.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="secondary" className="h-9 w-9">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Nuevo lead</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nuevo lead</DialogTitle>
              <DialogDescription>
                Ingresa los datos básicos del contacto.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Empresa</Label>
                <Input
                  value={form.companyName}
                  onChange={(event) => updateForm("companyName", event.target.value)}
                  placeholder="Nombre de la empresa"
                  className={inputClassName}
                />
              </div>
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={form.firstName}
                  onChange={(event) => updateForm("firstName", event.target.value)}
                  placeholder="Nombre"
                  className={inputClassName}
                />
              </div>
              <div className="space-y-2">
                <Label>Apellido</Label>
                <Input
                  value={form.lastName}
                  onChange={(event) => updateForm("lastName", event.target.value)}
                  placeholder="Apellido"
                  className={inputClassName}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={form.email}
                  onChange={(event) => updateForm("email", event.target.value)}
                  placeholder="correo@empresa.com"
                  className={inputClassName}
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={form.phone}
                  onChange={(event) => updateForm("phone", event.target.value)}
                  placeholder="+56 9 1234 5678"
                  className={inputClassName}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Fuente</Label>
                <Input
                  value={form.source}
                  onChange={(event) => updateForm("source", event.target.value)}
                  placeholder="Formulario web, referido, inbound, etc."
                  className={inputClassName}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={createLead} disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar lead
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Approve Modal ── */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aprobar lead</DialogTitle>
            <DialogDescription>
              Revisa y edita los datos antes de crear la cuenta, contacto y negocio.
            </DialogDescription>
          </DialogHeader>

          {/* Duplicate warning */}
          {duplicates.length > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                <AlertTriangle className="h-4 w-4" />
                Posible(s) duplicado(s) encontrado(s)
              </div>
              {duplicates.map((dup) => (
                <div key={dup.id} className="text-xs text-muted-foreground pl-6">
                  {dup.name} {dup.rut ? `(${dup.rut})` : ""} — {dup.type === "client" ? "Cliente" : "Prospecto"}
                </div>
              ))}
              <p className="text-xs text-muted-foreground pl-6">
                Puedes continuar si es una empresa distinta.
              </p>
            </div>
          )}

          <div className="space-y-5">
            {/* Account section */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Cuenta (Prospecto)
              </h4>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs">Nombre de empresa *</Label>
                  <Input
                    value={approveForm.accountName}
                    onChange={(e) => updateApproveForm("accountName", e.target.value)}
                    placeholder="Nombre de la empresa"
                    className={inputClassName}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">RUT</Label>
                  <Input
                    value={approveForm.rut}
                    onChange={(e) => updateApproveForm("rut", e.target.value)}
                    placeholder="76.123.456-7"
                    className={inputClassName}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Industria</Label>
                  <select
                    className={selectClassName}
                    value={approveForm.industry}
                    onChange={(e) => updateApproveForm("industry", e.target.value)}
                  >
                    <option value="">Seleccionar industria</option>
                    {industries.map((i) => (
                      <option key={i.id} value={i.name}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs">Segmento</Label>
                  <Input
                    value={approveForm.segment}
                    onChange={(e) => updateApproveForm("segment", e.target.value)}
                    placeholder="Corporativo, PYME..."
                    className={inputClassName}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Contact section */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Contacto principal
              </h4>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nombre *</Label>
                  <Input
                    value={approveForm.contactFirstName}
                    onChange={(e) => updateApproveForm("contactFirstName", e.target.value)}
                    placeholder="Nombre"
                    className={inputClassName}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Apellido</Label>
                  <Input
                    value={approveForm.contactLastName}
                    onChange={(e) => updateApproveForm("contactLastName", e.target.value)}
                    placeholder="Apellido"
                    className={inputClassName}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Cargo</Label>
                  <Input
                    value={approveForm.roleTitle}
                    onChange={(e) => updateApproveForm("roleTitle", e.target.value)}
                    placeholder="Gerente, jefe..."
                    className={inputClassName}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input
                    value={approveForm.email}
                    onChange={(e) => updateApproveForm("email", e.target.value)}
                    placeholder="correo@empresa.com"
                    className={inputClassName}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Teléfono</Label>
                  <Input
                    value={approveForm.phone}
                    onChange={(e) => updateApproveForm("phone", e.target.value)}
                    placeholder="+56 9 1234 5678"
                    className={inputClassName}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Deal section */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Negocio
              </h4>
              <div className="space-y-1.5">
                <Label className="text-xs">Título del negocio</Label>
                <Input
                  value={approveForm.dealTitle}
                  onChange={(e) => updateApproveForm("dealTitle", e.target.value)}
                  placeholder="Oportunidad para..."
                  className={inputClassName}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setApproveOpen(false)} disabled={approving}>
              Cancelar
            </Button>
            <Button onClick={approveLead} disabled={approving}>
              {approving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {duplicates.length > 0 ? "Crear de todos modos" : "Confirmar aprobación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Pending leads ── */}
      <Card>
        <CardHeader>
          <CardTitle>Leads pendientes</CardTitle>
          <CardDescription>
            Revisa y aprueba para crear cuenta + contacto + negocio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingLeads.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No hay leads pendientes.
            </p>
          )}
          {pendingLeads.map((lead) => {
            const meta = lead.metadata as any;
            const dotacion = meta?.dotacion as { puesto: string; cantidad: number; dias?: string[]; horaInicio?: string; horaFin?: string }[] | undefined;
            const totalGuards = meta?.totalGuards || 0;
            return (
              <div
                key={lead.id}
                className="rounded-lg border p-4 space-y-2"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">
                        {lead.companyName || "Empresa sin nombre"}
                      </p>
                      <StatusBadge status={lead.status} />
                      {lead.source === "web_cotizador" && (
                        <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                          Web
                        </span>
                      )}
                      {lead.source === "web_cotizador_inteligente" && (
                        <span className="rounded-full bg-teal-500/15 px-2 py-0.5 text-[10px] font-medium text-teal-400">
                          Cotizador Inteligente
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {leadDisplayName(lead)} · {lead.email || "Sin email"}{" "}
                      {lead.phone ? `· ${lead.phone}` : ""}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 items-center">
                      <CrmDates createdAt={lead.createdAt} updatedAt={(lead as { updatedAt?: string }).updatedAt} />
                      {lead.source && lead.source !== "web_cotizador" && lead.source !== "web_cotizador_inteligente" && (
                        <p className="text-xs text-muted-foreground">
                          Fuente: {lead.source}
                        </p>
                      )}
                      {lead.industry && (
                        <p className="text-xs text-muted-foreground">
                          Industria: {lead.industry}
                        </p>
                      )}
                      {lead.serviceType && (
                        <p className="text-xs text-muted-foreground">
                          Servicio: {lead.serviceType}
                        </p>
                      )}
                      {totalGuards > 0 && (
                        <p className="text-xs text-emerald-400 font-medium">
                          {totalGuards} guardia{totalGuards > 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                  <Button
                    onClick={() => openApproveModal(lead)}
                    size="sm"
                  >
                    Revisar y aprobar
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ open: true, id: lead.id }); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                </div>

                {/* Dotación summary */}
                {dotacion && dotacion.length > 0 && (
                  <div className="rounded-md bg-muted/30 p-2 mt-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Dotación solicitada
                    </p>
                    <div className="space-y-1">
                      {dotacion.map((d, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{d.puesto}</span>
                          <span>·</span>
                          <span>{d.cantidad} guardia{d.cantidad > 1 ? "s" : ""}</span>
                          {d.horaInicio && d.horaFin && (
                            <>
                              <span>·</span>
                              <span>{d.horaInicio} - {d.horaFin}</span>
                            </>
                          )}
                          {d.dias && d.dias.length > 0 && d.dias.length < 7 && (
                            <>
                              <span>·</span>
                              <span>{d.dias.join(", ")}</span>
                            </>
                          )}
                          {d.dias && d.dias.length === 7 && (
                            <>
                              <span>·</span>
                              <span>Todos los días</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes preview */}
                {lead.notes && !dotacion && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {lead.notes}
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* ── Processed leads ── */}
      <Card>
        <CardHeader>
          <CardTitle>Leads procesados</CardTitle>
          <CardDescription>Historial de leads ya revisados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {processedLeads.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No hay leads procesados todavía.
            </p>
          )}
          {processedLeads.map((lead) => (
            <div
              key={lead.id}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
            >
              <div>
                <p className="font-medium">
                  {lead.companyName || "Empresa sin nombre"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {leadDisplayName(lead)}
                </p>
                <CrmDates createdAt={lead.createdAt} updatedAt={(lead as { updatedAt?: string }).updatedAt} />
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={lead.status} />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteConfirm({ open: true, id: lead.id })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(v) => setDeleteConfirm({ ...deleteConfirm, open: v })}
        title="Eliminar prospecto"
        description="Se desvincularán las instalaciones asociadas. Esta acción no se puede deshacer."
        onConfirm={() => deleteLead(deleteConfirm.id)}
      />
    </div>
  );
}
