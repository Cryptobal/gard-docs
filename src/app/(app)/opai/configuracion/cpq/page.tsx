import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/opai";
import { ConfigSubnav } from "@/components/opai/ConfigSubnav";
import { CpqConfigTabs } from "@/components/cpq/CpqConfigTabs";
import { resolvePagePerms, canView } from "@/lib/permissions-server";

export default async function CpqConfigPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/opai/login?callbackUrl=/opai/configuracion/cpq");
  }

  const perms = await resolvePagePerms(session.user);
  if (!canView(perms, "config", "cpq")) {
    redirect("/opai/configuracion");
  }

  const role = session.user.role;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración CPQ"
        description="Catálogo, puestos, cargos, roles y parámetros de pricing"
      />
      <ConfigSubnav role={role} />
      <CpqConfigTabs />
    </div>
  );
}
