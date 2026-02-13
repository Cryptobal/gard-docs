"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { OpsGlobalSearch } from "./OpsGlobalSearch";
import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  UserRoundCheck,
  Clock3,
  ShieldAlert,
  Shield,
  Fingerprint,
} from "lucide-react";

const OPS_ITEMS = [
  { href: "/ops", label: "Inicio", icon: LayoutDashboard },
  { href: "/ops/puestos", label: "Puestos", icon: ClipboardList },
  { href: "/ops/pauta-mensual", label: "Pauta mensual", icon: CalendarDays },
  { href: "/ops/pauta-diaria", label: "Asistencia diaria", icon: UserRoundCheck },
  { href: "/ops/turnos-extra", label: "Turnos extra", icon: Clock3 },
  { href: "/ops/marcaciones", label: "Marcaciones", icon: Fingerprint },
  { href: "/ops/ppc", label: "PPC", icon: ShieldAlert },
  { href: "/personas/guardias", label: "Guardias", icon: Shield },
];

/**
 * OpsSubnav - Navegación del módulo Ops con buscador global.
 * Desktop: pills + buscador a la derecha. Móvil: solo buscador.
 */
export function OpsSubnav({ className }: { className?: string } = {}) {
  const pathname = usePathname();

  return (
    <nav className={cn("mb-6 space-y-3", className)}>
      <div className="sm:hidden">
        <OpsGlobalSearch />
      </div>
      <div className="hidden sm:flex sm:items-center sm:gap-3">
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide flex-1 min-w-0">
          {OPS_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors shrink-0",
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground border border-transparent"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
        <OpsGlobalSearch className="w-64 shrink-0" />
      </div>
    </nav>
  );
}
