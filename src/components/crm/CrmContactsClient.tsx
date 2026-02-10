/* eslint-disable @typescript-eslint/no-misused-promises */
"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, Pencil, Loader2, Trash2, Search, Users, ChevronRight } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/opai/EmptyState";
import { CrmDates } from "@/components/crm/CrmDates";
import { toast } from "sonner";
import Link from "next/link";

type ContactRow = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  roleTitle?: string | null;
  isPrimary?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  account?: {
    id: string;
    name: string;
  } | null;
};

type AccountRow = {
  id: string;
  name: string;
};

type ContactFormState = {
  accountId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roleTitle: string;
  isPrimary: boolean;
};

const DEFAULT_FORM: ContactFormState = {
  accountId: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  roleTitle: "",
  isPrimary: false,
};

export function CrmContactsClient({
  initialContacts,
  accounts,
}: {
  initialContacts: ContactRow[];
  accounts: AccountRow[];
}) {
  const [contacts, setContacts] = useState<ContactRow[]>(initialContacts);
  const [form, setForm] = useState<ContactFormState>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState<string>("all");

  const inputClassName =
    "bg-background text-foreground placeholder:text-muted-foreground border-input focus-visible:ring-ring";
  const selectClassName =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (accountFilter !== "all" && c.account?.id !== accountFilter) return false;
      if (q) {
        const searchable = `${c.firstName} ${c.lastName} ${c.email || ""} ${c.phone || ""} ${c.account?.name || ""}`.toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [contacts, search, accountFilter]);

  // Get accounts that actually have contacts for filter pills
  const accountsWithContacts = useMemo(() => {
    const accountIds = new Set(contacts.map((c) => c.account?.id).filter(Boolean));
    return accounts.filter((a) => accountIds.has(a.id));
  }, [contacts, accounts]);

  const updateForm = (key: keyof ContactFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const createContact = async () => {
    if (!form.accountId) {
      toast.error("Selecciona un cliente.");
      return;
    }
    if (!form.firstName.trim()) {
      toast.error("El nombre es obligatorio.");
      return;
    }
    if (!form.lastName.trim()) {
      toast.error("El apellido es obligatorio.");
      return;
    }
    if (!form.email.trim()) {
      toast.error("El email es obligatorio.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/crm/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Error creando contacto");
      }
      setContacts((prev) => [payload.data, ...prev]);
      setForm(DEFAULT_FORM);
      setOpen(false);
      toast.success("Contacto creado");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo crear el contacto.");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (contact: ContactRow) => {
    setEditingId(contact.id);
    setForm({
      accountId: contact.account?.id || "",
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email || "",
      phone: contact.phone || "",
      roleTitle: contact.roleTitle || "",
      isPrimary: contact.isPrimary || false,
    });
    setEditOpen(true);
  };

  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string }>({ open: false, id: "" });

  const deleteContact = async (id: string) => {
    try {
      const response = await fetch(`/api/crm/contacts/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      setContacts((prev) => prev.filter((c) => c.id !== id));
      setDeleteConfirm({ open: false, id: "" });
      setEditOpen(false);
      setEditingId(null);
      toast.success("Contacto eliminado");
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/crm/contacts/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || null,
          roleTitle: form.roleTitle || null,
          isPrimary: form.isPrimary,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Error actualizando contacto");
      }
      setContacts((prev) =>
        prev.map((c) => (c.id === editingId ? payload.data : c))
      );
      setEditOpen(false);
      setEditingId(null);
      setForm(DEFAULT_FORM);
      toast.success("Contacto actualizado");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo actualizar el contacto.");
    } finally {
      setLoading(false);
    }
  };

  const contactName = (c: ContactRow) =>
    [c.firstName, c.lastName].filter(Boolean).join(" ") || "Sin nombre";

  return (
    <div className="space-y-4">
      {/* ── Search + Filters + Create ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o teléfono..."
            className="pl-9 h-9 bg-background text-foreground border-input"
          />
        </div>
        <div className="flex items-center gap-2">
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
              Todos ({contacts.length})
            </button>
            {accountsWithContacts.slice(0, 5).map((acc) => {
              const count = contacts.filter((c) => c.account?.id === acc.id).length;
              return (
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
                  {acc.name} ({count})
                </button>
              );
            })}
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="secondary" className="h-9 w-9 shrink-0">
                <Plus className="h-4 w-4" />
                <span className="sr-only">Nuevo contacto</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Nuevo contacto</DialogTitle>
                <DialogDescription>
                  Asócialo a un cliente existente.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Cliente *</Label>
                  <select
                    className={selectClassName}
                    value={form.accountId}
                    onChange={(event) => updateForm("accountId", event.target.value)}
                  >
                    <option value="">Selecciona un cliente</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    value={form.firstName}
                    onChange={(event) => updateForm("firstName", event.target.value)}
                    placeholder="Nombre"
                    className={inputClassName}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Apellido *</Label>
                  <Input
                    value={form.lastName}
                    onChange={(event) => updateForm("lastName", event.target.value)}
                    placeholder="Apellido"
                    className={inputClassName}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
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
                <div className="space-y-2">
                  <Label>Cargo</Label>
                  <Input
                    value={form.roleTitle}
                    onChange={(event) => updateForm("roleTitle", event.target.value)}
                    placeholder="Gerente, jefe, etc."
                    className={inputClassName}
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.isPrimary}
                      onChange={(event) => updateForm("isPrimary", event.target.checked)}
                    />
                    Contacto principal
                  </label>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={createContact} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar contacto
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar contacto</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={form.firstName}
                onChange={(e) => updateForm("firstName", e.target.value)}
                className={inputClassName}
              />
            </div>
            <div className="space-y-2">
              <Label>Apellido *</Label>
              <Input
                value={form.lastName}
                onChange={(e) => updateForm("lastName", e.target.value)}
                className={inputClassName}
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
                className={inputClassName}
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={form.phone}
                onChange={(e) => updateForm("phone", e.target.value)}
                className={inputClassName}
              />
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input
                value={form.roleTitle}
                onChange={(e) => updateForm("roleTitle", e.target.value)}
                className={inputClassName}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isPrimary}
                  onChange={(e) => updateForm("isPrimary", e.target.checked)}
                />
                Contacto principal
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={saveEdit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Contact list ── */}
      <Card>
        <CardContent className="pt-5">
          {filteredContacts.length === 0 ? (
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title="Sin contactos"
              description={
                search || accountFilter !== "all"
                  ? "No hay contactos para los filtros seleccionados."
                  : "No hay contactos registrados todavía."
              }
              compact
            />
          ) : (
            <div className="space-y-2">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex flex-col gap-2 rounded-lg border p-3 sm:p-4 transition-colors hover:bg-accent/30 sm:flex-row sm:items-center sm:justify-between group"
                >
                  <Link
                    href={`/crm/contacts/${contact.id}`}
                    className="flex-1 min-w-0"
                  >
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm hover:text-primary transition-colors">{contactName(contact)}</p>
                      {contact.isPrimary && (
                        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                          Principal
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {contact.email || "Sin email"} · {contact.phone || "Sin teléfono"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {contact.account?.name || "Sin cliente asociado"}
                      {contact.roleTitle ? ` · ${contact.roleTitle}` : ""}
                    </p>
                    {contact.createdAt && (
                      <CrmDates
                        createdAt={contact.createdAt}
                        updatedAt={contact.updatedAt}
                        className="mt-0.5"
                      />
                    )}
                  </Link>
                  <Link href={`/crm/contacts/${contact.id}`} className="shrink-0">
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(v) => setDeleteConfirm({ ...deleteConfirm, open: v })}
        title="Eliminar contacto"
        description="El contacto será eliminado permanentemente. Esta acción no se puede deshacer."
        onConfirm={() => deleteContact(deleteConfirm.id)}
      />
    </div>
  );
}
