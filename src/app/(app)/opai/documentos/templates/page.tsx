import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DocumentosSubnav } from "@/components/opai/DocumentosSubnav";
import { DocTemplatesClient } from "@/components/docs/DocTemplatesClient";
import { hasDocsSubmoduleAccess } from "@/lib/module-access";

export default async function DocTemplatesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/opai/login?callbackUrl=/opai/documentos/templates");
  }

  if (!hasDocsSubmoduleAccess(session.user.role, "templates")) {
    redirect("/opai/inicio");
  }

  return (
    <>
      <DocumentosSubnav />
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <DocTemplatesClient />
      </div>
    </>
  );
}
