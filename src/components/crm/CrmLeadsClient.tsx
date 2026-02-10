/* eslint-disable @typescript-eslint/no-misused-promises */
"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Loader2, AlertTriangle, Trash2, Search, ChevronRight, UserPlus, Phone, Mail, MessageSquare, Clock, Users, Calendar, Briefcase } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusBadge } from "@/components/opai/StatusBadge";
import { EmptyState } from "@/components/opai/EmptyState";
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

// Dominios genéricos que NO deben usarse como página web de la empresa
const GENERIC_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "hotmail.com", "outlook.com", "outlook.es",
  "yahoo.com", "yahoo.es", "live.com", "live.cl", "msn.com",
  "icloud.com", "me.com", "mac.com", "protonmail.com", "proton.me",
  "mail.com", "aol.com", "zoho.com", "yandex.com", "tutanota.com",
]);

/** Extrae dominio del email y retorna URL si no es genérico */
function extractWebsiteFromEmail(email: string): string {
  if (!email) return "";
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain || GENERIC_EMAIL_DOMAINS.has(domain)) return "";
  return `https://${domain}`;
}

/** Normaliza teléfono para tel: (solo dígitos) */
function telHref(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 0) return "";
  return `tel:${digits.length <= 9 ? "+56" + digits : "+" + digits}`;
}

/** URL WhatsApp Chile: +56 9 XXXXXXXX */
function whatsappHref(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 0) return "";
  const withCountry = digits.length === 9 && digits.startsWith("9") ? "56" + digits : digits.length >= 10 ? digits : "56" + digits;
  return `https://wa.me/${withCountry}`;
}

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
  website: string;
  // Instalación
  installationName: string;
  installationAddress: string;
  installationCity: string;
  installationCommune: string;
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

export function CrmLeadsClient({ initialLeads }: { initialLeads: CrmLead[] }) {
  const [leads, setLeads] = useState<CrmLead[]>(initialLeads);
  const [form, setForm] = useState<LeadFormState>(DEFAULT_FORM);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
    website: "",
    installationName: "",
    installationAddress: "",
    installationCity: "",
    installationCommune: "",
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

  const counts = useMemo(() => ({
    total: leads.length,
    pending: leads.filter((l) => l.status === "pending").length,
    approved: leads.filter((l) => l.status === "approved").length,
    rejected: leads.filter((l) => l.status === "rejected").length,
  }), [leads]);

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (statusFilter !== "all" && lead.status !== statusFilter) return false;
      if (q) {
        const searchable = `${lead.companyName || ""} ${lead.firstName || ""} ${lead.lastName || ""} ${lead.email || ""}`.toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [leads, statusFilter, search]);

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
      website: (lead as any).website || extractWebsiteFromEmail(lead.email || ""),
      installationName: lead.companyName || "",
      installationAddress: (lead as any).address || "",
      installationCity: (lead as any).city || "",
      installationCommune: (lead as any).commune || "",
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
          return;
        }
        setDuplicateChecked(true);
      }

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

  const statusFilters = [
    { key: "all", label: "Todos", count: counts.total },
    { key: "pending", label: "Pendientes", count: counts.pending },
    { key: "approved", label: "Aprobados", count: counts.approved },
    { key: "rejected", label: "Rechazados", count: counts.rejected },
  ];

  return (
    <div className="space-y-4">
      {/* ── Search + Filters + Create ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por empresa, contacto o email..."
            className="pl-9 h-9 bg-background text-foreground border-input"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {statusFilters.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setStatusFilter(opt.key)}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors shrink-0 ${
                  statusFilter === opt.key
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground border border-transparent"
                }`}
              >
                {opt.label} ({opt.count})
              </button>
            ))}
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="secondary" className="h-9 w-9 shrink-0">
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
                  <Label className="text-xs">Página web</Label>
                  <Input
                    value={approveForm.website}
                    onChange={(e) => updateApproveForm("website", e.target.value)}
                    placeholder="https://www.empresa.cl"
                    className={inputClassName}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Se detecta automáticamente desde el dominio del email. Se asocia a la cuenta.
                  </p>
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

            <div className="border-t border-border" />

            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Instalación
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Nombre instalación</Label>
                  <Input
                    value={approveForm.installationName}
                    onChange={(e) => updateApproveForm("installationName", e.target.value)}
                    placeholder="Bodega central, Sucursal norte..."
                    className={inputClassName}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Dirección</Label>
                  <Input
                    value={approveForm.installationAddress}
                    onChange={(e) => updateApproveForm("installationAddress", e.target.value)}
                    placeholder="Av. Ejemplo 123, Santiago"
                    className={inputClassName}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Comuna</Label>
                  <Input
                    value={approveForm.installationCommune}
                    onChange={(e) => updateApproveForm("installationCommune", e.target.value)}
                    placeholder="Las Condes"
                    className={inputClassName}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Ciudad</Label>
                  <Input
                    value={approveForm.installationCity}
                    onChange={(e) => updateApproveForm("installationCity", e.target.value)}
                    placeholder="Santiago"
                    className={inputClassName}
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Si dejas el nombre vacío no se creará instalación. Puedes agregar más instalaciones después desde la cuenta.
              </p>
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

      {/* ── Lead list ── */}
      <Card>
        <CardContent className="pt-5">
          {filteredLeads.length === 0 ? (
            <EmptyState
              icon={<UserPlus className="h-8 w-8" />}
              title="Sin prospectos"
              description={
                search || statusFilter !== "all"
                  ? "No hay prospectos para los filtros seleccionados."
                  : "No hay prospectos registrados todavía."
              }
              compact
            />
          ) : (
            <div className="space-y-2">
              {filteredLeads.map((lead) => {
                const meta = lead.metadata as Record<string, unknown> | undefined;
                const dotacion = (meta?.dotacion as { puesto: string; cantidad: number; dias?: string[]; horaInicio?: string; horaFin?: string }[] | undefined);
                const totalGuards = (meta?.totalGuards as number) || 0;

                return (
                  <div
                    key={lead.id}
                    className="rounded-lg border p-3 sm:p-4 transition-colors hover:bg-accent/30 group"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">
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
                          {totalGuards > 0 && (
                            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                              {totalGuards} guardia{totalGuards > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-xs text-muted-foreground">{leadDisplayName(lead)}</span>
                          {lead.email ? (
                            <a
                              href={`mailto:${lead.email}`}
                              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Mail className="h-3 w-3" />
                              {lead.email}
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin email</span>
                          )}
                          {lead.phone && (
                            <a
                              href={telHref(lead.phone)}
                              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Phone className="h-3 w-3" />
                              {lead.phone}
                            </a>
                          )}
                          <div className="flex items-center gap-1 ml-1">
                            {lead.phone && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                asChild
                              >
                                <a href={telHref(lead.phone)} onClick={(e) => e.stopPropagation()} aria-label="Llamar">
                                  <Phone className="h-3.5 w-3.5" />
                                </a>
                              </Button>
                            )}
                            {lead.email && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                asChild
                              >
                                <a href={`mailto:${lead.email}`} onClick={(e) => e.stopPropagation()} aria-label="Enviar email">
                                  <Mail className="h-3.5 w-3.5" />
                                </a>
                              </Button>
                            )}
                            {lead.phone && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-muted-foreground hover:text-emerald-600"
                                asChild
                              >
                                <a href={whatsappHref(lead.phone)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} aria-label="WhatsApp">
                                  <MessageSquare className="h-3.5 w-3.5" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 items-center">
                          <CrmDates createdAt={lead.createdAt} updatedAt={(lead as { updatedAt?: string }).updatedAt} showTime />
                          {lead.source && lead.source !== "web_cotizador" && lead.source !== "web_cotizador_inteligente" && (
                            <span className="text-[11px] text-muted-foreground/80">
                              Fuente: {lead.source}
                            </span>
                          )}
                          {lead.industry && (
                            <span className="text-[11px] text-muted-foreground/80">
                              Industria: {lead.industry}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {lead.status === "pending" && (
                          <Button
                            onClick={() => openApproveModal(lead)}
                            size="sm"
                          >
                            Revisar y aprobar
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ open: true, id: lead.id }); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Dotación solicitada — UI mejorada */}
                    {dotacion && dotacion.length > 0 && (
                      <div className="mt-3 rounded-lg border border-border/80 bg-muted/20 overflow-hidden">
                        <div className="px-3 py-2 border-b border-border/60 bg-muted/30 flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Dotación solicitada
                          </span>
                          {totalGuards > 0 && (
                            <span className="text-[10px] font-medium text-foreground bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                              {totalGuards} guardia{totalGuards > 1 ? "s" : ""} total
                            </span>
                          )}
                        </div>
                        <div className="divide-y divide-border/60">
                          {dotacion.map((d, i) => (
                            <div key={i} className="px-3 py-2.5 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="text-sm font-medium text-foreground truncate">{d.puesto}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground pl-5 sm:pl-0">
                                <span className="inline-flex items-center gap-1">
                                  <Users className="h-3 w-3 shrink-0" />
                                  {d.cantidad} guardia{d.cantidad > 1 ? "s" : ""}
                                </span>
                                {d.horaInicio && d.horaFin && (
                                  <span className="inline-flex items-center gap-1">
                                    <Clock className="h-3 w-3 shrink-0" />
                                    {d.horaInicio} – {d.horaFin}
                                  </span>
                                )}
                                {d.dias && d.dias.length > 0 && (
                                  <span className="inline-flex items-center gap-1">
                                    <Calendar className="h-3 w-3 shrink-0" />
                                    {d.dias.length === 7 ? "Todos los días" : d.dias.join(", ")}
                                  </span>
                                )}
                              </div>
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
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(v) => setDeleteConfirm({ ...deleteConfirm, open: v })}
        title="Eliminar prospecto"
        description="El prospecto será eliminado permanentemente. Esta acción no se puede deshacer."
        onConfirm={() => deleteLead(deleteConfirm.id)}
      />
    </div>
  );
}
