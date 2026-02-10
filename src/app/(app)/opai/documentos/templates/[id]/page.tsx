import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DocumentosSubnav } from "@/components/opai/DocumentosSubnav";
import { DocTemplateEditorClient } from "@/components/docs/DocTemplateEditorClient";
import { hasDocsSubmoduleAccess } from "@/lib/module-access";

export default async function EditDocTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect(`/opai/login?callbackUrl=/opai/documentos/templates/${id}`);
  }

  if (!hasDocsSubmoduleAccess(session.user.role, "template_editor")) {
    redirect("/opai/documentos/templates");
  }

  return (
    <>
      <DocumentosSubnav />
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <DocTemplateEditorClient templateId={id} />
      </div>
    </>
  );
}
