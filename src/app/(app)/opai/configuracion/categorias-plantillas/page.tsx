import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/opai";
import { ConfigSubnav } from "@/components/opai/ConfigSubnav";
import { resolvePagePerms, canView } from "@/lib/permissions-server";
import { DocCategoriesClient } from "@/components/docs/DocCategoriesClient";

export default async function CategoriasPlantillasPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/opai/login?callbackUrl=/opai/configuracion/categorias-plantillas");
  }

  const perms = await resolvePagePerms(session.user);
  if (!canView(perms, "config", "categorias")) {
    redirect("/opai/configuracion");
  }

  const role = session.user.role;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorías de plantillas"
        description="Gestiona las categorías por módulo para Gestión Documental (documentos y mails)"
      />
      <ConfigSubnav role={role} />
      <DocCategoriesClient />
    </div>
  );
}
