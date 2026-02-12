import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAppAccess } from "@/lib/app-access";
import { getDefaultTenantId } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/opai";
import { OpsPautaMensualClient, OpsSubnav } from "@/components/ops";

export default async function OpsPautaMensualPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/opai/login?callbackUrl=/ops/pauta-mensual");
  }
  const role = session.user.role;
  if (!hasAppAccess(role, "ops")) {
    redirect("/hub");
  }

  const tenantId = session.user.tenantId ?? (await getDefaultTenantId());

  const [clients, guardias, shiftPatterns] = await Promise.all([
    prisma.crmAccount.findMany({
      where: {
        tenantId,
        type: "client",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        rut: true,
        installations: {
          where: { isActive: true },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.opsGuardia.findMany({
      where: {
        tenantId,
        status: "active",
        isBlacklisted: false,
      },
      select: {
        id: true,
        code: true,
        persona: {
          select: {
            firstName: true,
            lastName: true,
            rut: true,
          },
        },
      },
      orderBy: [{ persona: { lastName: "asc" } }],
    }),
    prisma.cpqRol.findMany({
      where: { active: true, patternWork: { not: null }, patternOff: { not: null } },
      select: { id: true, name: true, patternWork: true, patternOff: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pauta mensual"
        description="Genera el plan del mes y asigna guardias por puesto y día."
      />
      <OpsSubnav />
      <OpsPautaMensualClient
        initialClients={JSON.parse(JSON.stringify(clients))}
        guardias={JSON.parse(JSON.stringify(guardias))}
        shiftPatterns={JSON.parse(JSON.stringify(shiftPatterns))}
      />
    </div>
  );
}
