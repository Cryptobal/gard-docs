/**
 * CRM Account Detail Page
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAppAccess } from "@/lib/app-access";
import { prisma } from "@/lib/prisma";
import { getDefaultTenantId } from "@/lib/tenant";
import { PageHeader, Breadcrumb } from "@/components/opai";
import { CrmAccountDetailClient } from "@/components/crm/CrmAccountDetailClient";
import { CrmSubnav } from "@/components/crm/CrmSubnav";

export default async function CrmAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect(`/opai/login?callbackUrl=/crm/accounts/${id}`);
  }

  if (!hasAppAccess(session.user.role, "crm")) {
    redirect("/hub");
  }

  const tenantId = session.user?.tenantId ?? (await getDefaultTenantId());

  const account = await prisma.crmAccount.findFirst({
    where: { id, tenantId },
    include: {
      contacts: { orderBy: { createdAt: "desc" } },
      deals: {
        include: { stage: true, primaryContact: true },
        orderBy: { createdAt: "desc" },
      },
      installations: { orderBy: { createdAt: "desc" } },
      _count: { select: { contacts: true, deals: true, installations: true } },
    },
  });

  if (!account) {
    redirect("/crm/accounts");
  }

  const data = JSON.parse(JSON.stringify(account));

  return (
    <>
      <Breadcrumb
        items={[
          { label: "CRM", href: "/crm" },
          { label: "Cuentas", href: "/crm/accounts" },
          { label: account.name },
        ]}
        className="mb-4"
      />
      <PageHeader
        title={account.name}
        description={`${account.type === "client" ? "Cliente" : "Prospecto"} · ${account.industry || "Sin industria"}`}
      />
      <CrmSubnav />
      <CrmAccountDetailClient account={data} />
    </>
  );
}
