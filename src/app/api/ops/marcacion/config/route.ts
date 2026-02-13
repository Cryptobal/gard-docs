/**
 * API: /api/ops/marcacion/config
 * GET  - Obtener configuración de marcaciones del tenant
 * POST - Guardar configuración de marcaciones del tenant
 *
 * Almacenadas en la tabla Setting con key="marcacion_config:{tenantId}"
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { hasPermission, PERMISSIONS, type Role } from "@/lib/rbac";

function settingKey(tenantId: string) {
  return `marcacion_config:${tenantId}`;
}

export interface MarcacionConfig {
  // Tolerancia de atraso (minutos) — entradas dentro de este rango no se consideran atraso
  toleranciaAtrasoMinutos: number;
  // Intervalo de rotación del código QR/URL (horas, 0 = no rotar)
  rotacionCodigoHoras: number;
  // Plazo de oposición para marcas manuales (horas)
  plazoOposicionHoras: number;
  // Emails habilitados
  emailComprobanteDigitalEnabled: boolean;
  emailAvisoMarcaManualEnabled: boolean;
  // Delay para email de marca manual (minutos, 0 = inmediato)
  emailDelayManualMinutos: number;
  // Cláusula legal para email de marca manual
  clausulaLegal: string;
  // ── Rondas: parámetros globales de operación ──
  rondasPollingSegundos: number;
  rondasVentanaInicioAntesMin: number;
  rondasVentanaInicioDespuesMin: number;
  rondasRequiereFotoEvidencia: boolean;
  rondasPermiteReemplazo: boolean;
}

const DEFAULTS: MarcacionConfig = {
  toleranciaAtrasoMinutos: 15,
  rotacionCodigoHoras: 0, // No rotar por defecto
  plazoOposicionHoras: 48,
  emailComprobanteDigitalEnabled: true,
  emailAvisoMarcaManualEnabled: true,
  emailDelayManualMinutos: 0, // 0 = inmediato
  clausulaLegal:
    'Si transcurridas las 48 horas de recibir esta notificación usted no se hubiera opuesto al nuevo ajuste, ésta será considerada válida para los efectos de cálculo de su jornada.',
  rondasPollingSegundos: 30,
  rondasVentanaInicioAntesMin: 60,
  rondasVentanaInicioDespuesMin: 120,
  rondasRequiereFotoEvidencia: false,
  rondasPermiteReemplazo: true,
};

export async function GET() {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();

    const setting = await prisma.setting.findFirst({
      where: { key: settingKey(ctx.tenantId) },
    });

    let config: MarcacionConfig = { ...DEFAULTS };
    if (setting?.value) {
      try {
        const parsed = JSON.parse(setting.value);
        config = { ...DEFAULTS, ...parsed };
      } catch {
        // corrupted JSON — return defaults
      }
    }

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error("Error fetching marcacion config:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener configuración de marcaciones" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();

    if (!hasPermission(ctx.userRole as Role, PERMISSIONS.MANAGE_SETTINGS)) {
      return NextResponse.json(
        { success: false, error: "Sin permisos para cambiar la configuración" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Merge con existente
    const existing = await prisma.setting.findFirst({
      where: { key: settingKey(ctx.tenantId) },
    });

    let currentConfig: MarcacionConfig = { ...DEFAULTS };
    if (existing?.value) {
      try {
        currentConfig = { ...DEFAULTS, ...JSON.parse(existing.value) };
      } catch {
        // corrupted — start fresh
      }
    }

    const merged = { ...currentConfig, ...body };
    const value = JSON.stringify(merged);

    if (existing) {
      await prisma.setting.update({
        where: { id: existing.id },
        data: { value },
      });
    } else {
      await prisma.setting.create({
        data: {
          key: settingKey(ctx.tenantId),
          value,
          type: "json",
          category: "marcacion",
          tenantId: ctx.tenantId,
        },
      });
    }

    return NextResponse.json({ success: true, data: merged });
  } catch (error) {
    console.error("Error saving marcacion config:", error);
    return NextResponse.json(
      { success: false, error: "Error al guardar configuración de marcaciones" },
      { status: 500 }
    );
  }
}
