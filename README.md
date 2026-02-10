# OPAI Suite — Gard Security

Suite SaaS para empresas de seguridad | `opai.gard.cl`

---

## Que es

OPAI Suite es una plataforma unificada que cubre el ciclo completo: desde la venta comercial hasta la operacion en terreno. Arquitectura MONOREPO single-domain con multi-tenancy.

## Modulos en produccion

| Modulo | Ruta | Descripcion |
|--------|------|-------------|
| **Hub** | `/hub` | Dashboard ejecutivo, KPIs, app launcher |
| **CRM** | `/crm/*` | Leads, cuentas, contactos, deals, instalaciones, pipeline, email, follow-ups |
| **CPQ** | `/cpq/*` | Cotizaciones con calculo de costo empleador |
| **Presentaciones** | `/opai/inicio` | Propuestas comerciales con tracking de vistas y emails |
| **Documentos** | `/opai/documentos/*` | Contratos y templates legales con tokens y versionado |
| **Payroll** | `/payroll/*` | Simulador de liquidaciones Chile (parcial) |
| **Configuracion** | `/opai/configuracion/*` | Usuarios, integraciones, firmas, categorias |

## Modulos planificados (OPI)

| Fase | Modulo | Estado |
|:----:|--------|:------:|
| 1 | Ops (puestos, pauta, asistencia, TE, personas) | Pendiente |
| 2 | Postventa (check-in/out, bitacora) + Tickets (SLA) | Planificado |
| 3 | Portal guardias (comunicados, solicitudes) | Pendiente |
| 4 | Inventario (stock, kits, asignaciones) | Pendiente |
| 5 | Asistencia externa (FaceID/API) | Pendiente |

## Stack

- **Framework:** Next.js 15 (App Router)
- **Lenguaje:** TypeScript 5.6
- **DB:** PostgreSQL (Neon) + Prisma (6 schemas, 56 modelos)
- **Auth:** Auth.js v5 (4 roles: owner, admin, editor, viewer)
- **UI:** Tailwind CSS + Radix UI + shadcn/ui
- **Email:** Resend
- **AI:** OpenAI
- **PDF:** Playwright + Chromium
- **Deploy:** Vercel

## Instalacion

```bash
git clone git@github.com:Cryptobal/gard-docs.git
cd gard-docs
npm install
cp .env.example .env.local
# Completar variables de entorno (ver .env.example)
npx playwright install chromium
npm run dev
```

## Documentacion

| Documento | Proposito |
|-----------|-----------|
| [docs/00-product/MASTER_SPEC_OPI.md](docs/00-product/MASTER_SPEC_OPI.md) | Vision completa, todas las fases |
| [docs/02-implementation/ESTADO_GENERAL.md](docs/02-implementation/ESTADO_GENERAL.md) | Estado real de todos los modulos |
| [docs/README.md](docs/README.md) | Indice completo de documentacion |

## Equipo

- **Product Owner:** Carlos Irigoyen (Gard Security)
- **Development:** Cursor AI

---

2026 Gard Security
