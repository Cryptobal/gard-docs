'use client';

/**
 * Section19Resultados - Casos de éxito con clientes
 * Muestra resultados reales con métricas y testimonios
 */

import { Section19_Resultados } from '@/types/presentation';
import { SectionWrapper, ContainerWrapper, StaggerContainer, StaggerItem } from '../SectionWrapper';
import { useThemeClasses } from '../ThemeProvider';
import { cn } from '@/lib/utils';
import { CaseStudyGrid } from '../shared/CaseStudyCard';
import { TrendingUp } from 'lucide-react';

interface Section19ResultadosProps {
  data: Section19_Resultados;
}

export function Section19Resultados({ data }: Section19ResultadosProps) {
  const theme = useThemeClasses();
  
  return (
    <SectionWrapper id="s19-resultados">
      <ContainerWrapper size="xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className={cn('inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4', theme.accent, 'text-white')}>
            Casos de Éxito
          </div>
          <h2 className={cn('text-3xl md:text-5xl font-bold mb-4', theme.text, theme.headlineWeight)}>
            Resultados con clientes reales
          </h2>
          <p className={cn('text-lg md:text-xl max-w-3xl mx-auto', theme.textMuted)}>
            Empresas que han transformado su operación de seguridad con resultados medibles
          </p>
        </div>
        
        {/* Stats generales */}
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          <StaggerItem>
            <div className={cn('p-6 rounded-lg border text-center', theme.border, theme.secondary)}>
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className={cn('w-5 h-5', theme.accent.replace('bg-', 'text-'))} />
              </div>
              <div className={cn('text-3xl font-bold mb-1', theme.text)}>
                73%
              </div>
              <div className={cn('text-sm', theme.textMuted)}>
                Reducción promedio de incidentes
              </div>
            </div>
          </StaggerItem>
          
          <StaggerItem>
            <div className={cn('p-6 rounded-lg border text-center', theme.border, theme.secondary)}>
              <div className={cn('text-3xl font-bold mb-1', theme.text)}>
                98%
              </div>
              <div className={cn('text-sm', theme.textMuted)}>
                Cumplimiento de rondas
              </div>
            </div>
          </StaggerItem>
          
          <StaggerItem>
            <div className={cn('p-6 rounded-lg border text-center', theme.border, theme.secondary)}>
              <div className={cn('text-3xl font-bold mb-1', theme.text)}>
                4.7/5
              </div>
              <div className={cn('text-sm', theme.textMuted)}>
                Satisfacción promedio
              </div>
            </div>
          </StaggerItem>
          
          <StaggerItem>
            <div className={cn('p-6 rounded-lg border text-center', theme.border, theme.secondary)}>
              <div className={cn('text-3xl font-bold mb-1', theme.text)}>
                94%
              </div>
              <div className={cn('text-sm', theme.textMuted)}>
                Tasa de renovación
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>
        
        {/* Case Studies */}
        <CaseStudyGrid caseStudies={data.case_studies} />
        
        {/* Nota de confidencialidad */}
        <div className="mt-12 text-center">
          <p className={cn('text-sm', theme.textMuted)}>
            Algunos clientes prefieren mantener confidencialidad por políticas internas.<br />
            Referencias disponibles bajo solicitud y NDA.
          </p>
        </div>
      </ContainerWrapper>
    </SectionWrapper>
  );
}
