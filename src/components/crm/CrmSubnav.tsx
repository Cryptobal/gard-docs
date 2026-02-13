"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CrmGlobalSearch } from "./CrmGlobalSearch";
import { usePermissions } from "@/lib/permissions-context";
import { getVisibleSubmodules } from "@/lib/permissions";
import { SUBMODULE_TO_MODULE, CRM_MODULES } from "./CrmModuleIcons";

/**
 * CrmSubnav - Navegación de módulos CRM con iconos y buscador global.
 *
 * Desktop (sm+): pills horizontales con icono + label + search a la derecha.
 * Móvil: solo search bar (la navegación la maneja el BottomNav contextual).
 */
export function CrmSubnav({
  role,
  className,
}: {
  role: string;
  className?: string;
}) {
  const pathname = usePathname();
  const permissions = usePermissions();
  const visibleSubs = getVisibleSubmodules(permissions, "crm");
  const navItems = visibleSubs.map((s) => ({
    key: s.submodule,
    href: s.href,
    label: s.label,
  }));

  if (navItems.length === 0) {
    return null;
  }

  // Resolver icono para cada item del nav
  const getIcon = (key: string) => {
    const moduleKey = SUBMODULE_TO_MODULE[key];
    if (!moduleKey) return null;
    const config = CRM_MODULES[moduleKey];
    return config?.icon || null;
  };

  return (
    <nav className={cn("mb-6 space-y-3", className)}>
      {/* Móvil: solo search bar (nav via BottomNav) */}
      <div className="sm:hidden">
        <CrmGlobalSearch />
      </div>

      {/* Desktop: pills con icono + search en la misma línea */}
      <div className="hidden sm:flex sm:items-center sm:gap-3">
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide flex-1 min-w-0">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = getIcon(item.key);
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
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {item.label}
              </Link>
            );
          })}
        </div>
        <CrmGlobalSearch className="w-64 shrink-0" />
      </div>
    </nav>
  );
}
