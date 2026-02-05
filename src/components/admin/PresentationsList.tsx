'use client';

/**
 * Presentations List
 * 
 * Lista de todas las presentaciones enviadas con:
 * - Filtros y búsqueda
 * - Links públicos
 * - Botón WhatsApp
 * - Analytics inline
 * - Mobile-first responsive
 */

import { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  Mail, 
  Eye, 
  MousePointer,
  Copy,
  Check,
  Calendar,
  Building2,
  User,
  FileText,
  MessageCircle,
  TrendingUp
} from 'lucide-react';
import { Presentation, Template, PresentationView } from '@prisma/client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { EmailStatusBadge } from './EmailStatusBadge';

type PresentationWithRelations = Presentation & {
  template: Template;
  views: PresentationView[];
};

interface PresentationsListProps {
  presentations: PresentationWithRelations[];
  initialFilter?: string;
}

export function PresentationsList({ presentations, initialFilter = 'all' }: PresentationsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewFilter, setViewFilter] = useState<string>('all'); // Nuevo filtro de vistas
  const [emailStatusFilter, setEmailStatusFilter] = useState<string>('all'); // Nuevo filtro de estado email
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtrar presentaciones
  const filteredPresentations = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const quarterAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

    return presentations.filter((p) => {
      // Filtro por búsqueda
      const clientData = p.clientData as any;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' || 
        clientData?.account?.Account_Name?.toLowerCase().includes(searchLower) ||
        clientData?.contact?.First_Name?.toLowerCase().includes(searchLower) ||
        clientData?.contact?.Last_Name?.toLowerCase().includes(searchLower) ||
        clientData?.quote?.Subject?.toLowerCase().includes(searchLower) ||
        p.recipientName?.toLowerCase().includes(searchLower) ||
        p.recipientEmail?.toLowerCase().includes(searchLower);

      // Filtro por vistas
      let matchesView = true;
      if (viewFilter === 'viewed') {
        matchesView = p.viewCount > 0;
      } else if (viewFilter === 'not-viewed') {
        matchesView = p.status === 'sent' && p.viewCount === 0;
      } else if (viewFilter === 'draft') {
        matchesView = p.status === 'draft';
      }

      // Filtro por estado de email
      let matchesEmailStatus = true;
      if (emailStatusFilter === 'sent') {
        matchesEmailStatus = p.emailSentAt !== null && !p.deliveredAt;
      } else if (emailStatusFilter === 'delivered') {
        matchesEmailStatus = p.deliveredAt !== null && p.openCount === 0;
      } else if (emailStatusFilter === 'opened') {
        matchesEmailStatus = p.openCount > 0 && p.clickCount === 0;
      } else if (emailStatusFilter === 'clicked') {
        matchesEmailStatus = p.clickCount > 0;
      }

      // Filtro por fecha
      let matchesDate = true;
      const sentDate = p.emailSentAt ? new Date(p.emailSentAt) : p.createdAt ? new Date(p.createdAt) : null;
      if (dateFilter === 'today' && sentDate) {
        matchesDate = sentDate >= today;
      } else if (dateFilter === 'week' && sentDate) {
        matchesDate = sentDate >= weekAgo;
      } else if (dateFilter === 'month' && sentDate) {
        matchesDate = sentDate >= monthAgo;
      } else if (dateFilter === 'quarter' && sentDate) {
        matchesDate = sentDate >= quarterAgo;
      }

      return matchesSearch && matchesView && matchesEmailStatus && matchesDate;
    });
  }, [presentations, searchTerm, viewFilter, emailStatusFilter, dateFilter, initialFilter]);

  // Copiar link al portapapeles
  const copyToClipboard = async (uniqueId: string) => {
    const url = `${window.location.origin}/p/${uniqueId}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(uniqueId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Compartir por WhatsApp
  const shareWhatsApp = (uniqueId: string, clientData: any) => {
    const url = `${window.location.origin}/p/${uniqueId}`;
    const phone = clientData?.contact?.Mobile || clientData?.contact?.Phone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const companyName = clientData?.account?.Account_Name || 'Cliente';
    const contactName = `${clientData?.contact?.First_Name || ''} ${clientData?.contact?.Last_Name || ''}`.trim();
    
    const message = encodeURIComponent(
      `Hola ${contactName}, te envío la propuesta de Gard Security para ${companyName}:\n\n${url}`
    );
    
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/50 backdrop-blur-sm p-3 sm:p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-md bg-gradient-to-br from-blue-500 to-purple-600">
          <FileText className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-sm sm:text-base font-bold text-white">
            Presentaciones Enviadas
          </h2>
          <p className="text-xs text-white/60">
            {filteredPresentations.length} de {presentations.length}
          </p>
        </div>
      </div>

      {/* Filtros - simplificados */}
      <div className="mb-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {/* Búsqueda */}
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
          <input
            type="text"
            placeholder="Buscar empresa, contacto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
          />
        </div>

        {/* Filtro por Vistas */}
        <div className="relative">
          <Eye className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
          <select
            value={viewFilter}
            onChange={(e) => setViewFilter(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 appearance-none cursor-pointer"
          >
            <option value="all">Todas</option>
            <option value="viewed">Vistas</option>
            <option value="not-viewed">No vistas</option>
            <option value="draft">Borradores</option>
          </select>
        </div>

        {/* Filtro por Estado Email */}
        <div className="relative">
          <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
          <select
            value={emailStatusFilter}
            onChange={(e) => setEmailStatusFilter(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 appearance-none cursor-pointer"
          >
            <option value="all">Todos los correos</option>
            <option value="sent">Enviado</option>
            <option value="delivered">Entregado</option>
            <option value="opened">Abierto</option>
            <option value="clicked">Clicked</option>
          </select>
        </div>

        {/* Filtro por fecha */}
        <div className="relative">
          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 appearance-none cursor-pointer"
          >
            <option value="all">Todas las fechas</option>
            <option value="today">Hoy</option>
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
            <option value="quarter">Último trimestre</option>
          </select>
        </div>
      </div>

      {/* Lista - más compacta */}
      <div className="space-y-2">
        {filteredPresentations.length === 0 ? (
          <div className="text-center py-8 text-white/60">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay presentaciones</p>
          </div>
        ) : (
          filteredPresentations.map((presentation) => {
            const clientData = presentation.clientData as any;
            const companyName = clientData?.account?.Account_Name || 'Sin nombre';
            // Usar recipientName si existe, sino usar el de Zoho
            const contactName = presentation.recipientName || 
              `${clientData?.contact?.First_Name || ''} ${clientData?.contact?.Last_Name || ''}`.trim() || 
              'Sin contacto';
            const subject = clientData?.quote?.Subject || 'Sin asunto';
            const quoteNumber = clientData?.quote?.Quote_Number || 'N/A';
            const quoteId = clientData?.quote?.id || null;
            const recipientEmail = presentation.recipientEmail || clientData?.contact?.Email || '';
            
            // URL de la cotización en Zoho CRM
            const zohoQuoteUrl = quoteId 
              ? `https://crm.zoho.com/crm/org20090271400/tab/Quotes/${quoteId}`
              : null;

            return (
              <div
                key={presentation.id}
                className="group rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 p-3 transition-all hover:shadow-lg"
              >
                {/* Layout horizontal compacto */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  {/* Info principal - Izquierda */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate mb-1">
                      {companyName}
                    </h3>
                    <p className="text-xs text-white/70 truncate mb-1">{subject}</p>
                    
                    {/* Info adicional */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/50">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{contactName}</span>
                      </span>
                      {recipientEmail && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{recipientEmail}</span>
                        </span>
                      )}
                      {zohoQuoteUrl ? (
                        <a
                          href={zohoQuoteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                          title="Ver cotización en Zoho CRM"
                        >
                          <FileText className="w-3 h-3 flex-shrink-0" />
                          <span className="underline">{quoteNumber}</span>
                        </a>
                      ) : (
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3 flex-shrink-0" />
                          {quoteNumber}
                        </span>
                      )}
                      {presentation.emailSentAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          {new Date(presentation.emailSentAt).toLocaleDateString('es-CL', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Analytics - Centro */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Vistas */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-green-500/10 border border-green-500/20">
                      <Eye className="w-3.5 h-3.5 text-green-400" />
                      <div className="flex flex-col">
                        <div className="text-xs font-bold text-green-400">{presentation.viewCount}</div>
                        <div className="text-[8px] text-white/50 leading-none">vistas</div>
                      </div>
                    </div>

                    {/* Estado del Email */}
                    <EmailStatusBadge presentation={presentation} />
                  </div>

                  {/* Acciones - Derecha */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Ver */}
                    <a
                      href={`/p/${presentation.uniqueId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-md bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 transition-colors"
                      title="Ver"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    {/* Copiar */}
                    <button
                      onClick={() => copyToClipboard(presentation.uniqueId)}
                      className="p-1.5 rounded-md bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 transition-colors"
                      title="Copiar"
                    >
                      {copiedId === presentation.uniqueId ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* WhatsApp */}
                    <button
                      onClick={() => shareWhatsApp(presentation.uniqueId, clientData)}
                      className="p-1.5 rounded-md bg-green-500/20 hover:bg-green-500/30 text-green-300 transition-colors"
                      title="WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
