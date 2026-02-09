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
        totalPositions: true,
        totalGuards: true,
        createdAt: true,
      },
    }),
    prisma.crmAccount.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, type: true },
    }),
  ]);

  const initialQuotes = JSON.parse(JSON.stringify(quotes));
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
