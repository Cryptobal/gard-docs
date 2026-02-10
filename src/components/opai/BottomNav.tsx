'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Grid3x3,
  FileText,
  Building2,
  Calculator,
  Settings,
  Users,
  Contact,
  TrendingUp,
  DollarSign,
  MapPin,
} from 'lucide-react';
import { hasAppAccess } from '@/lib/app-access';
import { hasAnyConfigSubmoduleAccess, hasCrmSubmoduleAccess } from '@/lib/module-access';

const MAIN_NAV_ITEMS = [
  { href: '/hub', label: 'Inicio', icon: Grid3x3, app: 'hub' as const },
  { href: '/opai/inicio', label: 'Docs', icon: FileText, app: 'docs' as const },
  { href: '/crm', label: 'CRM', icon: Building2, app: 'crm' as const },
  { href: '/payroll', label: 'Payroll', icon: Calculator, app: 'payroll' as const },
  { href: '/opai/configuracion/integraciones', label: 'Config', icon: Settings, app: 'admin' as const },
];

const CRM_NAV_ITEMS = [
  { href: '/crm/leads', label: 'Leads', icon: Users, key: 'leads' as const },
  { href: '/crm/accounts', label: 'Cuentas', icon: Building2, key: 'accounts' as const },
  { href: '/crm/installations', label: 'Instalaciones', icon: MapPin, key: 'installations' as const },
  { href: '/crm/deals', label: 'Negocios', icon: TrendingUp, key: 'deals' as const },
  { href: '/crm/contacts', label: 'Contactos', icon: Contact, key: 'contacts' as const },
  { href: '/crm/cotizaciones', label: 'CPQ', icon: DollarSign, key: 'quotes' as const },
];

interface BottomNavProps {
  userRole?: string;
}

export function BottomNav({ userRole }: BottomNavProps) {
  const pathname = usePathname();
  const isCrm = pathname?.startsWith('/crm/');
  const visibleMainItems = MAIN_NAV_ITEMS.filter((item) => {
    if (!userRole) return false;
    if (item.app === 'admin') {
      return hasAnyConfigSubmoduleAccess(userRole);
    }
    return hasAppAccess(userRole, item.app);
  });
  const visibleCrmItems = CRM_NAV_ITEMS.filter((item) => {
    if (!userRole) return false;
    return hasCrmSubmoduleAccess(userRole, item.key);
  });
  const items = isCrm ? visibleCrmItems : visibleMainItems;

  if (items.length === 0) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:hidden">
      <div className="flex h-14 items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
