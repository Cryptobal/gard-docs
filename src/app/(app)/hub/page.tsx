/**
 * Hub OPAI - Inicio comercial
 *
 * Dashboard operativo enfocado en conversión:
 * - Leads abiertos y conversión a negocio
 * - Propuestas enviadas y tasa de cierre
 * - Seguimientos pendientes y vencidos
 */

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDefaultTenantId } from '@/lib/tenant';
import { hasAppAccess } from '@/lib/app-access';
import {
  hasConfigSubmoduleAccess,
  hasCrmSubmoduleAccess,
  hasDocsSubmoduleAccess,
} from '@/lib/module-access';
import { timeAgo } from '@/lib/utils';
import { PageHeader } from '@/components/opai';
import { KpiCard } from '@/components/opai/KpiCard';
import { CrmGlobalSearch } from '@/components/crm/CrmGlobalSearch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { 
  AlertTriangle,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  FileText, 
  Plus,
  Mail,
  Send,
  Target,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HubPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/opai/login?callbackUrl=/hub');
  }

  const role = session.user.role;
  if (!hasAppAccess(role, 'hub')) {
    redirect('/opai/inicio');
  }

  const tenantId = session.user.tenantId ?? await getDefaultTenantId();
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const canUseCrmOverview = hasCrmSubmoduleAccess(role, 'overview');
  const canUseDocsOverview = hasDocsSubmoduleAccess(role, 'overview');
  const canUseCrmSearch = canUseCrmOverview;
  const canOpenLeads = hasCrmSubmoduleAccess(role, 'leads');
  const canOpenDeals = hasCrmSubmoduleAccess(role, 'deals');
  const canOpenQuotes = hasCrmSubmoduleAccess(role, 'quotes');
  const canCreateProposal = hasDocsSubmoduleAccess(role, 'document_editor');
  const canConfigureCrm = hasConfigSubmoduleAccess(role, 'crm');

  const docsSignals = canUseDocsOverview
    ? await getDocsSignals(tenantId, thirtyDaysAgo)
    : null;

  const crmMetrics = canUseCrmOverview
    ? await getCommercialMetrics(tenantId, thirtyDaysAgo, now)
    : null;

  const greetingHour = now.getHours();
  const greeting =
    greetingHour < 12
      ? 'Buenos días'
      : greetingHour < 20
        ? 'Buenas tardes'
        : 'Buenas noches';
  const firstName = session.user.name?.split(' ')[0] || 'Usuario';
  const subtitle = crmMetrics
    ? crmMetrics.followUpsOverdueCount > 0
      ? `Tienes ${crmMetrics.pendingLeadsCount} leads abiertos y ${crmMetrics.followUpsOverdueCount} seguimientos vencidos.`
      : `${crmMetrics.pendingLeadsCount} leads abiertos · ${crmMetrics.openDealsInFollowUpCount} negocios en seguimiento.`
    : docsSignals
      ? `${docsSignals.unread30} propuestas sin abrir en los últimos 30 días.`
      : 'Centro de control operacional.';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, ${firstName}`}
        description={subtitle}
      />

      <div className="flex flex-wrap gap-2">
        {canOpenLeads && (
          <Link href="/crm/leads">
            <Button size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Nuevo Lead
            </Button>
          </Link>
        )}
        {canOpenDeals && (
          <Link href="/crm/deals">
            <Button variant="outline" size="sm" className="gap-2">
              <BriefcaseBusiness className="h-4 w-4" />
              Ver Pipeline
            </Button>
          </Link>
        )}
        {canOpenQuotes && (
          <Link href="/crm/cotizaciones">
            <Button variant="outline" size="sm" className="gap-2">
              <Send className="h-4 w-4" />
              Cotizaciones
            </Button>
          </Link>
        )}
        {canCreateProposal && (
          <Link href="/opai/templates">
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Propuesta
            </Button>
          </Link>
        )}
      </div>

      {canUseCrmSearch && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Buscador CRM</CardTitle>
            <CardDescription>
              Busca contactos, cuentas, negocios, cotizaciones e instalaciones sin salir de Inicio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CrmGlobalSearch />
          </CardContent>
        </Card>
      )}

      {crmMetrics ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
            <KpiLinkCard
              href="/crm/leads?status=pending"
              title="Leads Abiertos"
              value={crmMetrics.pendingLeadsCount}
              icon={<Users className="h-4 w-4" />}
              description={`${crmMetrics.leadsCreated30} nuevos en 30 días`}
              variant="sky"
            />
            <KpiLinkCard
              href="/crm/leads?status=approved"
              title="Conv. Lead → Negocio"
              value={`${crmMetrics.leadToDealRate30}%`}
              icon={<Target className="h-4 w-4" />}
              trend={crmMetrics.leadToDealRate30 >= 35 ? 'up' : crmMetrics.leadToDealRate30 >= 20 ? 'neutral' : 'down'}
              trendValue={`${crmMetrics.leadsConverted30}/${crmMetrics.leadsCreated30} en 30 días`}
              variant="teal"
              titleInfoTooltip="Leads creados en 30 días que terminaron convertidos a negocio."
            />
            <KpiLinkCard
              href="/crm/deals?focus=proposals-sent-30d"
              title="Propuestas Enviadas"
              value={crmMetrics.proposalsSent30}
              icon={<Send className="h-4 w-4" />}
              description="Últimos 30 días"
              variant="blue"
            />
            <KpiLinkCard
              href="/crm/deals?focus=won-after-proposal-30d"
              title="Tasa Propuesta → Ganado"
              value={`${crmMetrics.proposalToWonRate30}%`}
              icon={<CheckCircle2 className="h-4 w-4" />}
              trend={crmMetrics.proposalToWonRate30 >= 25 ? 'up' : crmMetrics.proposalToWonRate30 >= 10 ? 'neutral' : 'down'}
              trendValue={`${crmMetrics.wonDealsWithProposal30}/${crmMetrics.proposalsSent30} en 30 días`}
              variant="emerald"
              titleInfoTooltip="Negocios movidos a etapa ganada en 30 días, sobre propuestas enviadas en el mismo período."
            />
            <KpiLinkCard
              href="/crm/deals?focus=followup-open"
              title="Negocios en Seguimiento"
              value={crmMetrics.openDealsInFollowUpCount}
              icon={<BriefcaseBusiness className="h-4 w-4" />}
              description={`${crmMetrics.followUpCoverageRate}% con seguimiento activo`}
              variant="purple"
            />
            <KpiLinkCard
              href="/crm/deals?focus=followup-overdue"
              title="Seguimientos Vencidos"
              value={crmMetrics.followUpsOverdueCount}
              icon={<AlertTriangle className="h-4 w-4" />}
              trend={crmMetrics.followUpsOverdueCount > 0 ? 'down' : 'up'}
              trendValue={
                crmMetrics.followUpsFailed30 > 0
                  ? `${crmMetrics.followUpsFailed30} fallidos en 30 días`
                  : 'Sin fallos recientes'
              }
              variant={crmMetrics.followUpsOverdueCount > 0 ? 'amber' : 'emerald'}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Embudo comercial (30 días)</CardTitle>
              <CardDescription>
                Conversión de leads hacia propuestas y cierre de negocios.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {crmMetrics.funnel.map((step) => (
                  <Link
                    key={step.label}
                    href={step.href}
                    className="rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent/40"
                  >
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {step.label}
                    </p>
                    <p className="mt-1 text-2xl font-semibold">{step.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {step.rateFromPrev == null
                        ? 'Base del periodo'
                        : `${step.rateFromPrev}% desde etapa anterior`}
                    </p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Leads abiertos</CardTitle>
                <CardDescription>
                  Prospectos pendientes de revisar y aprobar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {crmMetrics.openLeads.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No hay leads pendientes.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {crmMetrics.openLeads.map((lead: {
                      id: string;
                      source: string | null;
                      firstName: string | null;
                      lastName: string | null;
                      email: string | null;
                      companyName: string | null;
                      createdAt: Date;
                    }) => (
                      <Link
                        key={lead.id}
                        href="/crm/leads"
                        className="block rounded-lg border border-border p-3 transition-colors hover:bg-accent/30"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {lead.companyName?.trim() || 'Empresa sin nombre'}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {formatPersonName(lead.firstName, lead.lastName)}
                            </p>
                            <p className="truncate text-xs text-muted-foreground/80">
                              {lead.email || 'Sin email'}
                            </p>
                          </div>
                          <Badge variant="outline" className="shrink-0 text-[10px]">
                            {timeAgo(lead.createdAt)}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <Badge variant="secondary" className="text-[10px]">
                            {formatLeadSource(lead.source)}
                          </Badge>
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                            Revisar
                            <ChevronRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">Seguimiento de negocios</CardTitle>
                  {canConfigureCrm && (
                    <Link
                      href="/opai/configuracion/crm#seguimientos-automaticos"
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Configurar 1er y 2do seguimiento
                    </Link>
                  )}
                </div>
                <CardDescription>
                  {crmMetrics.overdueFollowUps.length > 0
                    ? 'Priorizando seguimientos vencidos y para hoy.'
                    : 'Próximos seguimientos programados.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {crmMetrics.followUpQueue.length > 0 ? (
                  <div className="space-y-2">
                    {crmMetrics.followUpQueue.map((log: {
                      id: string;
                      sequence: number;
                      scheduledAt: Date;
                      deal: {
                        id: string;
                        title: string;
                        account: { name: string } | null;
                        primaryContact: { firstName: string; lastName: string } | null;
                      };
                    }) => {
                      const scheduleState = getScheduleState(log.scheduledAt, now);
                      const contactName = formatPersonName(
                        log.deal.primaryContact?.firstName,
                        log.deal.primaryContact?.lastName
                      );

                      return (
                        <Link
                          key={log.id}
                          href={`/crm/deals/${log.deal.id}`}
                          className="block rounded-lg border border-border p-3 transition-colors hover:bg-accent/30"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {log.deal.account?.name || 'Cuenta sin nombre'}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {log.deal.title}
                              </p>
                              <p className="truncate text-xs text-muted-foreground/80">
                                {contactName}
                              </p>
                            </div>
                            <Badge variant="outline" className={scheduleState.className}>
                              {scheduleState.label}
                            </Badge>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>
                              {formatScheduleDate(log.scheduledAt)} · Seguimiento #{log.sequence}
                            </span>
                            <span className="inline-flex items-center gap-1 text-primary">
                              Abrir
                              <ChevronRight className="h-3.5 w-3.5" />
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : crmMetrics.dealsWithoutPendingFollowUp.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-amber-500">
                      Hay {crmMetrics.dealsWithoutPendingFollowUpCount} negocios con propuesta enviada sin seguimiento pendiente.
                    </p>
                    {crmMetrics.dealsWithoutPendingFollowUp.map((deal: {
                      id: string;
                      title: string;
                      proposalSentAt: Date | null;
                      account: { name: string } | null;
                    }) => (
                      <Link
                        key={deal.id}
                        href={`/crm/deals/${deal.id}`}
                        className="block rounded-lg border border-border p-3 transition-colors hover:bg-accent/30"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {deal.account?.name || 'Cuenta sin nombre'}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">{deal.title}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-500">
                            Sin seguimiento
                          </Badge>
                        </div>
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          Propuesta enviada {deal.proposalSentAt ? timeAgo(deal.proposalSentAt) : 'sin fecha'}.
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No hay seguimientos pendientes.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {docsSignals && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Engagement de propuestas (documentos)
                </CardTitle>
                <CardDescription>
                  Señales de apertura para priorizar seguimiento comercial.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <CompactStat label="Enviadas" value={docsSignals.sent30} />
                  <CompactStat label="Abiertas" value={docsSignals.viewed30} />
                  <CompactStat label="Sin abrir" value={docsSignals.unread30} />
                  <CompactStat label="Tasa de apertura" value={`${docsSignals.viewRate30}%`} />
                </div>
                <div>
                  <Link href="/opai/inicio" className="text-xs font-medium text-primary hover:underline">
                    Ver detalle de documentos y trazabilidad de envíos
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : docsSignals ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <KpiLinkCard
              href="/opai/inicio"
              title="Propuestas enviadas"
              value={docsSignals.sent30}
              icon={<Send className="h-4 w-4" />}
              description="Últimos 30 días"
              variant="blue"
            />
            <KpiLinkCard
              href="/opai/inicio"
              title="Propuestas abiertas"
              value={docsSignals.viewed30}
              icon={<FileText className="h-4 w-4" />}
              description={`${docsSignals.viewRate30}% de apertura`}
              variant="emerald"
            />
            <KpiLinkCard
              href="/opai/inicio"
              title="Sin abrir"
              value={docsSignals.unread30}
              icon={<AlertTriangle className="h-4 w-4" />}
              trend={docsSignals.unread30 > 0 ? 'down' : 'up'}
              trendValue="Requiere seguimiento"
              variant={docsSignals.unread30 > 0 ? 'amber' : 'teal'}
            />
            <KpiLinkCard
              href="/opai/inicio"
              title="Tasa de apertura"
              value={`${docsSignals.viewRate30}%`}
              icon={<TrendingUp className="h-4 w-4" />}
              variant="indigo"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inicio comercial</CardTitle>
              <CardDescription>
                Tu rol no tiene acceso al detalle CRM. Mantienes visibilidad de envíos y aperturas de propuestas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/opai/inicio" className="text-sm font-medium text-primary hover:underline">
                Ir a Documentos Comerciales
              </Link>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sin datos disponibles</CardTitle>
            <CardDescription>
              No hay acceso a módulos de Inicio para este rol.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}

async function getDocsSignals(tenantId: string, thirtyDaysAgo: Date) {
  const [sent30, viewed30, unread30] = await Promise.all([
    prisma.presentation.count({
      where: {
        tenantId,
        status: 'sent',
        emailSentAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.presentation.count({
      where: {
        tenantId,
        status: 'sent',
        emailSentAt: { gte: thirtyDaysAgo },
        viewCount: { gt: 0 },
      },
    }),
    prisma.presentation.count({
      where: {
        tenantId,
        status: 'sent',
        emailSentAt: { gte: thirtyDaysAgo },
        viewCount: 0,
      },
    }),
  ]);

  return {
    sent30,
    viewed30,
    unread30,
    viewRate30: toPercent(viewed30, sent30),
  };
}

async function getCommercialMetrics(tenantId: string, thirtyDaysAgo: Date, now: Date) {
  const [
    pendingLeadsCount,
    leadsCreated30,
    leadsConverted30,
    proposalsSent30,
    openDealsInFollowUpCount,
    followUpsOverdueCount,
    followUpsFailed30,
    dealsWithoutPendingFollowUpCount,
    openLeads,
    overdueFollowUps,
    upcomingFollowUps,
    dealsWithoutPendingFollowUp,
    wonDealsWithProposal30Rows,
  ] = await Promise.all([
    prisma.crmLead.count({
      where: { tenantId, status: 'pending' },
    }),
    prisma.crmLead.count({
      where: { tenantId, createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.crmLead.count({
      where: {
        tenantId,
        createdAt: { gte: thirtyDaysAgo },
        convertedDealId: { not: null },
      },
    }),
    prisma.crmDeal.count({
      where: {
        tenantId,
        proposalSentAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.crmDeal.count({
      where: {
        tenantId,
        status: 'open',
        proposalSentAt: { not: null },
      },
    }),
    prisma.crmFollowUpLog.count({
      where: {
        tenantId,
        status: 'pending',
        scheduledAt: { lte: now },
      },
    }),
    prisma.crmFollowUpLog.count({
      where: {
        tenantId,
        status: 'failed',
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.crmDeal.count({
      where: {
        tenantId,
        status: 'open',
        proposalSentAt: { not: null },
        followUpLogs: { none: { status: 'pending' } },
      },
    }),
    prisma.crmLead.findMany({
      where: { tenantId, status: 'pending' },
      orderBy: { createdAt: 'asc' },
      take: 8,
      select: {
        id: true,
        source: true,
        firstName: true,
        lastName: true,
        email: true,
        companyName: true,
        createdAt: true,
      },
    }),
    prisma.crmFollowUpLog.findMany({
      where: {
        tenantId,
        status: 'pending',
        scheduledAt: { lte: now },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 8,
      select: {
        id: true,
        sequence: true,
        scheduledAt: true,
        deal: {
          select: {
            id: true,
            title: true,
            account: { select: { name: true } },
            primaryContact: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    }),
    prisma.crmFollowUpLog.findMany({
      where: {
        tenantId,
        status: 'pending',
        scheduledAt: { gt: now },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 8,
      select: {
        id: true,
        sequence: true,
        scheduledAt: true,
        deal: {
          select: {
            id: true,
            title: true,
            account: { select: { name: true } },
            primaryContact: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    }),
    prisma.crmDeal.findMany({
      where: {
        tenantId,
        status: 'open',
        proposalSentAt: { not: null },
        followUpLogs: { none: { status: 'pending' } },
      },
      orderBy: { proposalSentAt: 'asc' },
      take: 8,
      select: {
        id: true,
        title: true,
        proposalSentAt: true,
        account: { select: { name: true } },
      },
    }),
    prisma.crmDealStageHistory.findMany({
      where: {
        tenantId,
        changedAt: { gte: thirtyDaysAgo },
        toStage: { is: { isClosedWon: true } },
        deal: { is: { proposalSentAt: { not: null } } },
      },
      select: { dealId: true },
      distinct: ['dealId'],
    }),
  ]);

  const wonDealsWithProposal30 = wonDealsWithProposal30Rows.length;
  const leadToDealRate30 = toPercent(leadsConverted30, leadsCreated30);
  const proposalToWonRate30 = toPercent(wonDealsWithProposal30, proposalsSent30);
  const followUpCoverageRate = toPercent(
    Math.max(0, openDealsInFollowUpCount - dealsWithoutPendingFollowUpCount),
    openDealsInFollowUpCount
  );

  const funnel = [
    {
      label: 'Leads nuevos',
      value: leadsCreated30,
      href: '/crm/leads',
      rateFromPrev: null as number | null,
    },
    {
      label: 'Leads convertidos',
      value: leadsConverted30,
      href: '/crm/leads',
      rateFromPrev: toPercent(leadsConverted30, leadsCreated30),
    },
    {
      label: 'Propuestas enviadas',
      value: proposalsSent30,
      href: '/crm/deals',
      rateFromPrev: toPercent(proposalsSent30, leadsConverted30),
    },
    {
      label: 'Negocios ganados',
      value: wonDealsWithProposal30,
      href: '/crm/deals',
      rateFromPrev: toPercent(wonDealsWithProposal30, proposalsSent30),
    },
  ];

  return {
    pendingLeadsCount,
    leadsCreated30,
    leadsConverted30,
    leadToDealRate30,
    proposalsSent30,
    wonDealsWithProposal30,
    proposalToWonRate30,
    openDealsInFollowUpCount,
    followUpsOverdueCount,
    followUpsFailed30,
    followUpCoverageRate,
    dealsWithoutPendingFollowUpCount,
    openLeads,
    overdueFollowUps,
    followUpQueue: overdueFollowUps.length > 0 ? overdueFollowUps : upcomingFollowUps,
    dealsWithoutPendingFollowUp,
    funnel,
  };
}

function KpiLinkCard({
  href,
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
  variant = 'default',
  titleInfoTooltip,
}: {
  href: string;
  title: string;
  value: string | number;
  description?: string;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'blue' | 'emerald' | 'purple' | 'amber' | 'indigo' | 'sky' | 'teal';
  titleInfoTooltip?: string;
}) {
  return (
    <Link href={href} className="block min-w-0">
      <KpiCard
        title={title}
        value={value}
        description={description}
        icon={icon}
        trend={trend}
        trendValue={trendValue}
        variant={variant}
        titleInfoTooltip={titleInfoTooltip}
        className="h-full cursor-pointer transition-all hover:ring-2 hover:ring-primary/25"
      />
    </Link>
  );
}

function CompactStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function toPercent(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function formatPersonName(firstName?: string | null, lastName?: string | null): string {
  const fullName = `${firstName || ''} ${lastName || ''}`.trim();
  return fullName || 'Sin contacto';
}

function formatLeadSource(source?: string | null): string {
  if (!source) return 'Sin fuente';

  if (source === 'web_cotizador') return 'Cotizador Web';
  if (source === 'web_cotizador_inteligente') return 'Cotizador IA';

  return source;
}

function getScheduleState(scheduledAt: Date, now: Date) {
  const diffMs = scheduledAt.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      label: 'Vencido',
      className: 'text-[10px] border-red-500/30 text-red-500',
    };
  }

  if (diffMs <= 24 * 60 * 60 * 1000) {
    return {
      label: 'Hoy',
      className: 'text-[10px] border-amber-500/30 text-amber-500',
    };
  }

  return {
    label: 'Próximo',
    className: 'text-[10px] border-emerald-500/30 text-emerald-500',
  };
}

function formatScheduleDate(date: Date): string {
  return date.toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
