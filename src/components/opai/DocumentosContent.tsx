'use client';

import { useState } from 'react';
import { KpiCard } from './KpiCard';
import { PresentationsList } from '@/components/admin/PresentationsList';
import { 
  FileText, 
  Send, 
  Eye, 
  Mail,
  TrendingUp,
} from 'lucide-react';

interface Stats {
  total: number;
  sent: number;
  viewed: number;
  pending: number;
  opened: number;
  clicked: number;
  totalViews: number;
  totalOpens: number;
  totalClicks: number;
}

interface DocumentosContentProps {
  presentations: any[];
  stats: Stats;
  conversionRate: number;
}

/**
 * DocumentosContent - Contenido de la página de Documentos
 * 
 * Client Component que maneja:
 * - Estado de filtro activo
 * - KPIs clickeables para filtrar
 * - Lista de presentaciones filtrada
 */
export function DocumentosContent({ presentations, stats, conversionRate }: DocumentosContentProps) {
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const handleKpiClick = (filter: string) => {
    setActiveFilter(activeFilter === filter ? 'all' : filter);
  };

  return (
    <>
      {/* KPI Cards - Clickeables para filtrar */}
      <div className="grid grid-cols-2 gap-3 sm:gap-3 sm:grid-cols-2 lg:grid-cols-5 mb-6">
        <button onClick={() => handleKpiClick('all')} className="w-full min-w-0 text-left">
          <KpiCard
            title="Total"
            value={stats.total}
            icon={<FileText className="h-4 w-4" />}
            trend="neutral"
            trendValue="Todas"
            className={activeFilter === 'all' ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-muted cursor-pointer'}
          />
        </button>
        
        <button onClick={() => handleKpiClick('sent')} className="w-full min-w-0 text-left">
          <KpiCard
            title="Enviadas"
            value={stats.sent}
            icon={<Send className="h-4 w-4" />}
            trend={stats.sent > 0 ? 'up' : 'neutral'}
            trendValue={`${stats.total > 0 ? ((stats.sent / stats.total) * 100).toFixed(0) : 0}% del total`}
            className={activeFilter === 'sent' ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-muted cursor-pointer'}
          />
        </button>
        
        <button onClick={() => handleKpiClick('viewed')} className="w-full min-w-0 text-left">
          <KpiCard
            title="Vistas"
            value={stats.viewed}
            icon={<Eye className="h-4 w-4" />}
            trend={stats.viewed > 0 ? 'up' : 'neutral'}
            trendValue={`${stats.totalViews} total`}
            className={activeFilter === 'viewed' ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-muted cursor-pointer'}
          />
        </button>
        
        <button onClick={() => handleKpiClick('pending')} className="w-full min-w-0 text-left">
          <KpiCard
            title="Sin Leer"
            value={stats.pending}
            icon={<Mail className="h-4 w-4" />}
            trend={stats.pending > 0 ? 'down' : 'up'}
            trendValue={`${stats.sent > 0 ? ((stats.pending / stats.sent) * 100).toFixed(0) : 0}%`}
            className={activeFilter === 'pending' ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-muted cursor-pointer'}
          />
        </button>
        
        <div className="text-left hidden sm:block">
          <KpiCard
            title="Conversión"
            value={`${conversionRate.toFixed(1)}%`}
            icon={<TrendingUp className="h-4 w-4" />}
            trend={conversionRate > 50 ? 'up' : conversionRate > 25 ? 'neutral' : 'down'}
            trendValue="Vista/Env"
          />
        </div>
      </div>

      {/* Presentations List con filtro */}
      <PresentationsList 
        presentations={presentations}
        initialFilter={activeFilter}
      />
    </>
  );
}
