"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { CrmGlobalSearch } from "./CrmGlobalSearch";
import { getVisibleCrmNavItems } from "@/lib/module-access";

/**
 * CrmSubnav - Navegación de módulos CRM con buscador global.
 *
 * Desktop: pills horizontales + search a la derecha.
 * Móvil: search + dropdown compacto.
 */
export function CrmSubnav({
  role,
  className,
}: {
  role: string;
  className?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navItems = getVisibleCrmNavItems(role);

  const activeItem = navItems.find(
    (item) => pathname === item.href || pathname?.startsWith(item.href + "/")
  );

  if (navItems.length === 0) {
    return null;
  }

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <nav className={cn("mb-6 space-y-3", className)}>
      {/* Móvil: search arriba */}
      <div className="sm:hidden">
        <CrmGlobalSearch />
      </div>

      {/* Desktop: pills + search en la misma línea */}
      <div className="hidden sm:flex sm:items-center sm:gap-3">
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide flex-1 min-w-0">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors shrink-0",
                  isActive
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground border border-transparent"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <CrmGlobalSearch className="w-64 shrink-0" />
      </div>

      {/* Móvil: dropdown compacto */}
      <div className="sm:hidden relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium w-full"
        >
          <span className="flex-1 text-left">
            {activeItem?.label || "Módulos CRM"}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </button>
        {open && (
          <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border border-border bg-card shadow-lg py-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "text-primary bg-primary/10 font-medium"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
