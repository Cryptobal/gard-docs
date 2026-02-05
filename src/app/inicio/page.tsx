/**
 * Dashboard Administrativo - Gard Docs
 * 
 * Panel principal para ver y gestionar presentaciones enviadas
 * Protegido por Auth.js; datos filtrados por tenantId de la sesión.
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDefaultTenantId } from '@/lib/tenant';
import { DashboardContent } from '@/components/admin/DashboardContent';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login?callbackUrl=/inicio');
  const tenantId = session.user.tenantId ?? await getDefaultTenantId();

  const presentations = await prisma.presentation.findMany({
    where: { tenantId },
    include: {
      views: { orderBy: { viewedAt: 'desc' } },
      template: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calcular estadísticas
  const stats = {
    total: presentations.length,
    sent: presentations.filter((p) => p.status === 'sent').length,
    viewed: presentations.filter((p) => p.viewCount > 0).length, // Presentaciones ÚNICAS vistas
    pending: presentations.filter((p) => p.status === 'sent' && p.viewCount === 0).length, // Sin leer
    opened: presentations.filter((p) => p.openCount > 0).length,
    clicked: presentations.filter((p) => p.clickCount > 0).length,
    totalViews: presentations.reduce((sum, p) => sum + p.viewCount, 0), // Total de vistas (puede ser > que presentaciones)
    totalOpens: presentations.reduce((sum, p) => sum + p.openCount, 0),
    totalClicks: presentations.reduce((sum, p) => sum + p.clickCount, 0),
  };

  // Calcular tasa de conversión
  const conversionRate = stats.sent > 0 ? (stats.viewed / stats.sent) * 100 : 0;
  const openRate = stats.sent > 0 ? (stats.opened / stats.sent) * 100 : 0;
  const clickRate = stats.opened > 0 ? (stats.clicked / stats.opened) * 100 : 0;

  return (
    <DashboardContent 
      presentations={presentations}
      stats={stats}
      conversionRate={conversionRate}
      openRate={openRate}
      clickRate={clickRate}
    />
  );
}
