import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DocumentosSubnav } from "@/components/opai/DocumentosSubnav";
import { DocDetailClient } from "@/components/docs/DocDetailClient";
import { hasDocsSubmoduleAccess } from "@/lib/module-access";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect(`/opai/login?callbackUrl=/opai/documentos/${id}`);
  }

  if (!hasDocsSubmoduleAccess(session.user.role, "documents")) {
    redirect("/opai/inicio");
  }

  return (
    <>
      <DocumentosSubnav />
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <DocDetailClient documentId={id} />
      </div>
    </>
  );
}
