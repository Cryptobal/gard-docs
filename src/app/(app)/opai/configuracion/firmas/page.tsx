import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageHeader, ConfigSubnav } from "@/components/opai";
import { prisma } from "@/lib/prisma";
import { getDefaultTenantId } from "@/lib/tenant";
import { SignatureManagerClient } from "@/components/crm/SignatureManagerClient";
import { hasConfigSubmoduleAccess } from "@/lib/module-access";

export default async function FirmasPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/opai/login?callbackUrl=/opai/configuracion/firmas");
  }

  const role = session.user.role;
  if (!hasConfigSubmoduleAccess(role, "signatures")) {
    redirect("/opai/configuracion");
  }

  const tenantId = session.user?.tenantId ?? (await getDefaultTenantId());

  const signatures = await prisma.crmEmailSignature.findMany({
    where: { tenantId, isActive: true },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  const initialSignatures = JSON.parse(JSON.stringify(signatures));

  return (
    <>
      <PageHeader
        title="Firmas de email"
        description="Gestiona las firmas que se incluyen al final de los correos enviados desde el CRM"
      />
      <ConfigSubnav role={role} />
      <SignatureManagerClient initialSignatures={initialSignatures} />
    </>
  );
}
