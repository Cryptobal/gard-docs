import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/opai";
import { ConfigSubnav } from "@/components/opai/ConfigSubnav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resolvePagePerms, canView } from "@/lib/permissions-server";

export default async function PayrollConfigPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/opai/login?callbackUrl=/opai/configuracion/payroll");
  }

  const perms = await resolvePagePerms(session.user);
  if (!canView(perms, "config", "payroll")) {
    redirect("/opai/configuracion");
  }

  const role = session.user.role;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración Payroll"
        description="Parámetros y supuestos"
      />
      <ConfigSubnav role={role} />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Parámetros base</CardTitle>
            <CardDescription>UF, UTM y supuestos.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Próximo paso: editor de parámetros y versiones.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Versionado</CardTitle>
            <CardDescription>Historial y vigencia.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Próximo paso: control de vigencia por periodo.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
