'use client';

/**
 * Section25Comparacion - Tabla comparativa Mercado vs GARD
 * Diferenciación competitiva clara
 */

import { Section25_Comparacion } from '@/types/presentation';
import { SectionWrapper, ContainerWrapper } from '../SectionWrapper';
import { useThemeClasses } from '../ThemeProvider';
import { cn } from '@/lib/utils';
import { ComparisonTable, ComparisonCards } from '../shared/ComparisonTable';
import { CheckCircle2 } from 'lucide-react';

interface Section25ComparacionProps {
  data: Section25_Comparacion;
}

export function Section25Comparacion({ data }: Section25ComparacionProps) {
  const theme = useThemeClasses();
  
  return (
    <SectionWrapper id="s25-comparacion" className={theme.backgroundAlt}>
      <ContainerWrapper size="xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className={cn('inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4', theme.accent, 'text-white')}>
            Comparación Competitiva
          </div>
          <h2 className={cn('text-3xl md:text-5xl font-bold mb-4', theme.text, theme.headlineWeight)}>
            Por qué GARD no es "uno más"
          </h2>
          <p className={cn('text-lg md:text-xl max-w-3xl mx-auto', theme.textMuted)}>
            Comparación honesta con el mercado tradicional de seguridad privada
          </p>
        </div>
        
        {/* Callout de diferenciación */}
        <div className={cn('p-6 md:p-8 rounded-lg border mb-12', theme.border, theme.secondary)}>
          <div className="flex items-start gap-4">
            <div className={cn('w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0', theme.accent)}>
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className={cn('text-xl font-bold mb-2', theme.text)}>
                No somos "commodity"
              </h3>
              <p className={cn('text-base', theme.textMuted)}>
                Mientras otros proveedores compiten por precio, nosotros competimos por valor: 
                supervisión real, reportabilidad ejecutiva y cumplimiento garantizado.
              </p>
            </div>
          </div>
        </div>
        
        {/* Tabla comparativa (desktop) */}
        <div className="hidden md:block">
          <ComparisonTable rows={data.comparison_table} />
        </div>
        
        {/* Cards comparativas (mobile) */}
        <ComparisonCards rows={data.comparison_table} />
        
        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <div className={cn('inline-block p-6 rounded-lg', theme.secondary, 'border', theme.border)}>
            <p className={cn('text-lg font-semibold mb-4', theme.text)}>
              ¿Quieres saber cómo nos comparamos con tu proveedor actual?
            </p>
            <a
              href="mailto:comercial@gard.cl?subject=Solicitud de comparación competitiva"
              className={cn(
                'inline-flex items-center gap-2 px-6 py-3 rounded-lg',
                'text-sm font-semibold text-white',
                theme.accent,
                theme.accentHover,
                'transition-all hover:scale-105'
              )}
            >
              Solicitar análisis comparativo
            </a>
          </div>
        </div>
      </ContainerWrapper>
    </SectionWrapper>
  );
}
