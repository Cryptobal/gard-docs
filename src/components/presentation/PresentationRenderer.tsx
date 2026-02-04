'use client';

/**
 * PresentationRenderer - Componente orquestador principal
 * Renderiza una presentación completa con las 29 secciones
 */

import { PresentationPayload } from '@/types/presentation';
import { ThemeProvider } from './ThemeProvider';
import { PresentationHeader } from '../layout/PresentationHeader';
import { PresentationFooter } from '../layout/PresentationFooter';
import { StickyCTA } from './StickyCTA';

// Import secciones implementadas
import { Section01Hero } from './sections/Section01Hero';
import { Section02ExecutiveSummary } from './sections/Section02ExecutiveSummary';
import { Section19Resultados } from './sections/Section19Resultados';
import { Section23PropuestaEconomica } from './sections/Section23PropuestaEconomica';
import { Section25Comparacion } from './sections/Section25Comparacion';
import { PlaceholderSection } from './sections/PlaceholderSection';

interface PresentationRendererProps {
  payload: PresentationPayload;
}

export function PresentationRenderer({ payload }: PresentationRendererProps) {
  const { theme, sections, assets, cta, contact } = payload;
  
  return (
    <ThemeProvider variant={theme}>
      <div className="presentation-container min-h-screen">
        {/* Header persistente */}
        <PresentationHeader 
          logo={assets.logo}
          cta={cta}
        />
        
        {/* Secciones S01-S29 */}
        <main>
          {/* S01 - Hero */}
          <Section01Hero data={sections.s01_hero} payload={payload} />
          
          {/* S02 - Executive Summary */}
          <Section02ExecutiveSummary data={sections.s02_executive_summary} />
          
          {/* S03 - Transparencia */}
          <PlaceholderSection 
            id="s03" 
            title="Compromiso de Transparencia"
            data={sections.s03_transparencia}
          />
          
          {/* S04 - El Riesgo Real */}
          <PlaceholderSection 
            id="s04" 
            title="El Riesgo Real"
            data={sections.s04_riesgo}
          />
          
          {/* S05 - Fallas del Modelo Tradicional */}
          <PlaceholderSection 
            id="s05" 
            title="Fallas del Modelo Tradicional"
            data={sections.s05_fallas_modelo}
          />
          
          {/* S06 - Costo Real */}
          <PlaceholderSection 
            id="s06" 
            title="Costo Real del Riesgo"
            data={sections.s06_costo_real}
          />
          
          {/* S07 - Sistema de Capas */}
          <PlaceholderSection 
            id="s07" 
            title="Seguridad como Sistema"
            data={sections.s07_sistema_capas}
          />
          
          {/* S08 - 4 Pilares */}
          <PlaceholderSection 
            id="s08" 
            title="4 Pilares del Modelo GARD"
            data={sections.s08_4_pilares}
          />
          
          {/* S09 - Cómo Operamos */}
          <PlaceholderSection 
            id="s09" 
            title="Cómo Operamos"
            data={sections.s09_como_operamos}
          />
          
          {/* S10 - Supervisión */}
          <PlaceholderSection 
            id="s10" 
            title="Supervisión Activa"
            data={sections.s10_supervision}
          />
          
          {/* S11 - Reportabilidad */}
          <PlaceholderSection 
            id="s11" 
            title="Reportabilidad Ejecutiva"
            data={sections.s11_reportabilidad}
          />
          
          {/* S12 - Cumplimiento */}
          <PlaceholderSection 
            id="s12" 
            title="Cumplimiento Laboral"
            data={sections.s12_cumplimiento}
          />
          
          {/* S13 - Certificaciones */}
          <PlaceholderSection 
            id="s13" 
            title="Certificaciones y Estándares"
            data={sections.s13_certificaciones}
          />
          
          {/* S14 - Tecnología */}
          <PlaceholderSection 
            id="s14" 
            title="Tecnología que Controla"
            data={sections.s14_tecnologia}
          />
          
          {/* S15 - Selección de Personal */}
          <PlaceholderSection 
            id="s15" 
            title="Selección de Personal"
            data={sections.s15_seleccion}
          />
          
          {/* S16 - Nuestra Gente */}
          <PlaceholderSection 
            id="s16" 
            title="Nuestra Gente"
            data={sections.s16_nuestra_gente}
          />
          
          {/* S17 - Continuidad */}
          <PlaceholderSection 
            id="s17" 
            title="Continuidad del Servicio"
            data={sections.s17_continuidad}
          />
          
          {/* S18 - KPIs */}
          <PlaceholderSection 
            id="s18" 
            title="Indicadores de Gestión"
            data={sections.s18_kpis}
          />
          
          {/* S19 - Resultados */}
          <Section19Resultados data={sections.s19_resultados} />
          
          {/* S20 - Clientes */}
          <PlaceholderSection 
            id="s20" 
            title="Nuestros Clientes"
            data={sections.s20_clientes}
          />
          
          {/* S21 - Sectores */}
          <PlaceholderSection 
            id="s21" 
            title="Sectores donde Aplicamos"
            data={sections.s21_sectores}
          />
          
          {/* S22 - TCO */}
          <PlaceholderSection 
            id="s22" 
            title="Costo Total de Propiedad (TCO)"
            data={sections.s22_tco}
          />
          
          {/* S23 - Propuesta Económica */}
          <Section23PropuestaEconomica data={sections.s23_propuesta_economica} />
          
          {/* S24 - Términos y Condiciones */}
          <PlaceholderSection 
            id="s24" 
            title="Términos y Condiciones"
            data={sections.s24_terminos_condiciones}
          />
          
          {/* S25 - Comparación Competitiva */}
          <Section25Comparacion data={sections.s25_comparacion} />
          
          {/* S26 - Por Qué Nos Eligen */}
          <PlaceholderSection 
            id="s26" 
            title="Por Qué Nos Eligen"
            data={sections.s26_porque_eligen}
          />
          
          {/* S27 - Implementación */}
          <PlaceholderSection 
            id="s27" 
            title="Proceso de Implementación"
            data={sections.s27_implementacion}
          />
          
          {/* S28 - Cierre + CTA */}
          <PlaceholderSection 
            id="s28" 
            title="¿Listo para Comenzar?"
            data={sections.s28_cierre}
          />
          
          {/* S29 - Contacto */}
          <PlaceholderSection 
            id="s29" 
            title="Contacto"
            data={sections.s29_contacto}
          />
        </main>
        
        {/* Footer */}
        <PresentationFooter 
          logo={assets.logo}
          contact={contact}
          address={sections.s29_contacto.address}
          website={sections.s29_contacto.website}
          social_media={sections.s29_contacto.social_media}
        />
        
        {/* CTA Sticky (Mobile) */}
        <StickyCTA cta={cta} />
      </div>
    </ThemeProvider>
  );
}
