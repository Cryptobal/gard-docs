import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAppAccess } from "@/lib/app-access";
import { getDefaultTenantId } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/opai";
import { OpsSubnav, OpsPuestosClient } from "@/components/ops";

export default async function OpsPuestosPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/opai/login?callbackUrl=/ops/puestos");
  }
  const role = session.user.role;
  if (!hasAppAccess(role, "ops")) {
    redirect("/hub");
  }

  const tenantId = session.user.tenantId ?? (await getDefaultTenantId());

  const [installations, puestos] = await Promise.all([
    prisma.crmInstallation.findMany({
      where: {
        tenantId,
        account: { type: "client" },
      },
      select: { id: true, name: true, teMontoClp: true },
      orderBy: { name: "asc" },
    }),
    prisma.opsPuestoOperativo.findMany({
      where: { tenantId },
      include: {
        installation: {
          select: { id: true, name: true, teMontoClp: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Puestos operativos"
        description="Define estructura por instalación, turnos y monto de turno extra."
      />
      <OpsSubnav />
      <OpsPuestosClient
        initialInstallations={JSON.parse(JSON.stringify(installations))}
        initialPuestos={JSON.parse(JSON.stringify(puestos))}
      />
    </div>
  );
}
