import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAppAccess } from "@/lib/app-access";
import { getDefaultTenantId } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/opai";
import { OpsSubnav } from "@/components/ops";
import { OpsMarcacionesClient } from "@/components/ops/OpsMarcacionesClient";

export default async function OpsMarcacionesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/opai/login?callbackUrl=/ops/marcaciones");
  }
  const role = session.user.role;
  if (!hasAppAccess(role, "ops")) {
    redirect("/hub");
  }

  const tenantId = session.user.tenantId ?? (await getDefaultTenantId());

  // Cargar clientes con instalaciones activas para el filtro
  const clients = await prisma.crmAccount.findMany({
    where: {
      tenantId,
      type: "client",
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      installations: {
        where: { isActive: true },
        select: { id: true, name: true, marcacionCode: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marcaciones"
        description="Registro de marcaciones de asistencia digital. Conforme a Res. Exenta N°38 — DT Chile."
      />
      <OpsSubnav />
      <OpsMarcacionesClient
        initialClients={JSON.parse(JSON.stringify(clients))}
      />
    </div>
  );
}
