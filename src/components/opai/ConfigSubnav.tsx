"use client";

import { SubNav, type SubNavItem } from "@/components/opai/SubNav";
import { getVisibleConfigNavItems, type ConfigSubmoduleKey } from "@/lib/module-access";
import {
  Users,
  Plug,
  PenLine,
  FolderTree,
  TrendingUp,
  DollarSign,
  Calculator,
  Bell,
  ClipboardList,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Mapeo de config submodule key → icono */
const CONFIG_ICONS: Record<ConfigSubmoduleKey, LucideIcon> = {
  overview: Users,
  users: Users,
  integrations: Plug,
  signatures: PenLine,
  doc_categories: FolderTree,
  crm: TrendingUp,
  cpq: DollarSign,
  payroll: Calculator,
  notifications: Bell,
  ops: ClipboardList,
};

export function ConfigSubnav({ role }: { role: string }) {
  const rawItems = getVisibleConfigNavItems(role);

  const items: SubNavItem[] = rawItems.map((item) => ({
    href: item.href,
    label: item.label,
    icon: CONFIG_ICONS[item.key] ?? undefined,
  }));

  return <SubNav items={items} />;
}
