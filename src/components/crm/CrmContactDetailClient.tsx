"use client";

import { useCallback, useEffect, useState } from "react";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/opai/EmptyState";
import {
  ArrowLeft,
  Users,
  Building2,
  TrendingUp,
  Mail,
  Phone,
  Briefcase,
  Pencil,
  Trash2,
  Loader2,
  ChevronRight,
  Send,
  MessageSquare,
} from "lucide-react";
import { EmailHistoryList } from "@/components/crm/EmailHistoryList";
import { ContractEditor } from "@/components/docs/ContractEditor";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/** Convierte Tiptap JSON a HTML para email */
function tiptapToEmailHtml(doc: any): string {
  if (!doc || !doc.content) return "";
  const renderNode = (node: any): string => {
    if (!node) return "";
    switch (node.type) {
      case "doc": return (node.content || []).map(renderNode).join("");
      case "paragraph": {
        const inner = (node.content || []).map(renderNode).join("");
        return inner ? `<p style="margin:0 0 8px;">${inner}</p>` : `<p style="margin:0 0 8px;">&nbsp;</p>`;
      }
      case "heading": { const lvl = node.attrs?.level || 2; return `<h${lvl} style="margin:0 0 8px;">${(node.content || []).map(renderNode).join("")}</h${lvl}>`; }
      case "bulletList": return `<ul style="margin:0 0 8px;padding-left:24px;">${(node.content || []).map(renderNode).join("")}</ul>`;
      case "orderedList": return `<ol style="margin:0 0 8px;padding-left:24px;">${(node.content || []).map(renderNode).join("")}</ol>`;
      case "listItem": return `<li style="margin:0 0 4px;">${(node.content || []).map(renderNode).join("")}</li>`;
      case "text": {
        let text = (node.text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        for (const mark of node.marks || []) {
          switch (mark.type) {
            case "bold": text = `<strong>${text}</strong>`; break;
            case "italic": text = `<em>${text}</em>`; break;
            case "underline": text = `<u>${text}</u>`; break;
            case "link": text = `<a href="${mark.attrs?.href || "#"}" style="color:#0059A3;">${text}</a>`; break;
          }
        }
        return text;
      }
      case "hardBreak": return "<br/>";
      default: return (node.content || []).map(renderNode).join("");
    }
  };
  return `<div style="font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.6;">${renderNode(doc)}</div>`;
}

type DealRow = {
  id: string;
  title: string;
  amount: string;
  status: string;
  stage?: { name: string } | null;
};

type ContactDetail = {
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
    type?: string;
    industry?: string | null;
  } | null;
};

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  scope: string;
};

type Tab = "info" | "deals" | "emails";

export function CrmContactDetailClient({
  contact: initialContact,
  deals,
  gmailConnected = false,
  templates = [],
}: {
  contact: ContactDetail;
  deals: DealRow[];
  gmailConnected?: boolean;
  templates?: EmailTemplate[];
}) {
  const router = useRouter();
  const [contact, setContact] = useState(initialContact);
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email || "",
    phone: contact.phone || "",
    roleTitle: contact.roleTitle || "",
    isPrimary: contact.isPrimary || false,
  });

  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Email compose state
  const [emailOpen, setEmailOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailTiptapContent, setEmailTiptapContent] = useState<any>(null);
  const [emailCc, setEmailCc] = useState("");
  const [emailBcc, setEmailBcc] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [signatureHtml, setSignatureHtml] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/crm/signatures?mine=true")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.length > 0) {
          const sig = data.data.find((s: any) => s.isDefault) || data.data[0];
          if (sig?.htmlContent) setSignatureHtml(sig.htmlContent);
        }
      })
      .catch(() => {});
  }, []);

  const applyPlaceholders = (value: string) => {
    const replacements: Record<string, string> = {
      "{cliente}": contact.account?.name || "",
      "{contacto}": fullName,
      "{correo}": contact.email || "",
    };
    return Object.entries(replacements).reduce(
      (acc, [key, val]) => acc.split(key).join(val),
      value
    );
  };

  const selectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    setEmailSubject(applyPlaceholders(tpl.subject));
    setEmailBody(applyPlaceholders(tpl.body));
  };

  const handleTiptapChange = useCallback((content: any) => {
    setEmailTiptapContent(content);
    setEmailBody(tiptapToEmailHtml(content));
  }, []);

  const sendEmail = async () => {
    if (!contact.email) { toast.error("El contacto no tiene email."); return; }
    if (!emailSubject) { toast.error("Escribe un asunto."); return; }
    setSending(true);
    try {
      const cc = emailCc.split(",").map((s) => s.trim()).filter(Boolean);
      const bcc = emailBcc.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await fetch("/api/crm/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: contact.email,
          cc,
          bcc,
          subject: emailSubject,
          html: emailBody,
          contactId: contact.id,
          accountId: contact.account?.id || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error enviando email");
      setEmailOpen(false);
      setEmailBody("");
      setEmailTiptapContent(null);
      setEmailSubject("");
      setEmailCc("");
      setEmailBcc("");
      setShowCcBcc(false);
      setSelectedTemplateId("");
      toast.success("Correo enviado exitosamente");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo enviar el correo.");
    } finally {
      setSending(false);
    }
  };

  const inputCn = "bg-background text-foreground placeholder:text-muted-foreground border-input focus-visible:ring-ring";
  const selectCn = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  const deleteContact = async () => {
    try {
      const res = await fetch(`/api/crm/contacts/${contact.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Contacto eliminado");
      router.push("/crm/contacts");
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/crm/contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          email: editForm.email,
          phone: editForm.phone || null,
          roleTitle: editForm.roleTitle || null,
          isPrimary: editForm.isPrimary,
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error);
      setContact((prev) => ({ ...prev, ...editForm }));
      setEditOpen(false);
      toast.success("Contacto actualizado");
    } catch {
      toast.error("No se pudo actualizar");
    } finally {
      setSaving(false);
    }
  };

  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ");

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "info", label: "Información" },
    { key: "deals", label: "Negocios", count: deals.length },
    { key: "emails", label: "Correos" },
  ];

  return (
    <div className="space-y-4">
      {/* ── Detail toolbar: Back + Actions ── */}
      <div className="flex items-center justify-between">
        <Link
          href="/crm/contacts"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a contactos
        </Link>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setEditForm({
                firstName: contact.firstName,
                lastName: contact.lastName,
                email: contact.email || "",
                phone: contact.phone || "",
                roleTitle: contact.roleTitle || "",
                isPrimary: contact.isPrimary || false,
              });
              setEditOpen(true);
            }}
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Editar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteConfirm(true)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* ── Tab pills ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                Datos del contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow label="Nombre completo">
                <span className="font-medium">{fullName}</span>
              </InfoRow>
              <InfoRow label="Email">
                {contact.email ? (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-primary hover:underline">
                    <Mail className="h-3 w-3" />
                    {contact.email}
                  </a>
                ) : (
                  <span className="text-muted-foreground">Sin email</span>
                )}
              </InfoRow>
              <InfoRow label="Teléfono">
                {contact.phone ? (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-primary hover:underline">
                    <Phone className="h-3 w-3" />
                    {contact.phone}
                  </a>
                ) : (
                  <span className="text-muted-foreground">Sin teléfono</span>
                )}
              </InfoRow>
              <InfoRow label="Cargo">
                {contact.roleTitle ? (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {contact.roleTitle}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Sin cargo</span>
                )}
              </InfoRow>
              <InfoRow label="Tipo">
                {contact.isPrimary ? (
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                    Principal
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">Secundario</span>
                )}
              </InfoRow>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4" />
                Cuenta
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contact.account ? (
                <Link
                  href={`/crm/accounts/${contact.account.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 sm:p-4 transition-colors hover:bg-accent/30 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <p className="font-medium text-sm">{contact.account.name}</p>
                      {contact.account.type && (
                        <Badge
                          variant="outline"
                          className={
                            contact.account.type === "client"
                              ? "border-emerald-500/30 text-emerald-400"
                              : "border-amber-500/30 text-amber-400"
                          }
                        >
                          {contact.account.type === "client" ? "Cliente" : "Prospecto"}
                        </Badge>
                      )}
                    </div>
                    {contact.account.industry && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{contact.account.industry}</p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 shrink-0" />
                </Link>
              ) : (
                <EmptyState
                  icon={<Building2 className="h-8 w-8" />}
                  title="Sin cuenta"
                  description="Este contacto no está asociado a una cuenta."
                  compact
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Deals Tab ── */}
      {activeTab === "deals" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4" />
              Negocios de la cuenta
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deals.length === 0 ? (
              <EmptyState
                icon={<TrendingUp className="h-8 w-8" />}
                title="Sin negocios"
                description="No hay negocios vinculados a la cuenta de este contacto."
                compact
              />
            ) : (
              <div className="space-y-2">
                {deals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/crm/deals/${deal.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 sm:p-4 transition-colors hover:bg-accent/30 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{deal.title}</p>
                        <Badge variant="outline">{deal.stage?.name}</Badge>
                        {deal.status === "won" && (
                          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                            Ganado
                          </Badge>
                        )}
                        {deal.status === "lost" && (
                          <Badge variant="outline" className="border-red-500/30 text-red-400">
                            Perdido
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        ${Number(deal.amount).toLocaleString("es-CL")}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 shrink-0 hidden sm:block" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Emails Tab ── */}
      {activeTab === "emails" && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4" />
              Correos enviados
            </CardTitle>
            <div className="flex items-center gap-2">
              {contact.phone && (
                <a
                  href={`https://wa.me/${contact.phone.replace(/\s/g, "").replace(/^\+/, "")}?text=${encodeURIComponent(`Hola ${contact.firstName}, `)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                >
                  <MessageSquare className="h-3 w-3" />
                  WhatsApp
                </a>
              )}
              {gmailConnected && contact.email ? (
                <Button size="sm" variant="secondary" onClick={() => setEmailOpen(true)}>
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Enviar correo
                </Button>
              ) : !gmailConnected ? (
                <Button asChild size="sm" variant="secondary">
                  <Link href="/opai/configuracion/integraciones">Conectar Gmail</Link>
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            <EmailHistoryList contactId={contact.id} compact />
          </CardContent>
        </Card>
      )}

      {/* ── Email Compose Modal ── */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enviar correo a {contact.firstName}</DialogTitle>
            <DialogDescription>
              Se enviará desde tu cuenta Gmail conectada. Tu firma se adjuntará automáticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {/* Template */}
            <div className="space-y-1.5">
              <Label className="text-xs">Template</Label>
              <select
                className={selectCn}
                value={selectedTemplateId}
                onChange={(e) => selectTemplate(e.target.value)}
                disabled={sending}
              >
                <option value="">Sin template</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Para + CC/BCC toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Para</Label>
                {!showCcBcc && (
                  <button type="button" onClick={() => setShowCcBcc(true)} className="text-[11px] text-primary hover:underline">
                    CC / BCC
                  </button>
                )}
              </div>
              <input
                value={contact.email || ""}
                disabled
                className={`h-9 w-full rounded-md border px-3 text-sm ${inputCn} opacity-70`}
              />
            </div>

            {showCcBcc && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">CC (separados por coma)</Label>
                  <input
                    value={emailCc}
                    onChange={(e) => setEmailCc(e.target.value)}
                    className={`h-9 w-full rounded-md border px-3 text-sm ${inputCn}`}
                    placeholder="copia@empresa.com"
                    disabled={sending}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">BCC (copia oculta)</Label>
                  <input
                    value={emailBcc}
                    onChange={(e) => setEmailBcc(e.target.value)}
                    className={`h-9 w-full rounded-md border px-3 text-sm ${inputCn}`}
                    placeholder="oculto@empresa.com"
                    disabled={sending}
                  />
                </div>
              </div>
            )}

            {/* Asunto */}
            <div className="space-y-1.5">
              <Label className="text-xs">Asunto</Label>
              <input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className={`h-9 w-full rounded-md border px-3 text-sm ${inputCn}`}
                placeholder="Asunto del correo"
                disabled={sending}
              />
            </div>

            {/* Editor Tiptap */}
            <div className="space-y-1.5">
              <Label className="text-xs">Mensaje</Label>
              <ContractEditor
                content={emailTiptapContent}
                onChange={handleTiptapChange}
                editable={!sending}
                placeholder="Escribe tu mensaje aquí..."
                filterModules={["system"]}
              />
            </div>

            {/* Firma preview */}
            {signatureHtml && (
              <div className="rounded-md border border-border/50 bg-muted/20 p-3">
                <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider font-medium">
                  Firma (se agrega automáticamente)
                </p>
                <div className="text-xs opacity-70" dangerouslySetInnerHTML={{ __html: signatureHtml }} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailOpen(false)}>Cancelar</Button>
            <Button onClick={sendEmail} disabled={sending}>
              {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar correo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Modal ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
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
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirm}
        onOpenChange={setDeleteConfirm}
        title="Eliminar contacto"
        description="El contacto será eliminado permanentemente. Esta acción no se puede deshacer."
        onConfirm={deleteContact}
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
