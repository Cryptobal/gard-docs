/**
 * CRM Installation Detail Page - Detalle de instalación con mapa
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAppAccess } from "@/lib/app-access";
import { prisma } from "@/lib/prisma";
import { getDefaultTenantId } from "@/lib/tenant";
import { PageHeader, Breadcrumb } from "@/components/opai";
import { CrmInstallationDetailClient, InstallationEditButton, CrmSubnav } from "@/components/crm";

export default async function CrmInstallationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect(`/opai/login?callbackUrl=/crm/installations/${id}`);
  }

  if (!hasAppAccess(session.user.role, "crm")) {
    redirect("/hub");
  }

  const tenantId = session.user?.tenantId ?? (await getDefaultTenantId());
  const installation = await prisma.crmInstallation.findFirst({
    where: { id, tenantId },
    include: { account: { select: { id: true, name: true } } },
  });

  if (!installation) {
    redirect("/crm/installations");
  }

  const data = JSON.parse(JSON.stringify(installation));

  return (
    <>
      <Breadcrumb
        items={[
          { label: "CRM", href: "/crm" },
          { label: "Instalaciones", href: "/crm/installations" },
          { label: installation.name },
        ]}
        className="mb-4"
      />
      <PageHeader
        title={installation.name}
        description={
          installation.account
            ? installation.account.name
            : [installation.commune, installation.city].filter(Boolean).join(" · ") || "Sin ubicación"
        }
        actions={<InstallationEditButton installation={data} />}
      />
      <CrmSubnav />
      <CrmInstallationDetailClient installation={data} />
    </>
  );
}
