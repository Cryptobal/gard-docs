/**
 * CPQ - Configure, Price, Quote
 */

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasAppAccess } from "@/lib/app-access";
import { prisma } from "@/lib/prisma";
import { getDefaultTenantId } from "@/lib/tenant";
import { CpqDashboard } from "@/components/cpq/CpqDashboard";

export default async function CPQPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/opai/login?callbackUrl=/cpq");
  }

  if (!hasAppAccess(session.user.role, "cpq")) {
    redirect("/hub");
  }

  const tenantId = session.user?.tenantId ?? (await getDefaultTenantId());
  const quotes = await prisma.cpqQuote.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });

  const initialQuotes = JSON.parse(JSON.stringify(quotes));
  return <CpqDashboard initialQuotes={initialQuotes} />;
}
