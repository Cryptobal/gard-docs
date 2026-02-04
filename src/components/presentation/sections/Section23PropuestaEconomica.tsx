'use client';

/**
 * Section23PropuestaEconomica - Tabla de propuesta económica
 * Muestra pricing detallado con items, subtotal, IVA y total
 */

import { Section23_PropuestaEconomica } from '@/types/presentation';
import { SectionWrapper, ContainerWrapper } from '../SectionWrapper';
import { useThemeClasses } from '../ThemeProvider';
import { cn } from '@/lib/utils';
import { PricingTable, PricingCards } from '../shared/PricingTable';
import { FileText, Calendar, TrendingUp } from 'lucide-react';

interface Section23PropuestaEconomicaProps {
  data: Section23_PropuestaEconomica;
}

export function Section23PropuestaEconomica({ data }: Section23PropuestaEconomicaProps) {
  const theme = useThemeClasses();
  const { pricing } = data;
  
  return (
    <SectionWrapper id="s23-propuesta-economica" className={theme.backgroundAlt}>
      <ContainerWrapper size="xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className={cn('inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4', theme.accent, 'text-white')}>
            Propuesta Económica
          </div>
          <h2 className={cn('text-3xl md:text-5xl font-bold mb-4', theme.text, theme.headlineWeight)}>
            Inversión mensual
          </h2>
          <p className={cn('text-lg md:text-xl max-w-2xl mx-auto', theme.textMuted)}>
            Tarifa todo incluido con transparencia total
          </p>
        </div>
        
        {/* Tabla de pricing (desktop) */}
        <div className="hidden md:block mb-8">
          <PricingTable pricing={pricing} />
        </div>
        
        {/* Cards de pricing (mobile) */}
        <PricingCards pricing={pricing} />
        
        {/* Información adicional */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {/* Facturación */}
          {pricing.payment_terms && (
            <div className={cn('p-6 rounded-lg border', theme.border, theme.secondary)}>
              <div className="flex items-center gap-3 mb-3">
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', theme.accent, 'bg-opacity-20')}>
                  <FileText className={cn('w-5 h-5', theme.accent.replace('bg-', 'text-'))} />
                </div>
                <h3 className={cn('font-semibold', theme.text)}>
                  Forma de Pago
                </h3>
              </div>
              <p className={cn('text-sm', theme.textMuted)}>
                {pricing.payment_terms}
              </p>
            </div>
          )}
          
          {/* Frecuencia */}
          {pricing.billing_frequency && (
            <div className={cn('p-6 rounded-lg border', theme.border, theme.secondary)}>
              <div className="flex items-center gap-3 mb-3">
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', theme.accent, 'bg-opacity-20')}>
                  <Calendar className={cn('w-5 h-5', theme.accent.replace('bg-', 'text-'))} />
                </div>
                <h3 className={cn('font-semibold', theme.text)}>
                  Frecuencia
                </h3>
              </div>
              <p className={cn('text-sm', theme.textMuted)}>
                Facturación {pricing.billing_frequency === 'monthly' ? 'mensual' : 
                            pricing.billing_frequency === 'quarterly' ? 'trimestral' : 'anual'}
              </p>
            </div>
          )}
          
          {/* Reajuste */}
          {pricing.adjustment_terms && (
            <div className={cn('p-6 rounded-lg border', theme.border, theme.secondary)}>
              <div className="flex items-center gap-3 mb-3">
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', theme.accent, 'bg-opacity-20')}>
                  <TrendingUp className={cn('w-5 h-5', theme.accent.replace('bg-', 'text-'))} />
                </div>
                <h3 className={cn('font-semibold', theme.text)}>
                  Reajuste
                </h3>
              </div>
              <p className={cn('text-sm', theme.textMuted)}>
                {pricing.adjustment_terms}
              </p>
            </div>
          )}
        </div>
        
        {/* CTA */}
        <div className="mt-12 text-center">
          <p className={cn('text-sm mb-4', theme.textMuted)}>
            ¿Preguntas sobre la propuesta?
          </p>
          <a
            href="mailto:comercial@gard.cl"
            className={cn(
              'inline-flex items-center gap-2 px-6 py-3 rounded-lg',
              'text-sm font-semibold text-white',
              theme.accent,
              theme.accentHover,
              'transition-all hover:scale-105'
            )}
          >
            Solicitar reunión comercial
          </a>
        </div>
      </ContainerWrapper>
    </SectionWrapper>
  );
}
