/**
 * API Route para generar PDF de propuesta económica usando Playwright
 * Captura el preview HTML como PDF idéntico
 */

import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Permite hasta 30 segundos

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientName, quoteNumber } = body;
    
    // URL del preview a capturar
    const previewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/templates/pricing-format?admin=true`;
    
    // Iniciar navegador headless
    const browser = await chromium.launch({
      headless: true,
    });
    
    const page = await browser.newPage();
    
    // Ir a la página de preview
    await page.goto(previewUrl, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    
    // Esperar a que la página esté completamente cargada
    await page.waitForTimeout(1000);
    
    // Generar PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true, // IMPORTANTE: incluir colores y gradientes
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
      },
    });
    
    await browser.close();
    
    // Devolver el PDF - Convertir Buffer a Uint8Array para NextResponse
    const fileName = `Propuesta_${clientName?.replace(/\s+/g, '_') || 'Cliente'}_${quoteNumber || 'COT'}.pdf`;
    
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
    
  } catch (error) {
    console.error('Error generando PDF:', error);
    return NextResponse.json(
      { error: 'Error generando PDF' },
      { status: 500 }
    );
  }
}
