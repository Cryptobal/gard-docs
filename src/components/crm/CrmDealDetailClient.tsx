/* eslint-disable @typescript-eslint/no-misused-promises */
"use client";

import { useMemo, useState } from "react";
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
import { Loader2, ExternalLink, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

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

type DealDetail = {
  id: string;
  title: string;
  amount: string;
  stage?: { name: string } | null;
  account?: { id: string; name: string } | null;
  primaryContact?: { firstName: string; lastName: string; email?: string | null } | null;
  quotes?: DealQuote[];
  proposalLink?: string | null;
};

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
  const [open, setOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState("");
  const [linkedQuotes, setLinkedQuotes] = useState<DealQuote[]>(deal.quotes || []);
  const [linking, setLinking] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [emailTo, setEmailTo] = useState(deal.primaryContact?.email || "");
  const [emailSubject, setEmailSubject] = useState(
    `Propuesta para ${deal.account?.name || "cliente"}`
  );
  const [emailBody, setEmailBody] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

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
      const response = await fetch("/api/crm/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emailTo,
          subject: emailSubject,
          html: emailBody,
          dealId: deal.id,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Error enviando email");
      }
      setEmailOpen(false);
      setEmailBody("");
      toast.success("Correo enviado exitosamente");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo enviar el correo.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Resumen</CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteConfirm(true)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Eliminar negocio
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span>Cliente</span>
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
          </div>
          <div className="flex items-center justify-between">
            <span>Etapa</span>
            <Badge variant="outline">{deal.stage?.name}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Monto</span>
            <span className="font-medium">
              ${Number(deal.amount).toLocaleString("es-CL")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Contacto</span>
            <span className="font-medium">
              {deal.primaryContact ? `${deal.primaryContact.firstName} ${deal.primaryContact.lastName}`.trim() : "Sin contacto"}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t">
            <span>Link propuesta</span>
            {deal.proposalLink ? (
              <a
                href={deal.proposalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-medium text-primary hover:underline break-all max-w-[70%] text-right"
              >
                Ver propuesta
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            ) : (
              <span className="text-muted-foreground">Sin link</span>
            )}
          </div>
        </CardContent>
      </Card>

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
        <CardContent className="space-y-3 text-sm">
          {linkedQuotes.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No hay cotizaciones vinculadas.
            </p>
          )}
          {linkedQuotes.map((quote) => {
            const info = quotesById[quote.quoteId];
            return (
              <Link
                key={quote.id}
                href={`/crm/cotizaciones/${quote.quoteId}`}
                className="flex items-center justify-between rounded-md border px-3 py-2 transition-colors hover:bg-accent/30"
              >
                <div>
                  <p className="font-medium">{info?.code || "CPQ"}</p>
                  <p className="text-xs text-muted-foreground">
                    {info?.clientName || "Sin cliente"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
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
                      : info?.status || "draft"}
                  </Badge>
                  <ExternalLink className="h-3 w-3 text-muted-foreground/40" />
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Correos</CardTitle>
          {gmailConnected ? (
            <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary">
                  Enviar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Enviar correo</DialogTitle>
                  <DialogDescription>
                    Se enviará desde tu cuenta Gmail conectada.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Template</Label>
                    <select
                      className={selectClassName}
                      value={selectedTemplateId}
                      onChange={(event) => selectTemplate(event.target.value)}
                      disabled={sending}
                    >
                      <option value="">Selecciona un template</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Para</Label>
                    <input
                      value={emailTo}
                      onChange={(event) => setEmailTo(event.target.value)}
                      className={`h-9 w-full rounded-md border px-3 text-sm ${inputClassName}`}
                      placeholder="correo@cliente.com"
                      disabled={sending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Asunto</Label>
                    <input
                      value={emailSubject}
                      onChange={(event) => setEmailSubject(event.target.value)}
                      className={`h-9 w-full rounded-md border px-3 text-sm ${inputClassName}`}
                      placeholder="Asunto"
                      disabled={sending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mensaje</Label>
                    <textarea
                      value={emailBody}
                      onChange={(event) => setEmailBody(event.target.value)}
                      className={`min-h-[120px] w-full rounded-md border px-3 py-2 text-sm ${inputClassName}`}
                      placeholder="Escribe tu mensaje..."
                      disabled={sending}
                    />
                  </div>
                </div>
                <DialogFooter>
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
        <CardContent className="text-sm text-muted-foreground">
          {gmailConnected
            ? "Tu Gmail está conectado para enviar y registrar correos."
            : "Conecta Gmail en Configuración → Integraciones."}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contactos del cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {contacts.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Este cliente no tiene contactos aún.
            </p>
          )}
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="flex flex-col gap-1 rounded-md border px-3 py-2"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium">{`${contact.firstName} ${contact.lastName}`.trim()}</p>
                {contact.isPrimary && <Badge variant="outline">Principal</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">
                {contact.roleTitle || "Sin cargo"} · {contact.email || "Sin email"}
              </p>
              <p className="text-xs text-muted-foreground">
                {contact.phone || "Sin teléfono"}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

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
