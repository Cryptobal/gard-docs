/**
 * Detalle de cotización CPQ
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader, KpiCard } from "@/components/opai";
import { CreatePositionModal } from "@/components/cpq/CreatePositionModal";
import { CpqPositionCard } from "@/components/cpq/CpqPositionCard";
import { CpqQuoteCosts } from "@/components/cpq/CpqQuoteCosts";
import { CpqPricingCalc } from "@/components/cpq/CpqPricingCalc";
import { formatCurrency } from "@/components/cpq/utils";
import type { CpqQuote, CpqPosition, CpqQuoteCostSummary } from "@/types/cpq";
import { ArrowLeft, Copy, RefreshCw } from "lucide-react";

interface CpqQuoteDetailProps {
  quoteId: string;
}

export function CpqQuoteDetail({ quoteId }: CpqQuoteDetailProps) {
  const router = useRouter();
  const [quote, setQuote] = useState<CpqQuote | null>(null);
  const [positions, setPositions] = useState<CpqPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [costSummary, setCostSummary] = useState<CpqQuoteCostSummary | null>(null);
  const [marginPct, setMarginPct] = useState(20);
  const [cloning, setCloning] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const [quoteRes, costsRes] = await Promise.all([
        fetch(`/api/cpq/quotes/${quoteId}`),
        fetch(`/api/cpq/quotes/${quoteId}/costs`),
      ]);
      const quoteData = await quoteRes.json();
      const costsData = await costsRes.json();
      if (quoteData.success) {
        setQuote(quoteData.data);
        setPositions(quoteData.data.positions || []);
      }
      if (costsData.success) {
        setCostSummary(costsData.data.summary);
        setMarginPct(costsData.data.parameters?.marginPct ?? 20);
      }
    } catch (err) {
      console.error("Error loading CPQ quote:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [quoteId]);

  const handleClone = async () => {
    setCloning(true);
    try {
      const response = await fetch(`/api/cpq/quotes/${quoteId}/clone`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        router.push(`/cpq/${data.data.id}`);
      }
    } catch (error) {
      console.error("Error cloning quote:", error);
    } finally {
      setCloning(false);
    }
  };

  const stats = useMemo(() => {
    const totalGuards = quote?.totalGuards ?? positions.reduce((sum, p) => sum + p.numGuards, 0);
    const monthly = quote?.monthlyCost ?? positions.reduce((sum, p) => sum + Number(p.monthlyPositionCost), 0);
    return { totalGuards, monthly };
  }, [positions, quote]);

  const additionalCostsTotal = costSummary?.monthlyExtras ?? 0;
  const financialRatePct = costSummary
    ? (costSummary.monthlyFinancial / (costSummary.monthlyTotal || 1)) * 100
    : 0;
  const policyRatePct = costSummary
    ? (costSummary.monthlyPolicy / (costSummary.monthlyTotal || 1)) * 100
    : 0;

  if (loading && !quote) {
    return <div className="text-sm text-muted-foreground">Cargando...</div>;
  }

  if (!quote) {
    return (
      <div className="space-y-3">
        <Button variant="outline" size="sm" onClick={() => router.push("/cpq")}>
          Volver
        </Button>
        <div className="text-sm text-muted-foreground">Cotización no encontrada.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href="/cpq">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <PageHeader
            title={quote.code}
            description={quote.clientName || "Sin cliente"}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-2" onClick={refresh}>
            <RefreshCw className="h-3 w-3" />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={handleClone}
            disabled={cloning}
          >
            <Copy className="h-3 w-3" />
            <span className="hidden sm:inline">
              {cloning ? "Clonando..." : "Clonar"}
            </span>
          </Button>
          <CreatePositionModal quoteId={quoteId} onCreated={refresh} />
        </div>
      </div>

      <div className="grid gap-3 grid-cols-3 md:grid-cols-3">
        <KpiCard
          title="Puestos"
          value={positions.length}
          variant="blue"
          size="lg"
        />
        <KpiCard
          title="Guardias"
          value={stats.totalGuards}
          variant="purple"
          size="lg"
        />
        <KpiCard
          title="Costo mensual"
          value={formatCurrency(stats.monthly)}
          variant="emerald"
          size="lg"
        />
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Puestos de trabajo</h2>
            <Badge variant="outline" className="text-xs">
              {quote.status}
            </Badge>
          </div>
        </div>

        {positions.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Agrega el primer puesto para comenzar la estructura de servicio.
          </div>
        ) : (
          <div className="space-y-3">
            {positions.map((position) => (
              <CpqPositionCard
                key={position.id}
                position={position}
                quoteId={quoteId}
                onUpdated={refresh}
                totalGuards={stats.totalGuards}
                additionalCostsTotal={additionalCostsTotal}
                marginPct={marginPct}
                financialRatePct={financialRatePct}
                policyRatePct={policyRatePct}
                monthlyHours={180}
              />
            ))}
          </div>
        )}
      </Card>

      <CpqQuoteCosts quoteId={quoteId} />
      
      <CpqPricingCalc
        summary={costSummary}
        marginPct={marginPct}
        onMarginChange={async (newMargin) => {
          setMarginPct(newMargin);
          try {
            await fetch(`/api/cpq/quotes/${quoteId}/margin`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ marginPct: newMargin }),
            });
            await refresh();
          } catch (error) {
            console.error("Error saving margin:", error);
          }
        }}
        uniformTotal={costSummary?.monthlyUniforms ?? 0}
        examTotal={costSummary?.monthlyExams ?? 0}
        mealTotal={costSummary?.monthlyMeals ?? 0}
        operationalTotal={costSummary ? (costSummary.monthlyCostItems || 0) : 0}
        transportTotal={0}
        vehicleTotal={0}
        infraTotal={0}
        systemTotal={0}
      />
    </div>
  );
}
