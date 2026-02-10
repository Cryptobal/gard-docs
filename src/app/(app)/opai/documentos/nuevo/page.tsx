import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DocumentosSubnav } from "@/components/opai/DocumentosSubnav";
import { DocGenerateClient } from "@/components/docs/DocGenerateClient";
import { Suspense } from "react";
import { hasDocsSubmoduleAccess } from "@/lib/module-access";

export default async function NewDocumentPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/opai/login?callbackUrl=/opai/documentos/nuevo");
  }

  if (!hasDocsSubmoduleAccess(session.user.role, "document_editor")) {
    redirect("/opai/documentos");
  }

  return (
    <>
      <DocumentosSubnav />
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <Suspense>
          <DocGenerateClient />
        </Suspense>
      </div>
    </>
  );
}
