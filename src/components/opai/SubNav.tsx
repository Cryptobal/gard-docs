"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export interface SubNavItem {
  href: string;
  label: string;
}

interface SubNavProps {
  items: SubNavItem[];
  className?: string;
}

/**
 * SubNav - Navegación secundaria horizontal reutilizable.
 *
 * Pills scrollables que muestran secciones dentro de un módulo.
 * Se usa en CRM, Configuración, Documentos, etc.
 */
export function SubNav({ items, className }: SubNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const activeItem =
    items.find((item) => pathname === item.href || pathname?.startsWith(item.href + "/")) ??
    items[0];

  return (
    <nav className={cn("mb-6", className)}>
      <div className="sm:hidden">
        <label htmlFor="subnav-select" className="sr-only">
          Sección
        </label>
        <select
          id="subnav-select"
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
          value={activeItem?.href}
          onChange={(e) => router.push(e.target.value)}
        >
          {items.map((item) => (
            <option key={item.href} value={item.href}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div className="hidden sm:flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
