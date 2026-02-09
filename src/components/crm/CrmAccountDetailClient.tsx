"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/opai/EmptyState";
import { CrmInstallationsClient } from "./CrmInstallationsClient";
import {
  Building2,
  Users,
  TrendingUp,
  Mail,
  Phone,
  Globe,
  MapPin,
  Warehouse,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type ContactRow = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  roleTitle?: string | null;
  isPrimary?: boolean;
};

type DealRow = {
  id: string;
  title: string;
  amount: string;
  status: string;
  stage?: { name: string; color?: string | null } | null;
  primaryContact?: { firstName: string; lastName: string } | null;
};

type InstallationRow = {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  commune?: string | null;
  lat?: number | null;
  lng?: number | null;
  notes?: string | null;
};

type AccountDetail = {
  id: string;
  name: string;
  type: "prospect" | "client";
  status: string;
  rut?: string | null;
  industry?: string | null;
  segment?: string | null;
  size?: string | null;
  website?: string | null;
  address?: string | null;
  notes?: string | null;
  contacts: ContactRow[];
  deals: DealRow[];
  installations: InstallationRow[];
  _count: { contacts: number; deals: number; installations: number };
};

type Tab = "info" | "contacts" | "deals" | "installations";

export function CrmAccountDetailClient({ account: initialAccount }: { account: AccountDetail }) {
  const router = useRouter();
  const [account, setAccount] = useState(initialAccount);
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [editContact, setEditContact] = useState<ContactRow | null>(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", email: "", phone: "", roleTitle: "", isPrimary: false });
  const [savingContact, setSavingContact] = useState(false);

  const openContactEdit = (contact: ContactRow) => {
    setEditContact(contact);
    setEditForm({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email || "",
      phone: contact.phone || "",
      roleTitle: contact.roleTitle || "",
      isPrimary: contact.isPrimary || false,
    });
  };

  const saveContact = async () => {
    if (!editContact) return;
    setSavingContact(true);
    try {
      const res = await fetch("/api/crm/contacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editContact.id, ...editForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAccount((prev) => ({
        ...prev,
        contacts: prev.contacts.map((c) => (c.id === editContact.id ? { ...c, ...editForm } : c)),
      }));
      setEditContact(null);
      toast.success("Contacto actualizado");
    } catch {
      toast.error("No se pudo actualizar");
    } finally {
      setSavingContact(false);
    }
  };

  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState(false);
  const [deleteContactConfirm, setDeleteContactConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: "" });

  const deleteAccount = async () => {
    try {
      const res = await fetch(`/api/crm/accounts/${account.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Cuenta eliminada");
      router.push("/crm/accounts");
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const res = await fetch(`/api/crm/contacts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setAccount((prev) => ({
        ...prev,
        contacts: prev.contacts.filter((c) => c.id !== id),
        _count: { ...prev._count, contacts: prev._count.contacts - 1 },
      }));
      setDeleteContactConfirm({ open: false, id: "" });
      toast.success("Contacto eliminado");
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  const inputCn = "bg-background text-foreground placeholder:text-muted-foreground border-input focus-visible:ring-ring";

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "info", label: "Información" },
    { key: "installations", label: "Instalaciones", count: account._count.installations },
    { key: "contacts", label: "Contactos", count: account._count.contacts },
    { key: "deals", label: "Negocios", count: account._count.deals },
  ];

  return (
    <div className="space-y-4">
      {/* Tab pills */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors shrink-0 ${
              activeTab === tab.key
                ? "bg-primary/15 text-primary border border-primary/30"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground border border-transparent"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 text-[10px] opacity-70">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Info Tab ── */}
      {activeTab === "info" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4" />
                Datos generales
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteAccountConfirm(true)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Eliminar cuenta
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow label="Tipo">
                <Badge
                  variant="outline"
                  className={
                    account.type === "client"
                      ? "border-emerald-500/30 text-emerald-400"
                      : "border-amber-500/30 text-amber-400"
                  }
                >
                  {account.type === "client" ? "Cliente" : "Prospecto"}
                </Badge>
              </InfoRow>
              <InfoRow label="RUT">{account.rut || "—"}</InfoRow>
              <InfoRow label="Industria">{account.industry || "—"}</InfoRow>
              <InfoRow label="Segmento">{account.segment || "—"}</InfoRow>
              <InfoRow label="Tamaño">{account.size || "—"}</InfoRow>
              <InfoRow label="Estado">
                <Badge variant="outline">{account.status}</Badge>
              </InfoRow>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4" />
                Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {account.website && (
                <InfoRow label="Web">
                  <a
                    href={account.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate"
                  >
                    {account.website}
                  </a>
                </InfoRow>
              )}
              {account.address && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{account.address}</span>
                </div>
              )}
              {account.notes && (
                <div className="rounded-md border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                  {account.notes}
                </div>
              )}
              {!account.website && !account.address && !account.notes && (
                <p className="text-muted-foreground text-xs">Sin información adicional.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Contacts Tab ── */}
      {activeTab === "contacts" && (
        <Card>
          <CardHeader>
            <CardTitle>Contactos</CardTitle>
          </CardHeader>
          <CardContent>
            {account.contacts.length === 0 ? (
              <EmptyState
                icon={<Users className="h-8 w-8" />}
                title="Sin contactos"
                description="Esta cuenta no tiene contactos registrados."
                compact
              />
            ) : (
              <div className="space-y-3">
                {account.contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex flex-col gap-1 rounded-lg border p-3 cursor-pointer hover:bg-accent/30 transition-colors sm:flex-row sm:items-center sm:justify-between"
                    onClick={() => openContactEdit(contact)}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{`${contact.firstName} ${contact.lastName}`.trim()}</p>
                        {contact.isPrimary && (
                          <Badge variant="outline" className="text-[10px]">
                            Principal
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {contact.roleTitle || "Sin cargo"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {contact.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </span>
                        )}
                        {contact.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openContactEdit(contact)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteContactConfirm({ open: true, id: contact.id })}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contact Edit Modal */}
      <Dialog open={!!editContact} onOpenChange={(v) => !v && setEditContact(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar contacto</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nombre *</Label>
              <Input value={editForm.firstName} onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))} className={inputCn} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Apellido *</Label>
              <Input value={editForm.lastName} onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))} className={inputCn} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email *</Label>
              <Input value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} className={inputCn} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Teléfono</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} className={inputCn} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cargo</Label>
              <Input value={editForm.roleTitle} onChange={(e) => setEditForm((p) => ({ ...p, roleTitle: e.target.value }))} className={inputCn} />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editForm.isPrimary} onChange={(e) => setEditForm((p) => ({ ...p, isPrimary: e.target.checked }))} />
                Principal
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditContact(null)}>Cancelar</Button>
            <Button onClick={saveContact} disabled={savingContact}>
              {savingContact && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Installations Tab ── */}
      {activeTab === "installations" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              Instalaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CrmInstallationsClient
              accountId={account.id}
              initialInstallations={account.installations}
            />
          </CardContent>
        </Card>
      )}

      {/* ── Deals Tab ── */}
      {activeTab === "deals" && (
        <Card>
          <CardHeader>
            <CardTitle>Negocios</CardTitle>
          </CardHeader>
          <CardContent>
            {account.deals.length === 0 ? (
              <EmptyState
                icon={<TrendingUp className="h-8 w-8" />}
                title="Sin negocios"
                description="No hay negocios vinculados a esta cuenta."
                compact
              />
            ) : (
              <div className="space-y-3">
                {account.deals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/crm/deals/${deal.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent/30"
                  >
                    <div>
                      <p className="text-sm font-medium">{deal.title}</p>
                      <p className="text-xs text-muted-foreground">
                        ${Number(deal.amount).toLocaleString("es-CL")}
                        {deal.primaryContact ? ` · ${deal.primaryContact.firstName} ${deal.primaryContact.lastName}`.trim() : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{deal.stage?.name}</Badge>
                      {deal.status === "won" && (
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                          Ganado
                        </Badge>
                      )}
                      {deal.status === "lost" && (
                        <Badge className="bg-red-500/15 text-red-400 border-red-500/30">
                          Perdido
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={deleteAccountConfirm}
        onOpenChange={setDeleteAccountConfirm}
        title="Eliminar cuenta"
        description="Se eliminarán también contactos, negocios e instalaciones asociados. Esta acción no se puede deshacer."
        onConfirm={deleteAccount}
      />
      <ConfirmDialog
        open={deleteContactConfirm.open}
        onOpenChange={(v) => setDeleteContactConfirm({ ...deleteContactConfirm, open: v })}
        title="Eliminar contacto"
        description="El contacto será eliminado permanentemente. Esta acción no se puede deshacer."
        onConfirm={() => deleteContact(deleteContactConfirm.id)}
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
