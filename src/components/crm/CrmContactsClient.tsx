/* eslint-disable @typescript-eslint/no-misused-promises */
"use client";

import { useState } from "react";
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
import { Plus, Pencil, Loader2, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

type ContactRow = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  roleTitle?: string | null;
  isPrimary?: boolean;
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

  const inputClassName =
    "bg-background text-foreground placeholder:text-muted-foreground border-input focus-visible:ring-ring";
  const selectClassName =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Contactos principales por cliente.
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="secondary" className="h-9 w-9">
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

      <Card>
        <CardHeader>
          <CardTitle>Contactos</CardTitle>
          <CardDescription>Listado por cliente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {contacts.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Todavía no hay contactos registrados.
            </p>
          )}
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="flex flex-col gap-2 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-medium">{contactName(contact)}</p>
                <p className="text-sm text-muted-foreground">
                  {contact.email || "Sin email"} · {contact.phone || "Sin teléfono"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {contact.account?.name || "Sin cliente asociado"}
                  {contact.roleTitle ? ` · ${contact.roleTitle}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {contact.isPrimary && <Badge variant="outline">Principal</Badge>}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => openEditModal(contact)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteConfirm({ open: true, id: contact.id })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
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
