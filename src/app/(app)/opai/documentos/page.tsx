import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DocumentosSubnav } from "@/components/opai/DocumentosSubnav";
import { DocsClient } from "@/components/docs/DocsClient";
import { hasDocsSubmoduleAccess } from "@/lib/module-access";

export default async function DocumentosPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/opai/login?callbackUrl=/opai/documentos");
  }

  if (!hasDocsSubmoduleAccess(session.user.role, "documents")) {
    redirect("/opai/inicio");
  }

  return (
    <>
      <DocumentosSubnav />
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <DocsClient />
      </div>
    </>
  );
}
