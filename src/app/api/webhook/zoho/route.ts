/**
 * API Route: /api/webhook/zoho
 * 
 * POST - Recibir datos de Zoho CRM y crear sesión de webhook
 * 
 * Este endpoint recibe datos de una cotización de Zoho CRM,
 * los valida, y crea una sesión temporal para generar la presentación.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

// POST /api/webhook/zoho
export async function POST(request: NextRequest) {
  try {
    // 1. Validar autenticación
    const authHeader = request.headers.get('authorization');
    const expectedToken = `Bearer ${process.env.ZOHO_WEBHOOK_SECRET}`;
    
    if (!authHeader || authHeader !== expectedToken) {
      console.error('❌ Invalid authentication token');
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // 2. Parsear body
    const body = await request.json();
    
    // 3. Validar que venga al menos el quote
    if (!body.quote) {
      console.error('❌ Missing quote data');
      return NextResponse.json(
        { success: false, error: 'Missing quote data' },
        { status: 400 }
      );
    }

    // 4. Generar sessionId único
    const sessionId = `whs_${nanoid(16)}`;

    // 5. Calcular fecha de expiración (24 horas)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // 6. Guardar sesión en base de datos
    const webhookSession = await prisma.webhookSession.create({
      data: {
        sessionId,
        zohoData: body, // Guardar todo el payload
        status: 'pending',
        expiresAt,
      },
    });

    // 7. Construir URL de preview
    // Prioridad: SITE_URL > dominio hardcoded
    // En producción siempre usar docs.gard.cl
    let baseUrl: string;
    
    if (process.env.SITE_URL) {
      baseUrl = process.env.SITE_URL;
    } else if (process.env.VERCEL_ENV === 'production') {
      baseUrl = 'https://docs.gard.cl';
    } else if (process.env.NEXT_PUBLIC_SITE_URL) {
      baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      baseUrl = 'https://docs.gard.cl';
    }
    
    const previewUrl = `${baseUrl}/preview/${sessionId}`;

    // 8. Log de éxito
    console.log('✅ Webhook session created:', {
      sessionId,
      quoteId: body.quote_id || body.quote?.id,
      accountName: body.account?.Account_Name || 'Unknown',
    });

    // 9. Retornar respuesta
    return NextResponse.json({
      success: true,
      sessionId,
      preview_url: previewUrl,
      token: sessionId, // Zoho espera "token"
      expiresAt: expiresAt.toISOString(),
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Error in webhook:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// GET /api/webhook/zoho (health check)
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Zoho webhook endpoint is ready',
    version: '1.0.0',
  });
}
