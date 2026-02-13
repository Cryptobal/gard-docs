import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/opai";
import { hasConfigSubmoduleAccess } from "@/lib/module-access";
import Link from "next/link";
import {
  Users,
  Plug,
  PenLine,
  FolderTree,
  TrendingUp,
  Calculator,
  DollarSign,
  ChevronRight,
  Bell,
  ClipboardList,
} from "lucide-react";

type ConfigItem = {
  key: Parameters<typeof hasConfigSubmoduleAccess>[1];
  href: string;
  title: string;
  description: string;
  icon: typeof Users;
};

type ConfigSection = {
  title: string;
  items: ConfigItem[];
};

const CONFIG_SECTIONS: ConfigSection[] = [
  {
    title: "General",
    items: [
      {
        key: "users",
        href: "/opai/configuracion/usuarios",
        title: "Usuarios",
        description: "Roles, accesos y seguridad",
        icon: Users,
      },
      {
        key: "integrations",
        href: "/opai/configuracion/integraciones",
        title: "Integraciones",
        description: "Gmail y conectores externos",
        icon: Plug,
      },
      {
        key: "notifications",
        href: "/opai/configuracion/notificaciones",
        title: "Notificaciones",
        description: "Alertas, emails y campana por módulo",
        icon: Bell,
      },
    ],
  },
  {
    title: "Correos y Documentos",
    items: [
      {
        key: "signatures",
        href: "/opai/configuracion/firmas",
        title: "Firmas",
        description: "Firmas para correos salientes",
        icon: PenLine,
      },
      {
        key: "doc_categories",
        href: "/opai/configuracion/categorias-plantillas",
        title: "Categorías de plantillas",
        description: "Categorías por módulo para Gestión Documental",
        icon: FolderTree,
      },
    ],
  },
  {
    title: "Módulos",
    items: [
      {
        key: "crm",
        href: "/opai/configuracion/crm",
        title: "CRM",
        description: "Pipeline y automatizaciones",
        icon: TrendingUp,
      },
      {
        key: "cpq",
        href: "/opai/configuracion/cpq",
        title: "Cotizaciones (CPQ)",
        description: "Catálogo, parámetros y pricing",
        icon: DollarSign,
      },
      {
        key: "payroll",
        href: "/opai/configuracion/payroll",
        title: "Payroll",
        description: "Parámetros legales y versiones",
        icon: Calculator,
      },
      {
        key: "ops",
        href: "/opai/configuracion/ops",
        title: "Operaciones",
        description: "Marcaciones, emails automáticos y parámetros",
        icon: ClipboardList,
      },
    ],
  },
];

export default async function ConfiguracionPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/opai/login?callbackUrl=/opai/configuracion");
  }

  const role = session.user.role;
  if (!hasConfigSubmoduleAccess(role, "overview")) {
    redirect("/hub");
  }

  const visibleSections = CONFIG_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) =>
      hasConfigSubmoduleAccess(role, item.key)
    ),
  })).filter((section) => section.items.length > 0);

  return (
    <>
      <PageHeader
        title="Configuración"
        description="Administración global y por módulo"
      />

      <div className="space-y-6">
        {visibleSections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
              {section.title}
            </h2>
            <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-accent/40 active:bg-accent/60 group"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {item.description}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
