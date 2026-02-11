/**
 * CRM Installation Detail Page - Detalle de instalación con mapa
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasCrmSubmoduleAccess } from "@/lib/module-access";
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
  const role = session.user.role;

  if (!hasCrmSubmoduleAccess(role, "installations")) {
    redirect("/crm");
  }

  const tenantId = session.user?.tenantId ?? (await getDefaultTenantId());
  const [installation, puestosActivos, quotesInstalacion] = await Promise.all([
    prisma.crmInstallation.findFirst({
      where: { id, tenantId },
      include: { account: { select: { id: true, name: true } } },
    }),
    prisma.opsPuestoOperativo.findMany({
      where: { tenantId, installationId: id, active: true },
      orderBy: [{ createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        shiftStart: true,
        shiftEnd: true,
        weekdays: true,
        requiredGuards: true,
        teMontoClp: true,
      },
    }),
    prisma.cpqQuote.findMany({
      where: { tenantId, installationId: id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        code: true,
        status: true,
        totalPositions: true,
        totalGuards: true,
        updatedAt: true,
      },
      take: 20,
    }),
  ]);

  if (!installation) {
    redirect("/crm/installations");
  }

  const data = JSON.parse(
    JSON.stringify({
      ...installation,
      puestosActivos,
      quotesInstalacion,
    })
  );

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
      <CrmSubnav role={role} />
      <CrmInstallationDetailClient installation={data} />
    </>
  );
}
