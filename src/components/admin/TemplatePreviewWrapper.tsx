'use client';

/**
 * TemplatePreviewWrapper - Wrapper para modo preview de templates
 * Maneja estado de sidebar, tokens y theme
 */

import { useState } from 'react';
import { PresentationPayload } from '@/types/presentation';
import { ThemeVariant } from '@/types';
import { PresentationRenderer } from '../presentation/PresentationRenderer';
import { TemplateSidebar } from './TemplateSidebar';
import { PreviewModeToggle } from './PreviewModeToggle';

interface TemplatePreviewWrapperProps {
  payload: PresentationPayload;
  initialTheme?: ThemeVariant;
  showTokensByDefault?: boolean;
}

export function TemplatePreviewWrapper({
  payload: initialPayload,
  initialTheme = 'executive',
  showTokensByDefault = false,
}: TemplatePreviewWrapperProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeVariant>(initialTheme);
  const [showTokens, setShowTokens] = useState(showTokensByDefault);
  
  // Crear payload con o sin tokens reemplazados
  const displayPayload: PresentationPayload = showTokens 
    ? createTokenizedPayload(initialPayload)
    : initialPayload;
  
  // Actualizar theme del payload
  displayPayload.theme = currentTheme;
  
  // Key para forzar re-render cuando cambia theme o showTokens
  const renderKey = `${currentTheme}-${showTokens}`;
  
  return (
    <>
      {/* Sidebar de navegación */}
      <TemplateSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentTheme={currentTheme}
        onThemeChange={(newTheme) => {
          setCurrentTheme(newTheme);
          // Forzar scroll top al cambiar theme para ver el cambio
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        showTokens={showTokens}
        onToggleTokens={() => setShowTokens(!showTokens)}
      />
      
      {/* Toggle button flotante */}
      <PreviewModeToggle
        isOpen={isSidebarOpen}
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      {/* Presentación - key para forzar re-render */}
      <PresentationRenderer key={renderKey} payload={displayPayload} />
    </>
  );
}

/**
 * Crea un payload con tokens visibles (sin reemplazar)
 * TODOS los valores se convierten en tokens
 */
function createTokenizedPayload(payload: PresentationPayload): PresentationPayload {
  // Crear un nuevo payload donde TODOS los strings se convierten en tokens
  const tokenizedPayload: PresentationPayload = JSON.parse(JSON.stringify(payload));
  
  // Reemplazar datos de cliente con tokens
  tokenizedPayload.client = {
    ...payload.client,
    company_name: '[ACCOUNT_NAME]',
    contact_name: '[CONTACT_NAME]',
    contact_first_name: '[CONTACT_FIRST_NAME]',
    contact_last_name: '[CONTACT_LAST_NAME]',
    contact_email: '[CONTACT_EMAIL]',
    contact_phone: '[CONTACT_PHONE]',
    contact_mobile: '[CONTACT_MOBILE]',
    phone: '[ACCOUNT_PHONE]',
    rut: '[ACCOUNT_RUT]',
    address: '[ACCOUNT_ADDRESS]',
    city: '[ACCOUNT_CITY]',
  };
  
  // Reemplazar datos de cotización con tokens
  tokenizedPayload.quote = {
    ...payload.quote,
    number: '[QUOTE_NUMBER]',
    date: '[CURRENT_DATE]',
    valid_until: '[QUOTE_VALID_UNTIL]',
    subject: '[QUOTE_SUBJECT]',
    description: '[QUOTE_DESCRIPTION]',
    subtotal: 999999,
    tax: 999999,
    total: 999999,
  };
  
  // Reemplazar valores en pricing con tokens para visual
  if (tokenizedPayload.sections.s23_propuesta_economica) {
    tokenizedPayload.sections.s23_propuesta_economica.pricing.items = 
      tokenizedPayload.sections.s23_propuesta_economica.pricing.items.map(item => ({
        ...item,
        unit_price: 999999,
        subtotal: 999999,
      }));
    
    tokenizedPayload.sections.s23_propuesta_economica.pricing.subtotal = 999999;
    tokenizedPayload.sections.s23_propuesta_economica.pricing.tax = 999999;
    tokenizedPayload.sections.s23_propuesta_economica.pricing.total = 999999;
  }
  
  return tokenizedPayload;
}
