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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, KpiCard, Stepper } from "@/components/opai";
import { CreatePositionModal } from "@/components/cpq/CreatePositionModal";
import { CpqPositionCard } from "@/components/cpq/CpqPositionCard";
import { CpqQuoteCosts } from "@/components/cpq/CpqQuoteCosts";
import { CpqPricingCalc } from "@/components/cpq/CpqPricingCalc";
import { SendCpqQuoteModal } from "@/components/cpq/SendCpqQuoteModal";
import { formatCurrency } from "@/components/cpq/utils";
import { cn, formatNumber, parseLocalizedNumber } from "@/lib/utils";
import type {
  CpqQuote,
  CpqPosition,
  CpqQuoteCostSummary,
  CpqQuoteParameters,
  CpqQuoteCostItem,
  CpqQuoteUniformItem,
  CpqQuoteExamItem,
  CpqQuoteMeal,
  CpqQuoteVehicle,
  CpqQuoteInfrastructure,
} from "@/types/cpq";
import { toast } from "sonner";
import { ArrowLeft, Copy, RefreshCw, FileText, Users, Layers, Calculator, ChevronLeft, ChevronRight, ChevronDown, Check, Trash2, Download, Send } from "lucide-react";

interface CpqQuoteDetailProps {
  quoteId: string;
}

const DEFAULT_PARAMS: CpqQuoteParameters = {
  monthlyHoursStandard: 180,
  avgStayMonths: 4,
  uniformChangesPerYear: 3,
  financialRatePct: 0,
  salePriceMonthly: 0,
  policyRatePct: 0,
  policyAdminRatePct: 0,
  policyContractMonths: 12,
  policyContractPct: 100,
  contractMonths: 12,
  contractAmount: 0,
  marginPct: 20,
};

export function CpqQuoteDetail({ quoteId }: CpqQuoteDetailProps) {
  const router = useRouter();
  const [quote, setQuote] = useState<CpqQuote | null>(null);
  const [positions, setPositions] = useState<CpqPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [costSummary, setCostSummary] = useState<CpqQuoteCostSummary | null>(null);
  const [costParams, setCostParams] = useState<CpqQuoteParameters | null>(null);
  const [costItems, setCostItems] = useState<CpqQuoteCostItem[]>([]);
  const [uniforms, setUniforms] = useState<CpqQuoteUniformItem[]>([]);
  const [exams, setExams] = useState<CpqQuoteExamItem[]>([]);
  const [meals, setMeals] = useState<CpqQuoteMeal[]>([]);
  const [vehicles, setVehicles] = useState<CpqQuoteVehicle[]>([]);
  const [infrastructure, setInfrastructure] = useState<CpqQuoteInfrastructure[]>([]);
  const [marginPct, setMarginPct] = useState(20);
  const [cloning, setCloning] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [savingFinancials, setSavingFinancials] = useState(false);
  const [financialError, setFinancialError] = useState<string | null>(null);
  const [decimalDrafts, setDecimalDrafts] = useState<Record<string, string>>({});
  const [financialsCollapsed, setFinancialsCollapsed] = useState(true);
  const [quoteForm, setQuoteForm] = useState({
    clientName: "",
    validUntil: "",
    notes: "",
    status: "draft" as CpqQuote["status"],
  });
  const [quoteDirty, setQuoteDirty] = useState(false);
  const [savingQuote, setSavingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const steps = ["Datos", "Puestos", "Costos", "Resumen"];
  const stepIcons = [FileText, Users, Layers, Calculator];
  const formatDateInput = (value?: string | null) => (value ? value.split("T")[0] : "");
  const formatTime = (value: Date) =>
    value.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  const getDecimalValue = (
    key: string,
    value: number | null | undefined,
    decimals = 2,
    allowEmpty = false
  ) => {
    if (Object.prototype.hasOwnProperty.call(decimalDrafts, key)) {
      return decimalDrafts[key];
    }
    if (allowEmpty && (value === null || value === undefined)) return "";
    return formatNumber(Number(value ?? 0), { minDecimals: decimals, maxDecimals: decimals });
  };
  const setDecimalValue = (key: string, value: string) => {
    setDecimalDrafts((prev) => ({ ...prev, [key]: value }));
  };
  const clearDecimalValue = (key: string) => {
    setDecimalDrafts((prev) => {
      if (!Object.prototype.hasOwnProperty.call(prev, key)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };
  const updateParams = (patch: Partial<CpqQuoteParameters>) => {
    setCostParams((prev) => ({
      ...DEFAULT_PARAMS,
      ...(prev ?? {}),
      ...patch,
      marginPct: prev?.marginPct ?? marginPct,
    }));
  };
  const updateCostItem = (catalogItemId: string, patch: Partial<CpqQuoteCostItem>) => {
    setCostItems((prev) =>
      prev.map((item) =>
        item.catalogItemId === catalogItemId ? { ...item, ...patch } : item
      )
    );
  };

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
        setCostParams(costsData.data.parameters || null);
        setMarginPct(costsData.data.parameters?.marginPct ?? 20);
        setCostItems(costsData.data.costItems || []);
        setUniforms(costsData.data.uniforms || []);
        setExams(costsData.data.exams || []);
        setMeals(costsData.data.meals || []);
        setVehicles(costsData.data.vehicles || []);
        setInfrastructure(costsData.data.infrastructure || []);
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

  useEffect(() => {
    if (!quote) return;
    setQuoteForm({
      clientName: quote.clientName || "",
      validUntil: formatDateInput(quote.validUntil),
      notes: quote.notes || "",
      status: quote.status,
    });
    setQuoteDirty(false);
  }, [quote]);

  const saveQuoteBasics = async (options?: { nextStep?: number }) => {
    setSavingQuote(true);
    setQuoteError(null);
    try {
      const res = await fetch(`/api/cpq/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: quoteForm.clientName,
          validUntil: quoteForm.validUntil || null,
          notes: quoteForm.notes,
          status: quoteForm.status,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Error");
      setQuote(data.data);
      setQuoteDirty(false);
      setLastSavedAt(new Date());
      if (options?.nextStep !== undefined) setActiveStep(options.nextStep);
    } catch (error) {
      console.error("Error saving CPQ quote:", error);
      setQuoteError("No se pudo guardar la cotización.");
    } finally {
      setSavingQuote(false);
    }
  };

  const handleSaveFinancials = async () => {
    if (!costParams) return;
    setSavingFinancials(true);
    setFinancialError(null);
    try {
      const res = await fetch(`/api/cpq/quotes/${quoteId}/costs`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parameters: costParams,
          uniforms,
          exams,
          costItems,
          meals,
          vehicles,
          infrastructure,
        }),
      });
      const data = await res.json();
      if (!data?.success) {
        throw new Error(data?.error || "Error");
      }
      setCostSummary(data.data);
      await refresh();
      toast.success("Financieros guardados");
    } catch (error) {
      console.error("Error saving financials:", error);
      setFinancialError("No se pudieron guardar los financieros.");
      toast.error("No se pudieron guardar los financieros");
    } finally {
      setSavingFinancials(false);
    }
  };

  const goToStep = async (nextStep: number) => {
    const clamped = Math.max(0, Math.min(steps.length - 1, nextStep));
    if (clamped === activeStep) return;
    if (activeStep === 0 && quoteDirty) {
      await saveQuoteBasics({ nextStep: clamped });
      return;
    }
    setActiveStep(clamped);
  };

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

  const handleDelete = async () => {
    if (!window.confirm("¿Eliminar esta cotización? Esta acción no se puede deshacer.")) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/cpq/quotes/${quoteId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Error");
      }
      toast.success("Cotización eliminada");
      router.push("/crm/cotizaciones");
      router.refresh();
    } catch (error) {
      console.error("Error deleting quote:", error);
      toast.error("No se pudo eliminar la cotización");
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const response = await fetch(`/api/cpq/quotes/${quoteId}/export-pdf`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Error al generar PDF");
      }
      const html = await response.text();
      
      // Abrir en nueva ventana para imprimir como PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
      }
      
      toast.success("PDF generado. Usa Imprimir → Guardar como PDF");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("No se pudo generar el PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const stats = useMemo(() => {
    const totalGuards = quote?.totalGuards ?? positions.reduce((sum, p) => sum + p.numGuards, 0);
    const monthly = quote?.monthlyCost ?? positions.reduce((sum, p) => sum + Number(p.monthlyPositionCost), 0);
    return { totalGuards, monthly };
  }, [positions, quote]);

  const additionalCostsTotal = costSummary?.monthlyExtras ?? 0;
  const baseAdditionalCostsTotal = costSummary
    ? Math.max(
        0,
        additionalCostsTotal - costSummary.monthlyFinancial - costSummary.monthlyPolicy
      )
    : 0;
  const financialRatePct = costSummary?.financialRatePct ?? 0;
  const policyRatePct = costSummary?.policyRatePct ?? 0;
  const monthlyHours = costParams?.monthlyHoursStandard ?? 180;
  const policyContractMonths = costParams?.policyContractMonths ?? 12;
  const policyContractPct = costParams?.policyContractPct ?? 100;
  const contractMonths = costParams?.contractMonths ?? 12;
  const financialItem = costItems.find((item) => item.catalogItem?.type === "financial");
  const policyItem = costItems.find((item) => item.catalogItem?.type === "policy");
  const monthlyTotal = costSummary?.monthlyTotal ?? stats.monthly + additionalCostsTotal;
  const saveLabel = savingQuote
    ? "Guardando..."
    : quoteDirty
    ? "Cambios sin guardar"
    : lastSavedAt
    ? `Guardado ${formatTime(lastSavedAt)}`
    : "Sin cambios";
  const nextLabel =
    activeStep === steps.length - 1
      ? "Listo"
      : activeStep === 0 && quoteDirty
      ? "Guardar y seguir"
      : "Siguiente";
  const nextDisabled =
    activeStep === steps.length - 1 || (activeStep === 0 && savingQuote);

  if (loading && !quote) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            <div className="h-3 w-48 rounded bg-muted/60 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg border border-border bg-muted/20 animate-pulse" />
          ))}
        </div>
      </div>
    );
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
    <div className="space-y-3 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href="/crm/cotizaciones">
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
          <SendCpqQuoteModal
            quoteId={quoteId}
            quoteCode={quote.code}
            clientName={quote.clientName || undefined}
            disabled={!quote || positions.length === 0}
          />
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf || !quote}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">
              {downloadingPdf ? "Generando..." : "PDF"}
            </span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={handleClone}
            disabled={cloning}
          >
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline">
              {cloning ? "Clonando..." : "Clonar"}
            </span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={refresh}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="gap-2"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">
              {deleting ? "Eliminando..." : "Eliminar"}
            </span>
          </Button>
        </div>
      </div>

      <Stepper steps={steps} currentStep={activeStep} onStepClick={goToStep} className="mb-6" />

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
        <KpiCard
          title="Puestos"
          value={positions.length}
          variant="blue"
          size="lg"
          className="col-span-1"
        />
        <KpiCard
          title="Guardias"
          value={stats.totalGuards}
          variant="purple"
          size="lg"
          className="col-span-1"
        />
        <KpiCard
          title="Costo mensual"
          value={formatCurrency(monthlyTotal)}
          variant="emerald"
          size="lg"
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {activeStep === 0 && (
        <Card className="p-3 sm:p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Datos básicos</h2>
              <p className="text-xs text-muted-foreground">
                Se guarda automáticamente al avanzar.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="outline" className="text-xs">
                {quote.status}
              </Badge>
              <span
                className={`text-xs ${
                  quoteDirty ? "text-amber-400" : "text-muted-foreground"
                }`}
              >
                {saveLabel}
              </span>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Cliente</Label>
              <Input
                value={quoteForm.clientName}
                onChange={(e) => {
                  setQuoteForm((prev) => ({ ...prev, clientName: e.target.value }));
                  setQuoteDirty(true);
                }}
                placeholder="Nombre del cliente"
                className="h-10 bg-background text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Válida hasta</Label>
              <Input
                type="date"
                value={quoteForm.validUntil}
                onChange={(e) => {
                  setQuoteForm((prev) => ({ ...prev, validUntil: e.target.value }));
                  setQuoteDirty(true);
                }}
                className="h-10 bg-background text-sm"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs">Notas</Label>
              <Input
                value={quoteForm.notes}
                onChange={(e) => {
                  setQuoteForm((prev) => ({ ...prev, notes: e.target.value }));
                  setQuoteDirty(true);
                }}
                placeholder="Observaciones internas"
                className="h-10 bg-background text-sm"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs">Estado</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                value={quoteForm.status}
                onChange={(e) => {
                  setQuoteForm((prev) => ({
                    ...prev,
                    status: e.target.value as CpqQuote["status"],
                  }));
                  setQuoteDirty(true);
                }}
              >
                <option value="draft">Borrador</option>
                <option value="sent">Enviada</option>
                <option value="approved">Aprobada</option>
                <option value="rejected">Rechazada</option>
              </select>
            </div>
          </div>

          {quoteError && (
            <div className="text-xs text-red-400">{quoteError}</div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => saveQuoteBasics()}
              disabled={!quoteDirty || savingQuote}
            >
              {savingQuote ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </Card>
      )}

      {activeStep === 1 && (
        <Card className="p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Puestos de trabajo</h2>
              <Badge variant="outline" className="text-xs">
                {quote.status}
              </Badge>
            </div>
            <CreatePositionModal quoteId={quoteId} onCreated={refresh} />
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Agrega uno o más puestos. Puedes editar o duplicar luego.
          </p>

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
                    baseAdditionalCostsTotal={baseAdditionalCostsTotal}
                  marginPct={marginPct}
                  financialRatePct={financialRatePct}
                  policyRatePct={policyRatePct}
                  monthlyHours={monthlyHours}
                    policyContractMonths={policyContractMonths}
                    policyContractPct={policyContractPct}
                    contractMonths={contractMonths}
                />
              ))}
            </div>
          )}
        </Card>
      )}

      {activeStep === 2 && (
        <CpqQuoteCosts quoteId={quoteId} variant="inline" showFinancial={false} />
      )}

      {activeStep === 3 && (
        <div className="space-y-3">
          <Card className="p-3 sm:p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Resumen y precio</h2>
                <p className="text-xs text-muted-foreground">
                  Revisa totales y margen antes de enviar la cotización.
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {quote.status}
              </Badge>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-md border border-border/50 p-2">
                <p className="text-xs text-muted-foreground uppercase">Adicionales</p>
                <p className="text-sm font-semibold">{formatCurrency(additionalCostsTotal)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 sm:p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Gastos financieros</h2>
                <p className="text-xs text-muted-foreground">
                  Activa y configura costo financiero y póliza.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground"
                onClick={() => setFinancialsCollapsed((prev) => !prev)}
                aria-expanded={!financialsCollapsed}
              >
                {financialsCollapsed ? "Mostrar" : "Ocultar"}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${
                    financialsCollapsed ? "" : "rotate-180"
                  }`}
                />
              </button>
            </div>

            {financialsCollapsed && (
              <div className="text-xs text-muted-foreground">
                Total actual:{" "}
                {formatCurrency(
                  costSummary ? costSummary.monthlyFinancial + costSummary.monthlyPolicy : 0
                )}
              </div>
            )}

            {!financialsCollapsed && (
              <>
                <div className="grid gap-3">
                  <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold">Costo financiero</p>
                        <p className="text-xs text-muted-foreground">
                          Se calcula sobre costo + margen.
                        </p>
                      </div>
                      <button
                        type="button"
                        className={cn(
                          "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors",
                          financialItem?.isEnabled
                            ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-200"
                            : "border-border bg-muted/30 text-muted-foreground",
                          !financialItem && "cursor-not-allowed opacity-60"
                        )}
                        onClick={() => {
                          if (!financialItem) return;
                          updateCostItem(financialItem.catalogItemId, {
                            isEnabled: !financialItem.isEnabled,
                          });
                        }}
                        aria-pressed={financialItem?.isEnabled ?? false}
                        disabled={!financialItem}
                      >
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            financialItem?.isEnabled ? "bg-emerald-400" : "bg-muted-foreground"
                          )}
                        />
                        {financialItem?.isEnabled ? "Activo" : "Inactivo"}
                      </button>
                    </div>

                    {financialItem ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Tasa (%)</Label>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={getDecimalValue(
                              `financialRate:${financialItem.catalogItemId}`,
                              financialItem.unitPriceOverride ?? null,
                              2,
                              true
                            )}
                            onChange={(e) =>
                              setDecimalValue(
                                `financialRate:${financialItem.catalogItemId}`,
                                e.target.value
                              )
                            }
                            onBlur={() => {
                              const key = `financialRate:${financialItem.catalogItemId}`;
                              const raw = decimalDrafts[key];
                              if (raw === undefined) return;
                              const parsed = raw.trim() ? parseLocalizedNumber(raw) : null;
                              updateCostItem(financialItem.catalogItemId, {
                                unitPriceOverride: parsed,
                              });
                              clearDecimalValue(key);
                            }}
                            className="h-9 bg-card text-foreground border-border placeholder:text-muted-foreground"
                          />
                        </div>
                        <div className="flex items-end text-xs text-muted-foreground">
                          Tasa base:{" "}
                          {formatNumber(Number(financialItem.catalogItem?.basePrice ?? 0), {
                            minDecimals: 2,
                            maxDecimals: 2,
                          })}
                          %
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        No hay ítem financiero en el catálogo.
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold">Póliza de garantía</p>
                        <p className="text-xs text-muted-foreground">
                          Se calcula sobre costo + margen.
                        </p>
                      </div>
                      <button
                        type="button"
                        className={cn(
                          "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors",
                          policyItem?.isEnabled
                            ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-200"
                            : "border-border bg-muted/30 text-muted-foreground",
                          !policyItem && "cursor-not-allowed opacity-60"
                        )}
                        onClick={() => {
                          if (!policyItem) return;
                          updateCostItem(policyItem.catalogItemId, {
                            isEnabled: !policyItem.isEnabled,
                          });
                        }}
                        aria-pressed={policyItem?.isEnabled ?? false}
                        disabled={!policyItem}
                      >
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            policyItem?.isEnabled ? "bg-emerald-400" : "bg-muted-foreground"
                          )}
                        />
                        {policyItem?.isEnabled ? "Activo" : "Inactivo"}
                      </button>
                    </div>

                    {policyItem ? (
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Tasa (%)</Label>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={getDecimalValue(
                              `policyRate:${policyItem.catalogItemId}`,
                              policyItem.unitPriceOverride ?? null,
                              2,
                              true
                            )}
                            onChange={(e) =>
                              setDecimalValue(
                                `policyRate:${policyItem.catalogItemId}`,
                                e.target.value
                              )
                            }
                            onBlur={() => {
                              const key = `policyRate:${policyItem.catalogItemId}`;
                              const raw = decimalDrafts[key];
                              if (raw === undefined) return;
                              const parsed = raw.trim() ? parseLocalizedNumber(raw) : null;
                              updateCostItem(policyItem.catalogItemId, {
                                unitPriceOverride: parsed,
                              });
                              clearDecimalValue(key);
                            }}
                            className="h-9 bg-card text-foreground border-border placeholder:text-muted-foreground"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Meses a considerar</Label>
                          <Input
                            type="number"
                            value={policyContractMonths}
                            onChange={(e) =>
                              updateParams({
                                policyContractMonths: parseLocalizedNumber(e.target.value),
                              })
                            }
                            className="h-9 bg-card text-foreground border-border placeholder:text-muted-foreground"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Porcentaje contrato (%)</Label>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={getDecimalValue(
                              "policyContractPct",
                              policyContractPct,
                              2
                            )}
                            onChange={(e) => setDecimalValue("policyContractPct", e.target.value)}
                            onBlur={() => {
                              const raw = decimalDrafts.policyContractPct;
                              if (raw === undefined) return;
                              const parsed = raw.trim() ? parseLocalizedNumber(raw) : 0;
                              updateParams({ policyContractPct: parsed });
                              clearDecimalValue("policyContractPct");
                            }}
                            className="h-9 bg-card text-foreground border-border placeholder:text-muted-foreground"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Meses contrato</Label>
                          <Input
                            type="number"
                            value={contractMonths}
                            onChange={(e) =>
                              updateParams({ contractMonths: parseLocalizedNumber(e.target.value) })
                            }
                            className="h-9 bg-card text-foreground border-border placeholder:text-muted-foreground"
                          />
                        </div>
                        <div className="text-xs text-muted-foreground sm:col-span-2 lg:col-span-4">
                          Tasa base:{" "}
                          {formatNumber(Number(policyItem.catalogItem?.basePrice ?? 0), {
                            minDecimals: 2,
                            maxDecimals: 2,
                          })}
                          %
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        No hay ítem de póliza en el catálogo.
                      </div>
                    )}
                  </div>
                </div>

                {financialError && (
                  <div className="text-xs text-red-400">{financialError}</div>
                )}

                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleSaveFinancials}
                    disabled={savingFinancials || !costParams}
                  >
                    {savingFinancials ? "Guardando..." : "Guardar financieros"}
                  </Button>
                </div>
              </>
            )}
          </Card>

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
            financialRatePct={financialRatePct}
            policyRatePct={policyRatePct}
            policyContractMonths={policyContractMonths}
            policyContractPct={policyContractPct}
            contractMonths={contractMonths}
          />
        </div>
      )}

      <div className="sticky bottom-0 z-20 -mx-4 border-t border-border/60 bg-background/95 px-4 py-2 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => void goToStep(activeStep - 1)}
            disabled={activeStep === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            Atrás
          </Button>
          <span className="text-xs text-muted-foreground">
            Paso {activeStep + 1} de {steps.length} · {steps[activeStep]}
          </span>
          <Button
            size="sm"
            className="gap-1"
            onClick={() => void goToStep(activeStep + 1)}
            disabled={nextDisabled}
          >
            {nextLabel}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
