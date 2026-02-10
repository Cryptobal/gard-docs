import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/opai";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ConfigSubnav } from "@/components/opai";
import { hasConfigSubmoduleAccess } from "@/lib/module-access";

export default async function ConfiguracionPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/opai/login?callbackUrl=/opai/configuracion");
  }

  const role = session.user.role;
  if (!hasConfigSubmoduleAccess(role, "overview")) {
    redirect("/hub");
  }

  const configCards = [
    {
      key: "users" as const,
      href: "/opai/configuracion/usuarios",
      title: "Usuarios",
      description: "Roles, accesos y seguridad.",
    },
    {
      key: "integrations" as const,
      href: "/opai/configuracion/integraciones",
      title: "Integraciones",
      description: "Gmail y conectores externos.",
    },
    {
      key: "email_templates" as const,
      href: "/opai/configuracion/email-templates",
      title: "Templates email",
      description: "Plantillas con placeholders.",
    },
    {
      key: "signatures" as const,
      href: "/opai/configuracion/firmas",
      title: "Firmas",
      description: "Firmas para correos salientes.",
    },
    {
      key: "crm" as const,
      href: "/opai/configuracion/crm",
      title: "CRM",
      description: "Pipeline y automatizaciones.",
    },
    {
      key: "cpq" as const,
      href: "/opai/configuracion/cpq",
      title: "Configuración CPQ",
      description: "Catálogo, parámetros y pricing.",
    },
    {
      key: "payroll" as const,
      href: "/opai/configuracion/payroll",
      title: "Payroll",
      description: "Parámetros y versiones.",
    },
  ].filter((card) => hasConfigSubmoduleAccess(role, card.key));

  return (
    <>
      <PageHeader
        title="Configuración"
        description="Administración global y por módulo"
      />
      <ConfigSubnav role={role} />
      <div className="grid gap-4 md:grid-cols-2">
        {configCards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="cursor-pointer transition hover:border-primary">
              <CardHeader>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
