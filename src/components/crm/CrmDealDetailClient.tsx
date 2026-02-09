/* eslint-disable @typescript-eslint/no-misused-promises */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, ExternalLink, Trash2, TrendingUp, FileText, Mail, Users, ChevronRight } from "lucide-react";
import { EmailHistoryList } from "@/components/crm/EmailHistoryList";
import { ContractEditor } from "@/components/docs/ContractEditor";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/opai/EmptyState";
import { toast } from "sonner";

/** Convierte Tiptap JSON a HTML para email */
function tiptapToEmailHtml(doc: any): string {
  if (!doc || !doc.content) return "";
  const renderNode = (node: any): string => {
    if (!node) return "";
    switch (node.type) {
      case "doc":
        return (node.content || []).map(renderNode).join("");
      case "paragraph": {
        const style = node.attrs?.textAlign ? `text-align:${node.attrs.textAlign};` : "";
        const inner = (node.content || []).map(renderNode).join("");
        return inner ? `<p style="margin:0 0 8px;${style}">${inner}</p>` : `<p style="margin:0 0 8px;">&nbsp;</p>`;
      }
      case "heading": {
        const lvl = node.attrs?.level || 2;
        const inner = (node.content || []).map(renderNode).join("");
        return `<h${lvl} style="margin:0 0 8px;">${inner}</h${lvl}>`;
      }
      case "bulletList":
        return `<ul style="margin:0 0 8px;padding-left:24px;">${(node.content || []).map(renderNode).join("")}</ul>`;
      case "orderedList":
        return `<ol style="margin:0 0 8px;padding-left:24px;">${(node.content || []).map(renderNode).join("")}</ol>`;
      case "listItem":
        return `<li style="margin:0 0 4px;">${(node.content || []).map(renderNode).join("")}</li>`;
      case "text": {
        let text = (node.text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        for (const mark of node.marks || []) {
          switch (mark.type) {
            case "bold": text = `<strong>${text}</strong>`; break;
            case "italic": text = `<em>${text}</em>`; break;
            case "underline": text = `<u>${text}</u>`; break;
            case "strike": text = `<s>${text}</s>`; break;
            case "link": text = `<a href="${mark.attrs?.href || "#"}" style="color:#0059A3;text-decoration:underline;">${text}</a>`; break;
            case "textStyle": if (mark.attrs?.color) text = `<span style="color:${mark.attrs.color}">${text}</span>`; break;
          }
        }
        return text;
      }
      case "hardBreak": return "<br/>";
      case "horizontalRule": return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0;"/>`;
      case "blockquote": return `<blockquote style="border-left:3px solid #e5e7eb;padding-left:12px;margin:8px 0;color:#666;">${(node.content || []).map(renderNode).join("")}</blockquote>`;
      case "contractToken": return `{{${node.attrs?.tokenKey || ""}}}`;
      default: return (node.content || []).map(renderNode).join("");
    }
  };
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#333;line-height:1.6;">${renderNode(doc)}</div>`;
}

type QuoteOption = {
  id: string;
  code: string;
  clientName?: string | null;
  status: string;
};

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  scope: string;
  stageId?: string | null;
};

type DealQuote = {
  id: string;
  quoteId: string;
};

type ContactRow = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  roleTitle?: string | null;
  isPrimary?: boolean;
};

export type DealDetail = {
  id: string;
  title: string;
  amount: string;
  stage?: { name: string } | null;
  account?: { id: string; name: string } | null;
  primaryContactId?: string | null;
  primaryContact?: { firstName: string; lastName: string; email?: string | null } | null;
  quotes?: DealQuote[];
  proposalLink?: string | null;
};

type Tab = "info" | "quotes" | "emails" | "contacts";

export function CrmDealDetailClient({
  deal,
  quotes,
  contacts,
  gmailConnected,
  templates,
}: {
  deal: DealDetail;
  quotes: QuoteOption[];
  contacts: ContactRow[];
  gmailConnected: boolean;
  templates: EmailTemplate[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("info");
  const [open, setOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState("");
  const [linkedQuotes, setLinkedQuotes] = useState<DealQuote[]>(deal.quotes || []);
  const [linking, setLinking] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [emailTo, setEmailTo] = useState(deal.primaryContact?.email || "");
  const [emailCc, setEmailCc] = useState("");
  const [emailBcc, setEmailBcc] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [emailSubject, setEmailSubject] = useState(
    `Propuesta para ${deal.account?.name || "cliente"}`
  );
  const [emailBody, setEmailBody] = useState("");
  const [emailTiptapContent, setEmailTiptapContent] = useState<any>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [signatureHtml, setSignatureHtml] = useState<string | null>(null);

  // Cargar firma
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

  const router = useRouter();

  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const deleteDeal = async () => {
    try {
      const res = await fetch(`/api/crm/deals/${deal.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Negocio eliminado");
      router.push("/crm/deals");
    } catch {
      toast.error("No se pudo eliminar");
    }
  };

  const selectClassName =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
  const inputClassName =
    "bg-background text-foreground placeholder:text-muted-foreground border-input focus-visible:ring-ring";

  const applyPlaceholders = (value: string) => {
    const replacements: Record<string, string> = {
      "{cliente}": deal.account?.name || "",
      "{contacto}": deal.primaryContact ? `${deal.primaryContact.firstName} ${deal.primaryContact.lastName}`.trim() : "",
      "{negocio}": deal.title || "",
      "{etapa}": deal.stage?.name || "",
      "{monto}": deal.amount ? Number(deal.amount).toLocaleString("es-CL") : "",
      "{correo}": deal.primaryContact?.email || "",
    };
    return Object.entries(replacements).reduce(
      (acc, [key, replaceValue]) => acc.split(key).join(replaceValue),
      value
    );
  };

  const selectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;
    setEmailSubject(applyPlaceholders(template.subject));
    setEmailBody(applyPlaceholders(template.body));
  };

  const quotesById = useMemo(() => {
    return quotes.reduce<Record<string, QuoteOption>>((acc, quote) => {
      acc[quote.id] = quote;
      return acc;
    }, {});
  }, [quotes]);

  const linkQuote = async () => {
    if (!selectedQuoteId) {
      toast.error("Selecciona una cotización.");
      return;
    }
    setLinking(true);
    try {
      const response = await fetch(`/api/crm/deals/${deal.id}/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: selectedQuoteId }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Error vinculando cotización");
      }
      setLinkedQuotes((prev) => [...prev, payload.data]);
      setSelectedQuoteId("");
      setOpen(false);
      toast.success("Cotización vinculada exitosamente");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo vincular la cotización.");
    } finally {
      setLinking(false);
    }
  };

  const handleTiptapChange = useCallback((content: any) => {
    setEmailTiptapContent(content);
    // Convertir Tiptap JSON a HTML
    setEmailBody(tiptapToEmailHtml(content));
  }, []);

  const sendEmail = async () => {
    if (!gmailConnected) {
      toast.error("Conecta Gmail antes de enviar.");
      return;
    }
    if (!emailTo || !emailSubject) {
      toast.error("Completa destinatario y asunto.");
      return;
    }
    setSending(true);
    try {
      const cc = emailCc.split(",").map((s) => s.trim()).filter(Boolean);
      const bcc = emailBcc.split(",").map((s) => s.trim()).filter(Boolean);
      const response = await fetch("/api/crm/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emailTo,
          cc,
          bcc,
          subject: emailSubject,
          html: emailBody,
          dealId: deal.id,
          accountId: deal.account?.id,
          contactId: deal.primaryContactId,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Error enviando email");
      }
      setEmailOpen(false);
      setEmailBody("");
      setEmailTiptapContent(null);
      setEmailCc("");
      setEmailBcc("");
      setShowCcBcc(false);
      toast.success("Correo enviado exitosamente");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo enviar el correo.");
    } finally {
      setSending(false);
    }
  };

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "info", label: "Resumen" },
    { key: "quotes", label: "Cotizaciones", count: linkedQuotes.length },
    { key: "emails", label: "Correos" },
    { key: "contacts", label: "Contactos", count: contacts.length },
  ];

  return (
    <div className="space-y-4">
      {/* ── Detail toolbar: Back + Actions ── */}
      <div className="flex items-center justify-between">
        <Link
          href="/crm/deals"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a negocios
        </Link>
        <div className="flex items-center gap-2">
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4" />
              Resumen del negocio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow label="Cliente">
              {deal.account ? (
                <Link
                  href={`/crm/accounts/${deal.account.id}`}
                  className="flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  {deal.account.name}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              ) : (
                <span className="font-medium">Sin cliente</span>
              )}
            </InfoRow>
            <InfoRow label="Etapa">
              <Badge variant="outline">{deal.stage?.name}</Badge>
            </InfoRow>
            <InfoRow label="Monto">
              <span className="font-medium">
                ${Number(deal.amount).toLocaleString("es-CL")}
              </span>
            </InfoRow>
            <InfoRow label="Contacto">
              {deal.primaryContact && deal.primaryContactId ? (
                <Link
                  href={`/crm/contacts/${deal.primaryContactId}`}
                  className="flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  {`${deal.primaryContact.firstName} ${deal.primaryContact.lastName}`.trim()}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              ) : (
                <span className="font-medium">Sin contacto</span>
              )}
            </InfoRow>
            <InfoRow label="Link propuesta">
              {deal.proposalLink ? (
                <a
                  href={deal.proposalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  Ver propuesta
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              ) : (
                <span className="text-muted-foreground">Sin link</span>
              )}
            </InfoRow>
          </CardContent>
        </Card>
      )}

      {/* ── Quotes Tab ── */}
      {activeTab === "quotes" && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Cotizaciones vinculadas</CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary">
                  Vincular
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Vincular cotización</DialogTitle>
                  <DialogDescription>
                    Selecciona una cotización desde CPQ.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label>Cotización</Label>
                  <select
                    className={selectClassName}
                    value={selectedQuoteId}
                    onChange={(event) => setSelectedQuoteId(event.target.value)}
                    disabled={linking}
                  >
                    <option value="">Selecciona cotización</option>
                    {quotes.map((quote) => (
                      <option key={quote.id} value={quote.id}>
                        {quote.code} · {quote.clientName || "Sin cliente"}
                      </option>
                    ))}
                  </select>
                </div>
                <DialogFooter>
                  <Button onClick={linkQuote} disabled={linking}>
                    {linking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar vínculo
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {linkedQuotes.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-8 w-8" />}
                title="Sin cotizaciones"
                description="No hay cotizaciones vinculadas a este negocio."
                compact
              />
            ) : (
              <div className="space-y-2">
                {linkedQuotes.map((quote) => {
                  const info = quotesById[quote.quoteId];
                  return (
                    <Link
                      key={quote.id}
                      href={`/crm/cotizaciones/${quote.quoteId}`}
                      className="flex items-center justify-between rounded-lg border p-3 sm:p-4 transition-colors hover:bg-accent/30 group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{info?.code || "CPQ"}</p>
                          <Badge
                            variant="outline"
                            className={
                              info?.status === "approved"
                                ? "border-emerald-500/30 text-emerald-400"
                                : info?.status === "sent"
                                ? "border-blue-500/30 text-blue-400"
                                : info?.status === "rejected"
                                ? "border-red-500/30 text-red-400"
                                : ""
                            }
                          >
                            {info?.status === "draft"
                              ? "Borrador"
                              : info?.status === "sent"
                              ? "Enviada"
                              : info?.status === "approved"
                              ? "Aprobada"
                              : info?.status === "rejected"
                              ? "Rechazada"
                              : info?.status || "Borrador"}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {info?.clientName || "Sin cliente"}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 shrink-0 hidden sm:block" />
                    </Link>
                  );
                })}
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
              Correos
            </CardTitle>
            {gmailConnected ? (
              <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="secondary">
                    Enviar correo
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Enviar correo</DialogTitle>
                    <DialogDescription>
                      Se enviará desde tu cuenta Gmail conectada. Tu firma se adjuntará automáticamente.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    {/* Template */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">Template</Label>
                      <select
                        className={selectClassName}
                        value={selectedTemplateId}
                        onChange={(event) => selectTemplate(event.target.value)}
                        disabled={sending}
                      >
                        <option value="">Sin template</option>
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Para + CC/BCC */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Para</Label>
                        {!showCcBcc && (
                          <button
                            type="button"
                            onClick={() => setShowCcBcc(true)}
                            className="text-[11px] text-primary hover:underline"
                          >
                            CC / BCC
                          </button>
                        )}
                      </div>
                      <input
                        value={emailTo}
                        onChange={(event) => setEmailTo(event.target.value)}
                        className={`h-9 w-full rounded-md border px-3 text-sm ${inputClassName}`}
                        placeholder="correo@cliente.com"
                        disabled={sending}
                      />
                    </div>

                    {showCcBcc && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs">CC (separados por coma)</Label>
                          <input
                            value={emailCc}
                            onChange={(e) => setEmailCc(e.target.value)}
                            className={`h-9 w-full rounded-md border px-3 text-sm ${inputClassName}`}
                            placeholder="copia@empresa.com"
                            disabled={sending}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">BCC (copia oculta)</Label>
                          <input
                            value={emailBcc}
                            onChange={(e) => setEmailBcc(e.target.value)}
                            className={`h-9 w-full rounded-md border px-3 text-sm ${inputClassName}`}
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
                        onChange={(event) => setEmailSubject(event.target.value)}
                        className={`h-9 w-full rounded-md border px-3 text-sm ${inputClassName}`}
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
                    <Button variant="outline" onClick={() => setEmailOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={sendEmail} disabled={sending}>
                      {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Enviar correo
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : (
              <Button asChild size="sm" variant="secondary">
                <a href="/opai/configuracion/integraciones">Ir a Integraciones</a>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <EmailHistoryList dealId={deal.id} compact />
          </CardContent>
        </Card>
      )}

      {/* ── Contacts Tab ── */}
      {activeTab === "contacts" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              Contactos del cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contacts.length === 0 ? (
              <EmptyState
                icon={<Users className="h-8 w-8" />}
                title="Sin contactos"
                description="Este cliente no tiene contactos registrados."
                compact
              />
            ) : (
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <Link
                    key={contact.id}
                    href={`/crm/contacts/${contact.id}`}
                    className="flex flex-col gap-2 rounded-lg border p-3 sm:p-4 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-accent/30 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm group-hover:text-primary transition-colors">{`${contact.firstName} ${contact.lastName}`.trim()}</p>
                        {contact.isPrimary && (
                          <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                            Principal
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {contact.roleTitle || "Sin cargo"} · {contact.email || "Sin email"} · {contact.phone || "Sin teléfono"}
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

      <ConfirmDialog
        open={deleteConfirm}
        onOpenChange={setDeleteConfirm}
        title="Eliminar negocio"
        description="Se eliminarán las cotizaciones vinculadas y el historial. Esta acción no se puede deshacer."
        onConfirm={deleteDeal}
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

