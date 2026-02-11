/**
 * CRM Leads Page
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasCrmSubmoduleAccess } from "@/lib/module-access";
import { prisma } from "@/lib/prisma";
import { getDefaultTenantId } from "@/lib/tenant";
import { PageHeader } from "@/components/opai";
import { CrmLeadsClient, CrmSubnav } from "@/components/crm";

type LeadStatusFilter = "all" | "pending" | "approved" | "rejected";

function normalizeLeadStatusFilter(value?: string): LeadStatusFilter {
  if (value === "pending" || value === "approved" || value === "rejected") return value;
  return "all";
}

export default async function CrmLeadsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialStatusFilter = normalizeLeadStatusFilter(resolvedSearchParams?.status);

  const session = await auth();
  if (!session?.user) {
    redirect("/opai/login?callbackUrl=/crm/leads");
  }
  const role = session.user.role;

  if (!hasCrmSubmoduleAccess(role, "leads")) {
    redirect("/crm");
  }

  const tenantId = session.user?.tenantId ?? (await getDefaultTenantId());
  const leads = await prisma.crmLead.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });

  const initialLeads = JSON.parse(JSON.stringify(leads));

  return (
    <>
      <PageHeader
        title="Prospectos"
        description="Solicitudes entrantes y aprobación manual"
      />
      <CrmSubnav role={role} />
      <CrmLeadsClient
        initialLeads={initialLeads}
        initialStatusFilter={initialStatusFilter}
      />
    </>
  );
}
