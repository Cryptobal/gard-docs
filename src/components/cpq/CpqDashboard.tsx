/**
 * CPQ Dashboard
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/opai";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateQuoteModal } from "@/components/cpq/CreateQuoteModal";
import { CpqQuotesList } from "@/components/cpq/CpqQuotesList";
import { formatCurrency } from "@/components/cpq/utils";
import type { CpqQuote } from "@/types/cpq";
import { FileText, Plus } from "lucide-react";

interface CpqDashboardProps {
  initialQuotes?: CpqQuote[];
}

export function CpqDashboard({ initialQuotes }: CpqDashboardProps) {
  const [quotes, setQuotes] = useState<CpqQuote[]>(initialQuotes || []);
  const [loading, setLoading] = useState(!initialQuotes);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cpq/quotes", { cache: "no-store" });
      const data = await res.json();
      if (data.success) setQuotes(data.data || []);
    } catch (err) {
      console.error("Error loading CPQ quotes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const totals = useMemo(() => {
    const totalQuotes = quotes.length;
    const totalMonthly = quotes.reduce((sum, q) => sum + Number(q.monthlyCost), 0);
    return { totalQuotes, totalMonthly };
  }, [quotes]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <PageHeader title="CPQ" description="Cotizador de servicios de seguridad" />
        <div className="flex items-center gap-2">
          <CreateQuoteModal onCreated={refresh} />
          <Link href="/payroll/simulator">
            <Button variant="outline" size="sm" className="gap-2">
              <FileText className="h-4 w-4" />
              Payroll
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="border-blue-500/20 bg-blue-500/5 p-4">
          <p className="text-[10px] uppercase text-blue-400/80">Cotizaciones</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-blue-400">
            {totals.totalQuotes}
          </p>
        </Card>
        <Card className="border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-[10px] uppercase text-emerald-400/80">Costo mensual</p>
          <p className="mt-1 font-mono text-2xl font-semibold text-emerald-400">
            {formatCurrency(totals.totalMonthly)}
          </p>
        </Card>
        <Card className="border-muted/40 bg-card p-4">
          <p className="text-[10px] uppercase text-muted-foreground">Estado</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline">Borradores</Badge>
            <Badge variant="secondary">Enviadas</Badge>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Cotizaciones recientes</h2>
          <Button size="sm" variant="outline" className="gap-2" onClick={refresh}>
            <Plus className="h-3 w-3" />
            Actualizar
          </Button>
        </div>
        <CpqQuotesList quotes={quotes} loading={loading} />
      </Card>
    </div>
  );
}
