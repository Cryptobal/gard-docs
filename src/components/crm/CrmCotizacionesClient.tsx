"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/opai/EmptyState";
import { FileText, Search, ExternalLink, Plus } from "lucide-react";
import { formatCLP, formatNumber } from "@/lib/utils";
import { CrmDates } from "@/components/crm/CrmDates";

type QuoteRow = {
  id: string;
  code: string;
  status: string;
  clientName?: string | null;
  monthlyCost: string | number;
  salePriceMonthly: string | number;
  marginPct?: number;
  currency: string;
  totalPositions: number;
  totalGuards: number;
  createdAt: string;
  updatedAt?: string | null;
};

type AccountRow = {
  id: string;
  name: string;
};

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: "Borrador", className: "" },
  sent: { label: "Enviada", className: "border-blue-500/30 text-blue-400" },
  approved: { label: "Aprobada", className: "border-emerald-500/30 text-emerald-400" },
  rejected: { label: "Rechazada", className: "border-red-500/30 text-red-400" },
};

export function CrmCotizacionesClient({
  quotes,
  accounts,
}: {
  quotes: QuoteRow[];
  accounts: AccountRow[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");

  const filteredQuotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return quotes.filter((quote) => {
      if (statusFilter !== "all" && quote.status !== statusFilter) return false;
      if (accountFilter !== "all") {
        const matchesAccount = quote.clientName?.toLowerCase() === accounts.find((a) => a.id === accountFilter)?.name.toLowerCase();
        if (!matchesAccount) return false;
      }
      if (q && !`${quote.code} ${quote.clientName || ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [quotes, search, statusFilter, accountFilter, accounts]);

  const counts = useMemo(() => ({
    total: quotes.length,
    draft: quotes.filter((q) => q.status === "draft").length,
    sent: quotes.filter((q) => q.status === "sent").length,
    approved: quotes.filter((q) => q.status === "approved").length,
    rejected: quotes.filter((q) => q.status === "rejected").length,
  }), [quotes]);

  return (
    <div className="space-y-4">
      {/* KPI summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Total" value={counts.total} />
        <SummaryCard label="Borradores" value={counts.draft} />
        <SummaryCard label="Enviadas" value={counts.sent} className="text-blue-400" />
        <SummaryCard label="Aprobadas" value={counts.approved} className="text-emerald-400" />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código o cliente..."
              className="pl-9 h-9 bg-background text-foreground border-input"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {[
              { key: "all", label: "Todas" },
              { key: "draft", label: "Borrador" },
              { key: "sent", label: "Enviadas" },
              { key: "approved", label: "Aprobadas" },
              { key: "rejected", label: "Rechazadas" },
            ].map((opt) => (
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
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Quote list */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Cotizaciones</CardTitle>
          <Link href="/cpq">
            <Button size="sm" variant="secondary" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Nueva en CPQ</span>
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {filteredQuotes.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-8 w-8" />}
              title="Sin cotizaciones"
              description={
                search || statusFilter !== "all"
                  ? "No hay cotizaciones para los filtros seleccionados."
                  : "Crea tu primera cotización desde el módulo CPQ."
              }
              action={
                <Link href="/cpq">
                  <Button size="sm" variant="outline">
                    Ir a CPQ
                  </Button>
                </Link>
              }
              compact
            />
          ) : (
            <div className="space-y-2">
              {filteredQuotes.map((quote) => {
                const status = STATUS_MAP[quote.status] || STATUS_MAP.draft;
                return (
                  <Link
                    key={quote.id}
                    href={`/crm/cotizaciones/${quote.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent/30 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">{quote.code}</span>
                        <Badge variant="outline" className={status.className}>
                          {status.label}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">
                        {quote.clientName || "Sin cliente"} · {quote.totalGuards} guardias · {quote.totalPositions} puestos
                      </p>
                      <CrmDates createdAt={quote.createdAt} updatedAt={quote.updatedAt} className="mt-0.5" />
                    </div>
                    <div className="flex items-center gap-4 shrink-0 ml-3 text-right">
                      <div className="text-xs">
                        <p className="text-muted-foreground">P. venta</p>
                        <p className="text-sm font-medium">{formatCLP(Number(quote.salePriceMonthly))}</p>
                      </div>
                      <div className="text-xs">
                        <p className="text-muted-foreground">Costo</p>
                        <p className="text-sm">{formatCLP(Number(quote.monthlyCost))}</p>
                      </div>
                      <div className="text-xs">
                        <p className="text-muted-foreground">Margen</p>
                        <p className="text-sm font-medium text-emerald-400">
                          {quote.marginPct != null
                            ? `${formatNumber(quote.marginPct, { minDecimals: 1, maxDecimals: 1 })}%`
                            : "—"}
                        </p>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors self-center" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${className || ""}`}>{value}</p>
    </div>
  );
}
