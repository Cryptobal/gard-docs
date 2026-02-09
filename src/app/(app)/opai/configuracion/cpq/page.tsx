import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/opai";
import { ConfigSubnav } from "@/components/opai";
import { CpqConfigTabs } from "@/components/cpq/CpqConfigTabs";

export default async function CpqConfigPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/opai/login?callbackUrl=/opai/configuracion/cpq");
  }

  const role = session.user.role;
  if (role !== "owner" && role !== "admin") {
    redirect("/hub");
  }

  return (
    <>
      <PageHeader
        title="Configuración CPQ"
        description="Catálogo, puestos, cargos, roles y parámetros de pricing"
      />
      <ConfigSubnav />
      <CpqConfigTabs />
    </>
  );
}
