/**
 * CRM - Cotizaciones (CPQ)
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAppAccess } from "@/lib/app-access";
import { prisma } from "@/lib/prisma";
import { getDefaultTenantId } from "@/lib/tenant";
import { PageHeader } from "@/components/opai";
import { CrmSubnav } from "@/components/crm/CrmSubnav";
import { CrmCotizacionesClient } from "@/components/crm/CrmCotizacionesClient";
import { computeCpqQuoteCosts } from "@/modules/cpq/costing/compute-quote-costs";

export default async function CrmCotizacionesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/opai/login?callbackUrl=/crm/cotizaciones");
  }

  if (!hasAppAccess(session.user.role, "crm")) {
    redirect("/hub");
  }

  const tenantId = session.user?.tenantId ?? (await getDefaultTenantId());

  const [quotes, accounts] = await Promise.all([
    prisma.cpqQuote.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        code: true,
        status: true,
        clientName: true,
        monthlyCost: true,
        currency: true,
        totalPositions: true,
        totalGuards: true,
        createdAt: true,
        updatedAt: true,
        parameters: {
          select: { salePriceMonthly: true, marginPct: true },
        },
      },
    }),
    prisma.crmAccount.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  // Enriquecer con salePriceMonthly calculado si está en 0
  const enrichedQuotes = await Promise.all(
    quotes.map(async (q) => {
      let salePriceMonthly = Number(q.parameters?.salePriceMonthly ?? 0);
      const marginPct = Number(q.parameters?.marginPct ?? 20);
      if (salePriceMonthly <= 0) {
        try {
          const summary = await computeCpqQuoteCosts(q.id);
          const margin = marginPct / 100;
          const costsBase =
            summary.monthlyPositions +
            (summary.monthlyUniforms ?? 0) +
            (summary.monthlyExams ?? 0) +
            (summary.monthlyMeals ?? 0) +
            (summary.monthlyVehicles ?? 0) +
            (summary.monthlyInfrastructure ?? 0) +
            (summary.monthlyCostItems ?? 0);
          const bwm = margin < 1 ? costsBase / (1 - margin) : costsBase;
          salePriceMonthly = bwm + (summary.monthlyFinancial ?? 0) + (summary.monthlyPolicy ?? 0);
        } catch {
          // mantener 0 si falla el cálculo
        }
      }
      return {
        id: q.id,
        code: q.code,
        status: q.status,
        clientName: q.clientName,
        monthlyCost: q.monthlyCost,
        currency: q.currency ?? "CLP",
        salePriceMonthly,
        marginPct,
        totalPositions: q.totalPositions,
        totalGuards: q.totalGuards,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
      };
    })
  );

  const initialQuotes = JSON.parse(JSON.stringify(enrichedQuotes));
  const initialAccounts = JSON.parse(JSON.stringify(accounts));

  return (
    <>
      <PageHeader
        title="Cotizaciones"
        description="Cotizaciones CPQ vinculadas al CRM"
        className="mb-6"
      />
      <CrmSubnav />
      <CrmCotizacionesClient quotes={initialQuotes} accounts={initialAccounts} />
    </>
  );
}
