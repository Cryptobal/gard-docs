"use client";

import { SubNav } from "@/components/opai/SubNav";
import { getVisibleConfigNavItems } from "@/lib/module-access";

export function ConfigSubnav({ role }: { role: string }) {
  const items = getVisibleConfigNavItems(role);
  return <SubNav items={items} />;
}
