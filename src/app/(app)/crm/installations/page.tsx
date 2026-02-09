/**
 * CRM Installations Page - Listado global de instalaciones
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAppAccess } from "@/lib/app-access";
import { prisma } from "@/lib/prisma";
import { getDefaultTenantId } from "@/lib/tenant";
import { PageHeader } from "@/components/opai";
import { CrmInstallationsListClient, CrmSubnav } from "@/components/crm";

export default async function CrmInstallationsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/opai/login?callbackUrl=/crm/installations");
  }

  if (!hasAppAccess(session.user.role, "crm")) {
    redirect("/hub");
  }

  const tenantId = session.user?.tenantId ?? (await getDefaultTenantId());
  const installations = await prisma.crmInstallation.findMany({
    where: { tenantId },
    include: { account: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const initialInstallations = JSON.parse(JSON.stringify(installations));

  return (
    <>
      <PageHeader
        title="Instalaciones"
        description="Sedes y ubicaciones de clientes"
      />
      <CrmSubnav />
      <CrmInstallationsListClient initialInstallations={initialInstallations} />
    </>
  );
}
