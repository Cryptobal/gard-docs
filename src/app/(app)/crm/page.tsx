/**
 * CRM - Customer Relationship Management
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { hasCrmSubmoduleAccess } from '@/lib/module-access';
import { getDefaultTenantId } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import { PageHeader } from '@/components/opai';
import { CrmSubnav } from '@/components/crm/CrmSubnav';
import Link from 'next/link';
import { Users, Building, TrendingUp, Contact, DollarSign, FileText, ChevronRight, MapPin } from 'lucide-react';

type CrmModuleCard = {
  key: Parameters<typeof hasCrmSubmoduleAccess>[1] | null;
  title: string;
  description: string;
  icon: typeof Users;
  href: string;
  color: string;
  countKey: 'leads' | 'accounts' | 'installations' | 'deals' | 'contacts' | 'quotes' | null;
  disabled?: boolean;
};

const modules: CrmModuleCard[] = [
  {
    key: 'leads' as const,
    title: 'Leads',
    description: 'Solicitudes entrantes y aprobación manual.',
    icon: Users,
    href: '/crm/leads',
    color: 'text-emerald-400 bg-emerald-400/10',
    countKey: 'leads' as const,
  },
  {
    key: 'accounts' as const,
    title: 'Cuentas',
    description: 'Prospectos y clientes.',
    icon: Building,
    href: '/crm/accounts',
    color: 'text-blue-400 bg-blue-400/10',
    countKey: null,
  },
  {
    key: 'installations' as const,
    title: 'Instalaciones',
    description: 'Sedes y ubicaciones de clientes.',
    icon: MapPin,
    href: '/crm/installations',
    color: 'text-teal-400 bg-teal-400/10',
    countKey: null,
  },
  {
    key: 'deals' as const,
    title: 'Negocios',
    description: 'Oportunidades y pipeline.',
    icon: TrendingUp,
    href: '/crm/deals',
    color: 'text-purple-400 bg-purple-400/10',
    countKey: null,
  },
  {
    key: 'contacts' as const,
    title: 'Contactos',
    description: 'Personas clave por cliente.',
    icon: Contact,
    href: '/crm/contacts',
    color: 'text-sky-400 bg-sky-400/10',
    countKey: null,
  },
  {
    key: 'quotes' as const,
    title: 'Cotizaciones',
    description: 'Configurador de precios CPQ.',
    icon: DollarSign,
    href: '/crm/cotizaciones',
    color: 'text-amber-400 bg-amber-400/10',
    countKey: null,
  },
  {
    key: null,
    title: 'Reportes',
    description: 'Métricas y conversiones.',
    icon: FileText,
    href: '#',
    color: 'text-muted-foreground bg-muted',
    disabled: true,
    countKey: null,
  },
];

export default async function CRMPage() {
  const session = await auth();
  if (!session?.user) redirect('/opai/login?callbackUrl=/crm');
  const role = session.user.role;
  if (!hasCrmSubmoduleAccess(role, 'overview')) redirect('/hub');

  const tenantId = session.user?.tenantId ?? (await getDefaultTenantId());

  const leadsCount = await prisma.crmLead.count({ where: { tenantId } });

  const counts: Record<string, number> = {
    leads: leadsCount,
  };
  const visibleModules = modules.filter(
    (mod) =>
      mod.disabled ||
      (mod.key !== null && hasCrmSubmoduleAccess(role, mod.key))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM"
        description="Pipeline comercial y gestión de clientes"
      />

      <CrmSubnav role={role} />

      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {visibleModules.map((mod) => {
          const Icon = mod.icon;
          const count = mod.countKey ? counts[mod.countKey] ?? 0 : null;
          const inner = (
            <div
              key={mod.title}
              className={`group flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-all ${
                mod.disabled
                  ? 'opacity-40 cursor-default'
                  : 'hover:border-border/80 hover:bg-accent/40 hover:shadow-md cursor-pointer'
              }`}
            >
              <div className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${mod.color}`}>
                <Icon className="h-4 w-4" />
                {!mod.disabled && count !== null && (
                  <span
                    className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold text-background"
                    title={`Total: ${count}`}
                  >
                    {count > 999 ? '999+' : count}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{mod.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>
              </div>
              {!mod.disabled && (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
              )}
            </div>
          );

          if (mod.disabled) return inner;
          return <Link key={mod.title} href={mod.href}>{inner}</Link>;
        })}
      </div>
    </div>
  );
}
