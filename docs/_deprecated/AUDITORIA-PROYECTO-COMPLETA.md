# 📊 AUDITORÍA COMPLETA DEL PROYECTO OPAI
## Documento de Auditoría Técnica y Estado del Proyecto

**Fecha de auditoría:** 6 de Febrero 2026  
**Proyecto:** OPAI Suite - Plataforma SaaS Multi-tenant  
**Repositorio:** gard-docs  
**Dominio:** opai.gard.cl  
**Responsable:** Carlos Irigoyen (Gard Security)

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Historial de Cambios Recientes](#historial-de-cambios)
3. [Arquitectura del Sistema](#arquitectura)
4. [Módulos Implementados](#módulos-implementados)
5. [Base de Datos](#base-de-datos)
6. [Autenticación y Autorización](#autenticación)
7. [Integraciones](#integraciones)
8. [Documentación Existente](#documentación)
9. [Stack Tecnológico](#stack)
10. [Tareas Pendientes](#pendientes)
11. [Deuda Técnica](#deuda-técnica)
12. [Próximos Pasos Recomendados](#próximos-pasos)

---

## 1. 📌 RESUMEN EJECUTIVO {#resumen-ejecutivo}

### Estado General del Proyecto
**Estado:** ✅ **Phase 1 COMPLETADA** - Producción activa

### Descripción
OPAI Suite es una plataforma SaaS multi-tenant para empresas de seguridad que unifica:
- Sistema de propuestas comerciales con tracking
- Hub ejecutivo con KPIs y lanzador de aplicaciones
- Gestión de usuarios con RBAC
- Módulo de Payroll para Chile (recién implementado)
- Placeholders para CRM y CPQ (infraestructura lista)

### Métricas del Proyecto
- **Commits totales últimas 2 semanas:** 30+
- **Archivos totales creados:** ~250+
- **Líneas de código (estimado):** ~40,000+
- **Módulos operativos:** 5 (Hub, Docs, Auth, Admin, Payroll)
- **Módulos placeholder:** 2 (CRM, CPQ)
- **Migraciones de DB:** 20 (13 public + 6 payroll + 1 fx)

### Hitos Clave Alcanzados
✅ **Hub Ejecutivo Completo** (owner/admin only)  
✅ **Sistema de Autenticación Completo** (login, registro, reset password)  
✅ **Módulo Docs Operativo** (24 secciones, PDF generation, email tracking)  
✅ **Gestión de Usuarios RBAC** (owner, admin, editor, viewer)  
✅ **Módulo Payroll Phase 1** (simulador, costeo, parámetros legales)  
✅ **Design System OPAI** (dark-first, componentes reutilizables)  
✅ **Multi-tenancy Estructural** (UX single-tenant en Phase 1)  
✅ **App Access por Rol** (hardcoded, migración a DB planificada)

---

## 2. 📅 HISTORIAL DE CAMBIOS RECIENTES {#historial-de-cambios}

### Últimos 30 Commits (Febrero 2026)

#### **Semana 1 (Febrero 1-6, 2026)**

##### **6 Febrero 2026 - Módulo Payroll**
```
802bf21 - fix: corregir errores de TypeScript en el módulo de payroll (5 min ago)
  • Archivos: 3 modificados
  • Cambios: compute-employer-cost.ts, parameter-loader.ts, simulate-payslip.ts
  • Detalles: Correcciones de tipos y validaciones

b190f49 - fix: mostrar todos los parámetros legales en modal (17 min ago)
  • Archivos: 1 modificado
  • Cambios: payroll/simulator/page.tsx (+185, -75 líneas)
  • Detalles: Modal de parámetros con renderizado condicional seguro

f1d7bd1 - feat: Implementar módulo Payroll completo para Chile (2 horas ago)
  • Archivos: 24 creados/modificados
  • Cambios: +4,011 líneas
  • Componentes:
    - 6 migraciones SQL (schemas payroll + fx)
    - 6 archivos engine (types, loaders, calculators)
    - 3 endpoints API
    - 3 páginas UI
    - Documentación completa (README.md)
    - Seed data con parámetros legales Chile 2026
```

##### **6 Febrero 2026 - Hub y App Access**
```
101a8f2 - feat: phase-1 app access by role (hardcoded, safe) (6 horas ago)
  • Archivos: 10 modificados
  • Cambios: +275 líneas
  • Implementación:
    - src/lib/app-access.ts (control de acceso hardcoded)
    - src/lib/app-keys.ts (keys de aplicaciones)
    - Integración en sidebar y rutas
    - Documentación actualizada

cd8ab5b - feat: Implementar Hub ejecutivo con KPIs y apps launcher (7 horas ago)
  • Archivos: 10 modificados
  • Cambios: +751, -217 líneas
  • Componentes:
    - Hub ejecutivo en /hub
    - KPIs de presentaciones (total, enviadas, vistas, conversión)
    - Apps launcher con placeholders CRM/CPQ
    - Work queue (futuro)
```

##### **6 Febrero 2026 - Generación PDF y Contacto**
```
460d546 - feat: actualizar links de agendamiento a Google Calendar (6 horas ago)
25bdc95 - feat: rediseño completo del PDF - más compacto y profesional (6 horas ago)
69c5b7c - fix: permitir múltiples páginas en PDF para contenido completo (6 horas ago)
f7cf6db - fix: usar @sparticuz/chromium para soporte completo en Vercel (6 horas ago)
5232f8a - fix: usar datos fijos de GARD en footer y secciones de contacto (6 horas ago)
8a0e569 - fix: corregir email de contacto y habilitar Playwright en Vercel (6 horas ago)
3494327 - fix: Corregir generación de PDF y actualizar información de contacto (6 horas ago)
```

##### **6 Febrero 2026 - Sistema de Autenticación**
```
cf294b4 - feat: Implementar sistema completo de autenticación (6 horas ago)
  • Archivos: 16 creados/modificados
  • Cambios: +974, -44 líneas
  • Características:
    - Forgot password flow completo
    - Reset password con tokens
    - Página de perfil con cambio de contraseña
    - LoginForm componentizado
    - Integración con NextAuth v5
    - Migración para PasswordResetToken
```

#### **Semana Anterior (Enero 30 - Febrero 5)**

##### **5 Febrero 2026 - Mejoras UI**
```
acfa49c - fix: Uniformar altura de todos los KPIs (7 horas ago)
2ea7346 - fix: Agregar filtro 'sent' para KPI Enviadas (7 horas ago)
5504eb5 - fix: Sincronizar filtro de KPIs con PresentationsList (7 horas ago)
3d7b314 - feat: Agregar mejoras UI en Documentos (7 horas ago)
  • Nuevos componentes:
    - DocumentosContent.tsx
    - ReloadButton.tsx
    - Templates page
```

##### **5 Febrero 2026 - Zoho Integration**
```
e5a4b5e - fix: Usar body RAW para verificar HMAC signature (8 horas ago)
70c3156 - fix: Actualizar URL del webhook de Zoho (8 horas ago)
3839b5e - fix: Convertir quoteId a BIGINT en getRecordById (8 horas ago)
```

##### **4 Febrero 2026 - Design System OPAI**
```
997acfc - feat: Implementar Design System OPAI completo + fix Zoho (8 horas ago)
  • Archivos: 249+ creados
  • Cambios: +36,931 líneas (proyecto inicial completo)
  • Stack completo implementado:
    - Next.js 15 con App Router
    - Prisma + PostgreSQL (Neon)
    - NextAuth v5
    - TailwindCSS + shadcn/ui
    - Framer Motion
    - Playwright PDF generation
    - Resend emails
```

#### **Enero 2026 - Base y RBAC**
```
0ce6760 - docs: add comprehensive user management documentation
cf144b0 - feat: complete dark mode redesign and role management
87e11c7 - fix: handle undefined users in usuarios page
d8090a2 - fix: update seed.ts to use status field
db31372 - fix: rebuild users.ts and add missing UI components
42bdb7c - fix: login server action - proper redirect handling
f4aa3dc - fix: auth query - use findUnique with status validation
ab5b8ba - feat: implement user management with email invitations and RBAC
```

---

## 3. 🏗️ ARQUITECTURA DEL SISTEMA {#arquitectura}

### 3.1 Arquitectura General

**Tipo:** Single-Domain MONOREPO Multi-tenant  
**Patrón:** Jamstack + Server Components (Next.js 15)  
**Renderizado:** Server-Side Rendering (SSR) + Static Generation

```
┌─────────────────────────────────────────────────────────────┐
│                     opai.gard.cl                            │
│                  (Single Domain Entry)                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 15 App Router                     │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  (app)     │  │ (templates)│  │   opai/    │            │
│  │  Layout    │  │  Layout    │  │  login/    │            │
│  │  + Auth    │  │  Public    │  │  activate/ │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│       │               │                │                     │
│       ▼               ▼                ▼                     │
│  ┌─────────┐    ┌──────────┐    ┌──────────┐              │
│  │  /hub   │    │ /p/[id]  │    │  Auth    │              │
│  │  /opai  │    │ /preview │    │  Routes  │              │
│  │  /crm   │    │/templates│    │          │              │
│  │  /cpq   │    │          │    │          │              │
│  │/payroll │    │          │    │          │              │
│  └─────────┘    └──────────┘    └──────────┘              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Middleware Layer                          │
│  • NextAuth Session Resolution                               │
│  • Tenant Resolution (from user.tenantId)                    │
│  • RBAC Enforcement                                          │
│  • Public Route Bypass                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Business Logic Layer                        │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Server Actions  │  │   API Routes     │                │
│  │  (RSC)           │  │   (/api/*)       │                │
│  └──────────────────┘  └──────────────────┘                │
│           │                      │                           │
│           └──────────┬───────────┘                          │
│                      ▼                                       │
│         ┌────────────────────────┐                          │
│         │  Prisma ORM Client     │                          │
│         └────────────────────────┘                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL (Neon Serverless)                    │
│                                                              │
│  Schemas:                                                    │
│  • public   → core, auth, docs, admin                       │
│  • payroll  → parameter_versions, assumptions, simulations  │
│  • fx       → uf_rates, utm_rates                           │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Multi-tenancy

**Estrategia:** Shared Database + Discriminator Column (`tenant_id`)

**Phase 1 (ACTUAL):**
- ✅ Multi-tenant estructural (todas las tablas tienen `tenant_id`)
- ✅ UX single-tenant (sin selector de tenant en UI)
- ✅ Resolución automática desde sesión del usuario
- ✅ Un usuario = un tenant (tabla `Admin.tenantId`)

**Phase 2 (FUTURO):**
- 🔜 Tenant switcher UI
- 🔜 Memberships multi-tenant (guardias, multi-empresa)
- 🔜 Row Level Security (RLS) en PostgreSQL

### 3.3 Seguridad

**Capas de Seguridad Implementadas:**

1. **Autenticación (NextAuth v5):**
   - ✅ Credenciales (email + password bcrypt)
   - ✅ Session management con JWT
   - ✅ Forgot password flow
   - ✅ Account activation con tokens

2. **Autorización (RBAC):**
   - ✅ 4 roles: owner, admin, editor, viewer
   - ✅ App access control (hardcoded Phase 1)
   - ✅ Server-side enforcement
   - ✅ UI-level restrictions

3. **Tenant Isolation:**
   - ✅ Queries filtradas por `tenant_id`
   - ✅ Middleware enforcement
   - ⚠️ RLS pendiente (Phase 2)

4. **Seguridad de Datos:**
   - ✅ Passwords hasheados (bcryptjs)
   - ✅ Tokens con expiración
   - ✅ HTTPS only en producción
   - ✅ Environment variables protegidas

---

## 4. 🧩 MÓDULOS IMPLEMENTADOS {#módulos-implementados}

### 4.1 ✅ Hub Ejecutivo (`/hub`)

**Estado:** OPERATIVO  
**Acceso:** owner, admin  
**Ruta:** `src/app/(app)/hub/page.tsx`

**Características:**
- KPIs consolidados de presentaciones
- Apps launcher (Docs, CRM, CPQ, Payroll)
- Work queue (placeholder)
- Diseño con Design System OPAI

**KPIs Mostrados:**
- Total Presentaciones
- Enviadas por Email
- Vistas Totales
- Sin Leer
- Tasa de Conversión

### 4.2 ✅ Docs/Presentaciones (`/opai/inicio`)

**Estado:** OPERATIVO  
**Acceso:** owner, admin, editor, viewer  
**Rutas:**
- Dashboard: `/opai/inicio`
- Vista pública: `/p/[uniqueId]`
- Preview: `/preview/[sessionId]`

**Características:**
- ✅ 24 secciones estructuradas
- ✅ Diseño premium (glassmorphism, gradients)
- ✅ Sistema de tokens dinámicos `[ACCOUNT_NAME]`
- ✅ PDF generation con Playwright
- ✅ Email tracking (opens, clicks, views)
- ✅ Modo preview admin con sidebar
- ✅ 100% responsive
- ✅ Integración Zoho CRM (legacy)
- ✅ Envío de emails con Resend

**Secciones de Template:**
1. Hero
2. Executive Summary
3. Transparencia
4. Riesgo
5. Fallas del Modelo Tradicional
6. Costo Real vs Aparente
7. Sistema de 4 Capas
8. Cuatro Pilares
9. Cómo Operamos
10. Supervisión
11. Reportabilidad
12. Cumplimiento
13. Certificaciones
14. Tecnología
15. Selección de Personal
16. Nuestra Gente
17. Continuidad
18. KPIs
19. Resultados
20. Clientes
21. Sectores
22. (reservado)
23. Propuesta Económica
24. Términos y Condiciones
25. Comparación
26. Por Qué Nos Eligen
27. Plan de Implementación
28. Cierre
29. Contacto

### 4.3 ✅ Gestión de Usuarios (`/opai/usuarios`)

**Estado:** OPERATIVO  
**Acceso:** owner, admin  
**Ruta:** `src/app/(app)/opai/usuarios/page.tsx`

**Características:**
- ✅ Listado de usuarios activos
- ✅ Invitación por email (Resend)
- ✅ Gestión de roles (RBAC)
- ✅ Activación de cuentas
- ✅ Cambio de contraseña
- ✅ Tabla de invitaciones pendientes

**Roles Implementados:**
- **owner:** Acceso total + gestión de usuarios
- **admin:** Acceso total sin gestión de usuarios
- **editor:** Crear/editar presentaciones, acceso a CRM/CPQ
- **viewer:** Solo lectura de presentaciones

### 4.4 ✅ Autenticación (`/opai/login`, `/activate`, etc.)

**Estado:** OPERATIVO  
**Acceso:** Público  
**Rutas:**
- Login: `/opai/login`
- Activación: `/activate?token=xxx`
- Forgot password: `/opai/forgot-password`
- Reset password: `/opai/reset-password?token=xxx`
- Perfil: `/opai/perfil`

**Características:**
- ✅ Login con email/password
- ✅ Activación de cuenta con token
- ✅ Forgot password flow completo
- ✅ Reset password seguro
- ✅ Cambio de contraseña en perfil
- ✅ Logout
- ✅ Sesiones persistentes

### 4.5 ✅ Payroll (`/payroll`)

**Estado:** OPERATIVO (Phase 1)  
**Acceso:** owner, admin, editor  
**Fecha implementación:** 6 Febrero 2026  
**Rutas:**
- Dashboard: `/payroll`
- Simulador: `/payroll/simulator`
- Parámetros: `/payroll/parameters`

**Características Implementadas:**

#### **Engine de Cálculo:**
- ✅ Cálculo de costo empleador (`computeEmployerCost`)
- ✅ Simulación de liquidación (`simulatePayslip`)
- ✅ Cálculo de impuesto único (tabla SII)
- ✅ Carga de parámetros versionados
- ✅ Resolución de UF/UTM desde FX

#### **Parámetros Legales Chile:**
- ✅ AFP: 10% + comisión (7 AFPs)
  - Capital: 1.44%
  - Cuprum: 1.44%
  - Habitat: 1.27%
  - Modelo: 0.58%
  - Planvital: 1.16%
  - Provida: 1.45%
  - UNO: 0.49%
- ✅ SIS: 1.54% empleador
- ✅ Salud: Fonasa 7% / Isapre variable
- ✅ AFC desglosado:
  - Indefinido: trabajador 0.6%, empleador 2.4% (1.6% CIC + 0.8% FCS)
  - Plazo fijo: trabajador 0%, empleador 3.0% (2.8% CIC + 0.2% FCS)
- ✅ Topes 2026: 89.9 UF / 135.1 UF
- ✅ Impuesto Único: 8 tramos tabla SII en CLP
- ✅ Mutual: 0.95% default (configurable)

#### **API Endpoints:**
- ✅ `POST /api/payroll/costing/compute` - Costo empleador
- ✅ `POST /api/payroll/simulator/compute` - Simulación completa
- ✅ `GET /api/payroll/parameters` - Obtener parámetros
- ✅ `POST /api/payroll/parameters` - Crear versión

#### **Base de Datos:**
- ✅ Schema `payroll`:
  - `parameter_versions` - Versiones de parámetros legales
  - `assumptions` - Provisiones y configuraciones
  - `simulations` - Snapshots inmutables
  - `salary_components_catalog` - Catálogo de conceptos
- ✅ Schema `fx`:
  - `uf_rates` - Valores UF diarios
  - `utm_rates` - Valores UTM mensuales

#### **Arquitectura:**
- ✅ Snapshots inmutables (auditoría)
- ✅ Versionado de parámetros
- ✅ Separación FX (UF/UTM)
- ✅ Determinístico y reproducible

**Limitaciones Actuales (Phase 1):**
- ⚠️ Gratificación: calculada pero no visible en parámetros
- ⚠️ Asignación Familiar: NO implementada
- ⚠️ Horas Extra: estructura básica
- ⚠️ Días trabajados/ausencias: NO implementado
- ⚠️ Descuentos voluntarios: NO implementados
- ⚠️ APV: NO implementado
- ⚠️ Pensión alimenticia: NO implementada

**Documentación:**
- ✅ `PAYROLL-IMPLEMENTATION.md` - Implementación completa
- ✅ `PAYROLL-ROADMAP.md` - Roadmap técnico
- ✅ `src/modules/payroll/README.md` - Documentación del módulo

### 4.6 🔜 CRM (Placeholder)

**Estado:** PLACEHOLDER  
**Acceso:** owner, admin, editor  
**Ruta:** `src/app/(app)/crm/page.tsx`

**Implementado:**
- ✅ Ruta navegable
- ✅ Layout con sidebar
- ✅ Mensaje "Coming Soon"

**Pendiente:**
- ❌ Pipeline de ventas
- ❌ Gestión de contactos
- ❌ Actividades y tareas
- ❌ Integración email
- ❌ IA de seguimiento

### 4.7 🔜 CPQ (Placeholder)

**Estado:** PLACEHOLDER  
**Acceso:** owner, admin, editor  
**Ruta:** `src/app/(app)/cpq/page.tsx`

**Implementado:**
- ✅ Ruta navegable
- ✅ Layout con sidebar
- ✅ Mensaje "Coming Soon"

**Pendiente:**
- ❌ Catálogo de productos
- ❌ Configurador
- ❌ Pricing engine
- ❌ Generación de cotizaciones
- ❌ Integración con Payroll

---

## 5. 🗄️ BASE DE DATOS {#base-de-datos}

### 5.1 Provider y Configuración

**Provider:** PostgreSQL (Neon Serverless)  
**ORM:** Prisma 6.19.2  
**Schemas:** `public`, `payroll`, `fx`  
**Multi-schema:** Habilitado (previewFeatures: ["multiSchema"])

### 5.2 Tablas por Schema

#### **Schema `public` (Core + Auth + Docs)**

| Tabla | Propósito | Registros (est.) |
|-------|-----------|------------------|
| `Tenant` | Multi-tenancy base | ~1-10 |
| `Admin` | Usuarios del sistema | ~5-50 |
| `UserInvitation` | Invitaciones pendientes | ~0-20 |
| `PasswordResetToken` | Tokens de reset password | ~0-10 |
| `Template` | Templates de presentaciones | ~5 |
| `Presentation` | Propuestas comerciales | ~50-500 |
| `PresentationView` | Tracking de vistas | ~100-5000 |
| `WebhookSession` | Sesiones de Zoho | ~50-500 |
| `AuditLog` | Logs de auditoría | ~1000+ |
| `Setting` | Configuraciones | ~10-50 |

**Total tablas public:** 10

#### **Schema `payroll` (Nóminas)**

| Tabla | Propósito | Registros (est.) |
|-------|-----------|------------------|
| `parameter_versions` | Versiones de parámetros legales | ~10-50 |
| `assumptions` | Provisiones y configuraciones | ~5-20 |
| `simulations` | Snapshots de simulaciones | ~100-10000 |
| `salary_components_catalog` | Catálogo de conceptos | ~30-50 |

**Total tablas payroll:** 4

#### **Schema `fx` (Financial Rates)**

| Tabla | Propósito | Registros (est.) |
|-------|-----------|------------------|
| `uf_rates` | Valores UF diarios | ~365/año |
| `utm_rates` | Valores UTM mensuales | ~12/año |

**Total tablas fx:** 2

**TOTAL GENERAL:** 16 tablas

### 5.3 Migraciones

**Total migraciones:** 20

**Schema `public` (13 migraciones):**
1. `20260128000001_init` - Setup inicial
2. `20260128000002_add_tenant` - Multi-tenancy
3. `20260128000003_add_webhook_session` - Zoho
4. `20260128000004_add_templates` - Templates
5. `20260128000005_add_presentations` - Presentaciones
6. `20260128000006_add_views` - Tracking
7. `20260128000007_add_email_tracking` - Email events
8. `20260129000001_add_admin` - Usuarios
9. `20260129000002_add_user_invitations` - Invitaciones
10. `20260130000001_add_audit_log` - Auditoría
11. `20260130000002_add_settings` - Settings
12. `20260201000001_add_status_to_admin` - Status usuarios
13. `20260202000001_add_password_reset_token` - Password reset

**Schema `payroll` + `fx` (6 migraciones):**
14. `20260207000001_create_payroll_and_fx_schemas` - Schemas
15. `20260207000002_create_fx_rates_tables` - UF/UTM
16. `20260207000003_create_payroll_parameter_versions` - Parámetros
17. `20260207000004_create_payroll_assumptions` - Assumptions
18. `20260207000005_create_payroll_simulations` - Simulaciones
19. `20260207000006_create_payroll_salary_components` - Catálogo

**Estado:** ✅ Todas aplicadas en producción

### 5.4 Índices

**Total índices estimados:** ~60+

**Índices críticos:**
- `tenant_id` en todas las tablas de negocio
- `email` en Admin (unique)
- `uniqueId` en Presentation (unique)
- `token` en UserInvitation, PasswordResetToken (unique)
- `status` en Admin, Presentation
- `createdAt DESC` en Presentation, AuditLog
- `effectiveFrom DESC` en PayrollParameterVersion
- `date DESC` en FxUfRate, FxUtmRate

### 5.5 Seed Data

**Archivo:** `prisma/seed.ts` + `prisma/seeds/payroll-initial-data.ts`

**Datos iniciales:**
- ✅ 1 Tenant por defecto (Gard Security)
- ✅ 1 Admin owner
- ✅ 5 Templates base
- ✅ Parámetros Payroll Chile Febrero 2026
- ✅ UF: $39,703.50 (1-feb-2026)
- ✅ UTM: $69,611 (feb-2026)

---

## 6. 🔐 AUTENTICACIÓN Y AUTORIZACIÓN {#autenticación}

### 6.1 Stack de Autenticación

**Provider:** NextAuth v5 (Auth.js)  
**Strategy:** Credentials (email + password)  
**Session Storage:** JWT (stateless)  
**Password Hashing:** bcryptjs

### 6.2 Flujos Implementados

#### **1. Login**
```
Usuario → /opai/login
  → LoginForm (client component)
    → Server Action: signInAction()
      → NextAuth signIn("credentials")
        → authorize() callback
          → Prisma query Admin (email + tenantId)
            → bcrypt.compare(password)
              → ✅ Session JWT creado
                → Redirect /opai/inicio
```

**Validaciones:**
- Email válido
- Password no vacío
- Usuario existe
- Status = "active"
- Tenant activo
- Password correcto

#### **2. Activación de Cuenta**
```
Invitación → Email con link
  → /activate?token=xxx
    → Verificar token (UserInvitation)
      → Validar expiración
        → Form: nombre + password
          → Server Action: activateAccount()
            → Hash password (bcrypt)
              → Crear Admin
                → Marcar invitación aceptada
                  → Auto-login
                    → Redirect /opai/inicio
```

#### **3. Forgot Password**
```
Usuario → /opai/forgot-password
  → ForgotPasswordForm
    → Server Action: requestPasswordReset()
      → Verificar email existe
        → Crear PasswordResetToken (expira 1h)
          → Enviar email (Resend)
            → Email con link /opai/reset-password?token=xxx
```

#### **4. Reset Password**
```
Email → Click link
  → /opai/reset-password?token=xxx
    → ResetPasswordForm
      → Verificar token válido
        → Form: nueva password + confirmación
          → Server Action: resetPassword()
            → Hash nueva password
              → Update Admin.password
                → Marcar token usado
                  → Redirect /opai/login (mensaje éxito)
```

#### **5. Cambio de Contraseña (Perfil)**
```
Usuario logueado → /opai/perfil
  → ChangePasswordForm
    → Server Action: changePassword()
      → Verificar password actual correcta
        → Validar nueva password
          → Hash nueva password
            → Update Admin.password
              → Mensaje éxito
```

### 6.3 RBAC (Role-Based Access Control)

**Archivo:** `src/lib/rbac.ts`

**Roles Implementados:**
```typescript
type Role = 'owner' | 'admin' | 'editor' | 'viewer';
```

**Permisos por Rol:**

| Acción | owner | admin | editor | viewer |
|--------|-------|-------|--------|--------|
| Ver presentaciones | ✅ | ✅ | ✅ | ✅ |
| Crear presentaciones | ✅ | ✅ | ✅ | ❌ |
| Editar presentaciones | ✅ | ✅ | ✅ | ❌ |
| Eliminar presentaciones | ✅ | ✅ | ❌ | ❌ |
| Enviar emails | ✅ | ✅ | ✅ | ❌ |
| Gestionar usuarios | ✅ | ✅ | ❌ | ❌ |
| Invitar usuarios | ✅ | ✅ | ❌ | ❌ |
| Cambiar roles | ✅ | ❌ | ❌ | ❌ |
| Acceder Hub | ✅ | ✅ | ❌ | ❌ |
| Acceder CRM | ✅ | ✅ | ✅ | ❌ |
| Acceder CPQ | ✅ | ✅ | ✅ | ❌ |
| Acceder Payroll | ✅ | ✅ | ✅ | ❌ |

### 6.4 App Access (Hardcoded Phase 1)

**Archivo:** `src/lib/app-access.ts`

**Matriz de Acceso:**
```typescript
const APP_ACCESS_MATRIX: Record<Role, AppKey[]> = {
  owner: ['hub', 'docs', 'crm', 'cpq', 'payroll', 'ops', 'admin'],
  admin: ['hub', 'docs', 'crm', 'cpq', 'payroll', 'ops', 'admin'],
  editor: ['hub', 'docs', 'crm', 'cpq', 'payroll'],
  viewer: ['docs'], // Solo lectura
};
```

**Función de Verificación:**
```typescript
export function hasAppAccess(role: Role, appKey: AppKey): boolean {
  const allowedApps = APP_ACCESS_MATRIX[role];
  return allowedApps.includes(appKey);
}
```

**Integración:**
- ✅ Sidebar (oculta apps no permitidas)
- ✅ Route protection (server-side)
- ✅ Middleware enforcement

**Evolución a Phase 2:**
- Migrar a tabla `app_permissions` en DB
- Permitir configuración por tenant
- Roles customizados

### 6.5 Seguridad de Tokens

**UserInvitation Tokens:**
- Generación: `nanoid(32)`
- Expiración: 7 días
- Uso único: marcado `acceptedAt`
- Revocable: campo `revokedAt`

**PasswordResetToken:**
- Generación: `nanoid(32)`
- Expiración: 1 hora
- Uso único: marcado `usedAt`
- No reutilizable

**Session JWT:**
- Duración: 30 días (configurable)
- Renovación automática
- HttpOnly cookie
- Secure en producción

---

## 7. 🔌 INTEGRACIONES {#integraciones}

### 7.1 Resend (Email Provider)

**Estado:** ✅ OPERATIVO  
**Package:** `resend@6.9.1`  
**Archivo:** `src/lib/resend.ts`

**Emails Implementados:**

1. **Invitación de Usuario**
   - Template: `src/emails/UserInvitation.tsx`
   - Subject: "Invitación a OPAI - Gard Security"
   - Contenido: Link de activación, rol asignado
   - Variables: `{invitedBy, role, activationUrl}`

2. **Presentación Comercial**
   - Template: `src/emails/PresentationEmail.tsx`
   - Subject: Personalizado (desde Zoho o admin)
   - Contenido: Vista previa, link a presentación, CTA
   - Variables: `{recipientName, senderName, presentationUrl}`

3. **Reset Password**
   - Template: React Email component
   - Subject: "Restablecer contraseña - OPAI"
   - Contenido: Link de reset (expira 1h)
   - Variables: `{resetUrl, email}`

**Tracking Implementado:**
- ✅ Email sent (Presentation.emailSentAt)
- ✅ Email delivered (Presentation.deliveredAt)
- ✅ Email opened (Presentation.firstOpenedAt, openCount)
- ✅ Link clicked (Presentation.lastClickedAt, clickCount)

**Webhook:** `/api/webhook/resend/route.ts`

### 7.2 Zoho CRM (Legacy)

**Estado:** ✅ OPERATIVO (legacy, en transición)  
**Propósito:** Importar datos de cotizaciones desde Zoho  
**Archivo:** `src/app/api/webhook/zoho/route.ts`

**Flujo:**
1. Deluge script en Zoho envía webhook
2. HMAC signature verification
3. Creación de WebhookSession
4. Mapeo de datos Zoho → Presentation
5. Auto-generación de presentación
6. Tracking de conversión

**Webhook Endpoint:** `POST /api/webhook/zoho`

**Datos Importados:**
- Account Name
- Contact Name / Email
- Quote Details
- Pricing
- Services

**Seguridad:**
- ✅ HMAC-SHA256 signature
- ✅ Secret key en env
- ✅ Raw body verification

**Nota:** Zoho será reemplazado por CRM OPAI en Phase 2.

### 7.3 Playwright (PDF Generation)

**Estado:** ✅ OPERATIVO  
**Package:** `playwright-core@1.58.2` + `@sparticuz/chromium@143.0.4`  
**Archivo:** `src/app/api/pdf/generate-pricing-v2/route.ts`

**Características:**
- ✅ Server-side rendering con Chromium
- ✅ PDFs idénticos al preview web
- ✅ Multi-página (contenido completo)
- ✅ Diseño compacto y profesional
- ✅ Compatible con Vercel (serverless)

**Proceso:**
1. Renderizar presentación con datos
2. Launch headless Chromium
3. Navigate to preview page
4. Wait for animations
5. Generate PDF (A4, portrait)
6. Return buffer to client

**Optimizaciones Vercel:**
- ✅ `@sparticuz/chromium` (optimizado para AWS Lambda/Vercel)
- ✅ `playwright-core` (sin browser binaries)
- ✅ Chromium descargado en runtime

### 7.4 FX Rates (Futuro)

**Estado:** 🔜 PLANIFICADO  
**Propósito:** Actualización automática UF/UTM

**Fuentes:**
- UF: SBIF API / CMF API
- UTM: SII API

**Frecuencia:**
- UF: Diaria (lunes-viernes)
- UTM: Mensual (1ro de cada mes)

**Implementación pendiente:**
- ❌ Cron job / Vercel scheduled function
- ❌ API client SBIF/SII
- ❌ Validaciones de datos
- ❌ Notificaciones de errores

---

## 8. 📚 DOCUMENTACIÓN EXISTENTE {#documentación}

### 8.1 Estructura de Documentación

```
docs/
├── 00-product/                    # Documentación de Producto
│   ├── 000-opai-suite-master.md  # Visión global OPAI Suite
│   ├── 001-docs-master.md        # Master módulo Docs
│   └── 010-repo-playbook.md      # Guía de repositorios
│
├── 01-architecture/               # Arquitectura Técnica
│   ├── overview.md               # Visión general
│   ├── monorepo-structure.md     # Estructura MONOREPO
│   ├── multitenancy.md           # Multi-tenancy
│   ├── auth.md                   # Autenticación
│   ├── design-system.md          # Design System OPAI
│   └── adr/                      # Architecture Decision Records
│
├── 02-implementation/             # Implementación
│   ├── checklist-multitenant.md  # Checklist multi-tenant
│   ├── database-schema.md        # Schema DB
│   ├── estado-proyecto.md        # Estado (legacy)
│   └── usuarios-roles.md         # Usuarios y RBAC
│
├── 03-integrations/               # Integraciones
│   ├── zoho-integration.md       # Zoho CRM
│   ├── tokens-zoho.md            # Tokens Zoho
│   └── CODIGO-DELUGE-COMPLETO.md # Script Deluge
│
├── 04-sales/                      # Ventas/Comercial
│   └── presentacion-comercial.md # Template comercial
│
├── 05-pdf-generation/             # PDF
│   └── playwright-pdf.md         # Generación PDF
│
├── CHANGELOG.md                   # Changelog
├── NORMALIZACION-COMPLETADA.md   # Normalización
└── README.md                      # Índice docs
```

### 8.2 Documentación del Proyecto (Root)

```
/
├── README.md                              # README principal
├── PAYROLL-IMPLEMENTATION.md             # Implementación Payroll
├── PAYROLL-ROADMAP.md                    # Roadmap Payroll
├── DESIGN-SYSTEM-IMPLEMENTATION.md       # Design System
├── RECUPERACION-ENV.md                   # Variables de entorno
├── SOLUCION-PLAYWRIGHT.md                # Solución Playwright/Vercel
└── src/modules/payroll/README.md         # Módulo Payroll
```

### 8.3 Documentos Críticos

#### **1. Visión Estratégica**
- `docs/00-product/000-opai-suite-master.md`
  - Propósito de OPAI Suite
  - Principios de arquitectura
  - Roadmap de módulos
  - Multi-tenancy strategy

#### **2. Arquitectura Técnica**
- `docs/01-architecture/monorepo-structure.md`
  - Estructura de carpetas
  - Route groups
  - Convenciones de código
- `docs/01-architecture/multitenancy.md`
  - Estrategia multi-tenant
  - Tenant isolation
  - Phase 1 vs Phase 2

#### **3. Implementaciones Específicas**
- `PAYROLL-IMPLEMENTATION.md`
  - Componentes implementados
  - Fórmulas legales
  - API endpoints
  - Guardrails
- `DESIGN-SYSTEM-IMPLEMENTATION.md`
  - Tokens CSS
  - Componentes OPAI
  - Layouts y route groups
  - Convenciones UI

#### **4. Guías Operativas**
- `RECUPERACION-ENV.md`
  - Variables de entorno
  - Secretos y configuración
  - Setup local
- `docs/02-implementation/usuarios-roles.md`
  - Gestión de usuarios
  - RBAC completo
  - Invitaciones

### 8.4 Estado de la Documentación

✅ **Bien Documentado:**
- Arquitectura general
- Multi-tenancy
- Módulo Payroll
- Design System
- Autenticación y RBAC
- Integración Zoho
- PDF generation

⚠️ **Parcialmente Documentado:**
- API routes (falta OpenAPI/Swagger)
- Testing strategy
- Deployment process
- Monitoring y observability

❌ **Sin Documentar:**
- Módulo CRM (placeholder)
- Módulo CPQ (placeholder)
- Performance guidelines
- Security best practices completas
- Disaster recovery

---

## 9. 🛠️ STACK TECNOLÓGICO {#stack}

### 9.1 Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Next.js** | 15.0.3 | Framework React (App Router) |
| **React** | 18.3.1 | UI Library |
| **TypeScript** | 5.6.3 | Type safety |
| **TailwindCSS** | 3.4.17 | Utility-first CSS |
| **shadcn/ui** | latest | Component library |
| **Framer Motion** | 12.31.0 | Animaciones |
| **Radix UI** | latest | Primitivas accesibles |
| **Lucide React** | 0.563.0 | Iconos |
| **class-variance-authority** | 0.7.1 | Variant styling |
| **tailwind-merge** | 3.4.0 | Merge Tailwind classes |

### 9.2 Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **NextAuth (Auth.js)** | 5.0.0-beta.30 | Autenticación |
| **Prisma** | 6.19.2 | ORM |
| **PostgreSQL** | 16+ (Neon) | Base de datos |
| **bcryptjs** | 3.0.3 | Password hashing |
| **nanoid** | 5.1.6 | ID generation |
| **date-fns** | 4.1.0 | Date utilities |

### 9.3 Integraciones

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Resend** | 6.9.1 | Email provider |
| **React Email** | 5.2.6 | Email templates |
| **Playwright Core** | 1.58.2 | PDF generation |
| **@sparticuz/chromium** | 143.0.4 | Chromium serverless |

### 9.4 Developer Tools

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **ESLint** | latest | Linter (sin configurar) |
| **ts-node** | 10.9.2 | TypeScript execution |
| **dotenv** | 17.2.3 | Environment variables |
| **Autoprefixer** | 10.4.21 | CSS vendor prefixes |
| **PostCSS** | 8.4.31 | CSS transformations |

### 9.5 Hosting y Deployment

| Servicio | Propósito |
|----------|-----------|
| **Vercel** | Hosting Next.js (production) |
| **Neon** | PostgreSQL serverless |
| **Resend** | Email delivery |
| **Vercel Analytics** | (opcional) |

### 9.6 Versiones Críticas

**Node.js:** 22+ (recomendado)  
**npm:** 10+  
**PostgreSQL:** 16+

---

## 10. 📝 TAREAS PENDIENTES {#pendientes}

### 10.1 🔴 CRÍTICO (Corto Plazo)

#### **Payroll - Completitud Legal**
```
Prioridad: ALTA
Fecha límite: Antes de usar en producción
```

1. **Mutual/Ley 16.744 Completa**
   - [ ] Implementar tasa base legal: 0.93%
   - [ ] Tasa adicional: 0% - 3.4% (siniestralidad)
   - [ ] Tasa específica industria seguridad: ~1.2%
   - [ ] Estructura: base + additional + extra
   - [ ] Shortcuts por risk_level

2. **Asignación Familiar**
   - [ ] Implementar 4 tramos por ingreso
   - [ ] Montos por carga
   - [ ] Asignación maternal
   - [ ] Asignación invalidez
   - [ ] Flags: NO imponible, NO tributable

3. **Gratificación Estructurada**
   - [ ] Régimen 25% mensual (tope 4.75 IMM)
   - [ ] Régimen 30% anual utilidades
   - [ ] Flags de imponibilidad
   - [ ] Cálculo tope anual vs mensual

4. **APV (Ahorro Previsional Voluntario)**
   - [ ] Descuento voluntario
   - [ ] Rebaja base tributable (antes impuesto)
   - [ ] Tope UF 600 anuales

5. **IMM Versionado**
   - [ ] Tabla de Ingreso Mínimo Mensual
   - [ ] Fecha vigencia
   - [ ] Usado en gratificación y asignación familiar

#### **Base de Datos**
```
Prioridad: ALTA
```

6. **Poblar Catálogo de Conceptos**
   - [ ] 20+ conceptos estándar con flags
   - [ ] Haberes imponibles
   - [ ] Haberes no imponibles
   - [ ] Descuentos legales
   - [ ] Descuentos voluntarios

#### **Testing**
```
Prioridad: MEDIA-ALTA
```

7. **Validación Payroll**
   - [ ] Casos de prueba vs simulador profesional
   - [ ] Validar con contador/experto previsional
   - [ ] Documentar diferencias (si las hay)

### 10.2 🟡 IMPORTANTE (Mediano Plazo)

#### **Payroll - Funcionalidades Avanzadas**

8. **Días Trabajados y Ausencias**
   - [ ] Licencias médicas (no descuenta)
   - [ ] Permisos sin goce (descuenta)
   - [ ] Vacaciones (no descuenta)
   - [ ] Inasistencias (descuenta)
   - [ ] Cálculo días hábiles vs corridos

9. **Horas Extra Completas**
   - [ ] HE 50% (días hábiles)
   - [ ] HE 100% (domingos/festivos)
   - [ ] Validación límites (2h/día, 12h/semana)
   - [ ] Cálculo valor hora correcto
   - [ ] Imponibilidad

10. **Descuentos Judiciales**
    - [ ] Pensión alimenticia (% o monto)
    - [ ] Embargo judicial
    - [ ] Retención judicial
    - [ ] Ley de prelación

#### **FX Rates (Automatización)**

11. **Actualización Automática UF/UTM**
    - [ ] Cron job / Vercel scheduled function
    - [ ] API client SBIF/CMF (UF)
    - [ ] API client SII (UTM)
    - [ ] Validaciones de datos
    - [ ] Notificaciones de errores
    - [ ] Fallback a valores manuales

#### **CRM - Implementación Básica**

12. **Pipeline de Ventas**
    - [ ] Modelo de datos (Deal, Stage, Activity)
    - [ ] UI de pipeline (kanban)
    - [ ] Creación/edición de deals
    - [ ] Movimiento entre stages

13. **Gestión de Contactos**
    - [ ] Modelo de datos (Contact, Company)
    - [ ] CRUD contactos
    - [ ] UI de listado/detalle
    - [ ] Búsqueda y filtros

14. **Actividades y Tareas**
    - [ ] Modelo de datos (Activity, Task)
    - [ ] Asociación con deals/contactos
    - [ ] Timeline de actividades
    - [ ] Recordatorios

#### **CPQ - Implementación Básica**

15. **Catálogo de Productos**
    - [ ] Modelo de datos (Product, Category)
    - [ ] Estructura de servicios Gard
    - [ ] Pricing base
    - [ ] UI de catálogo

16. **Configurador de Cotizaciones**
    - [ ] Selección de productos
    - [ ] Cálculo de precios
    - [ ] Descuentos y márgenes
    - [ ] Integración con Payroll (costo empleador)

17. **Generación de Cotizaciones**
    - [ ] Template de cotización PDF
    - [ ] Email de envío
    - [ ] Tracking de aceptación

### 10.3 🟢 DESEABLE (Largo Plazo)

#### **Payroll - Payroll Real (Gard Ops)**

18. **Integración con Asistencia**
    - [ ] Importar días trabajados reales
    - [ ] Sincronizar licencias médicas
    - [ ] Importar horas extra autorizadas
    - [ ] Cálculo automático gratificación anual

19. **Libro de Remuneraciones**
    - [ ] Generación libro mensual
    - [ ] Formato F1887 (Previred)
    - [ ] Export a planilla electrónica

20. **Certificados Oficiales**
    - [ ] PDF liquidación oficial
    - [ ] Certificado de sueldo
    - [ ] Finiquito electrónico

21. **Integraciones Previred**
    - [ ] Declaración automática
    - [ ] Certificados AFP
    - [ ] Declaración Isapres

#### **Arquitectura**

22. **Multi-tenancy Phase 2**
    - [ ] Tenant switcher UI
    - [ ] Memberships multi-tenant
    - [ ] Row Level Security (RLS) PostgreSQL
    - [ ] Tenant-specific configurations

23. **App Access Phase 2**
    - [ ] Migrar a tabla `app_permissions`
    - [ ] Configuración por tenant
    - [ ] Roles customizados
    - [ ] UI de gestión de permisos

#### **Calidad y Testing**

24. **Testing Completo**
    - [ ] Unit tests (Vitest/Jest)
    - [ ] Integration tests
    - [ ] E2E tests (Playwright)
    - [ ] CI/CD pipeline

25. **Performance**
    - [ ] Optimización de queries
    - [ ] Caching strategy (Redis?)
    - [ ] Image optimization
    - [ ] Bundle analysis

26. **Monitoring y Observability**
    - [ ] Error tracking (Sentry?)
    - [ ] Performance monitoring
    - [ ] Logs centralizados
    - [ ] Alertas

#### **Documentación**

27. **API Documentation**
    - [ ] OpenAPI/Swagger specs
    - [ ] Postman collection
    - [ ] API versioning

28. **Developer Docs**
    - [ ] Onboarding guide
    - [ ] Contributing guidelines
    - [ ] Code standards
    - [ ] Architecture diagrams

#### **DevOps**

29. **CI/CD**
    - [ ] GitHub Actions setup
    - [ ] Automated testing
    - [ ] Preview deployments
    - [ ] Production deployment

30. **Backup y Recovery**
    - [ ] Database backups (Neon automático)
    - [ ] Disaster recovery plan
    - [ ] Data export/import tools

---

## 11. ⚠️ DEUDA TÉCNICA {#deuda-técnica}

### 11.1 🔴 CRÍTICA

#### **1. Payroll - Parámetros Legales Incompletos**
```
Impacto: ALTO
Esfuerzo: MEDIO
Prioridad: CRÍTICA
```

**Problema:**
- Mutual simplificado (solo 0.95% default)
- Asignación Familiar NO implementada
- Gratificación calculada pero no estructurada
- APV NO implementado

**Consecuencia:**
- Simulaciones incorrectas para casos reales
- No apto para producción sin estas mejoras
- Riesgo legal si se usa para liquidaciones reales

**Solución:**
- Implementar TODOS los parámetros críticos (ver sección 10.1)
- Validar con experto previsional
- Testing exhaustivo

#### **2. No hay Tests Automatizados**
```
Impacto: ALTO
Esfuerzo: ALTO
Prioridad: ALTA
```

**Problema:**
- Cero tests unitarios
- Cero tests de integración
- Cero tests E2E
- Regresiones difíciles de detectar

**Consecuencia:**
- Cambios pueden romper funcionalidad existente
- Refactoring riesgoso
- Baja confianza en deploys

**Solución:**
- Setup Vitest para unit tests
- Setup Playwright para E2E
- Coverage mínimo: 60% (crítico), 80% (ideal)
- Tests en CI/CD

#### **3. RLS (Row Level Security) NO Implementado**
```
Impacto: ALTO (seguridad)
Esfuerzo: MEDIO
Prioridad: ALTA
```

**Problema:**
- Isolation de tenant solo en application layer
- Queries podrían escapar tenant_id filter
- Riesgo de data leakage

**Consecuencia:**
- Bug en código podría exponer datos de otros tenants
- No cumple estándares de seguridad multi-tenant

**Solución:**
- Implementar RLS en PostgreSQL
- Políticas por tabla con tenant_id
- Testing de isolation

### 11.2 🟡 MEDIA

#### **4. Zoho Integration (Legacy)**
```
Impacto: MEDIO
Esfuerzo: ALTO
Prioridad: MEDIA
```

**Problema:**
- Dependencia de Zoho CRM
- Deluge script externo
- Migración a CRM OPAI pendiente

**Consecuencia:**
- Coupling con sistema externo
- Mantenimiento complejo
- Funcionalidad limitada

**Solución:**
- Implementar CRM OPAI
- Migrar datos de Zoho
- Deprecar webhook Zoho

#### **5. ESLint NO Configurado**
```
Impacto: BAJO-MEDIO
Esfuerzo: BAJO
Prioridad: MEDIA
```

**Problema:**
- Sin linter configurado
- Code style inconsistente
- Posibles bugs no detectados

**Solución:**
- Setup ESLint + TypeScript
- Prettier para formatting
- Pre-commit hooks

#### **6. Hardcoded App Access**
```
Impacto: MEDIO
Esfuerzo: MEDIO
Prioridad: MEDIA
```

**Problema:**
- App access hardcoded en código
- No configurable por tenant
- Cambios requieren deploy

**Solución:**
- Migrar a tabla `app_permissions`
- UI de configuración
- Roles customizados por tenant

#### **7. Falta Monitoring/Observability**
```
Impacto: MEDIO
Esfuerzo: MEDIO
Prioridad: MEDIA
```

**Problema:**
- Sin error tracking
- Sin logs centralizados
- Sin métricas de performance

**Solución:**
- Sentry para errors
- Vercel Analytics
- Logs estructurados

### 11.3 🟢 BAJA

#### **8. Sidebar Mobile NO Implementado**
```
Impacto: BAJO (UX)
Esfuerzo: BAJO
Prioridad: BAJA
```

**Problema:**
- Sidebar fijo en mobile
- No colapsable
- UX mejorable

**Solución:**
- Drawer component (shadcn)
- Toggle button
- Responsive layout

#### **9. Light Theme NO Implementado**
```
Impacto: BAJO
Esfuerzo: BAJO
Prioridad: BAJA
```

**Problema:**
- Solo dark theme
- Sin toggle de tema

**Solución:**
- Theme toggle component
- CSS variables para light
- Persistencia en localStorage

#### **10. Falta Documentación API**
```
Impacto: BAJO-MEDIO
Esfuerzo: MEDIO
Prioridad: BAJA
```

**Problema:**
- API routes sin documentación OpenAPI
- Difícil de integrar externamente

**Solución:**
- OpenAPI/Swagger specs
- Documentación auto-generada
- Postman collection

---

## 12. 🚀 PRÓXIMOS PASOS RECOMENDADOS {#próximos-pasos}

### Semana 1-2: Payroll Legal Completo

**Objetivo:** Completar parámetros legales críticos de Payroll

**Tareas:**
1. Implementar Mutual completa (base + adicional + industria)
2. Implementar Asignación Familiar (4 tramos vigentes)
3. Estructurar Gratificación (2 regímenes)
4. Implementar APV con rebaja tributaria
5. Poblar `salary_components_catalog` con flags

**Entregables:**
- [ ] Parámetros legales 100% completos
- [ ] Documentación actualizada
- [ ] Validación con contador

### Semana 3: Testing y Validación Payroll

**Objetivo:** Asegurar corrección de cálculos

**Tareas:**
1. Casos de prueba vs simulador profesional
2. Testing con datos reales Gard
3. Validación con experto previsional
4. Documentar diferencias y ajustes

**Entregables:**
- [ ] Informe de validación
- [ ] Test cases documentados
- [ ] Certificación de corrección

### Semana 4: Testing Automatizado

**Objetivo:** Setup de testing infrastructure

**Tareas:**
1. Configurar Vitest para unit tests
2. Tests críticos de Payroll engine
3. Tests de autenticación
4. Tests de RBAC
5. Setup CI/CD básico

**Entregables:**
- [ ] Framework de testing operativo
- [ ] Coverage mínimo 40% en críticos
- [ ] CI pipeline

### Mes 2: CRM Básico

**Objetivo:** Implementar funcionalidad base de CRM

**Tareas:**
1. Modelo de datos (Deal, Contact, Activity)
2. UI de pipeline (kanban básico)
3. CRUD de contactos
4. Timeline de actividades
5. Migración de datos Zoho (si aplica)

**Entregables:**
- [ ] CRM operativo (Phase 1)
- [ ] Migración de Zoho planificada
- [ ] Documentación CRM

### Mes 3: CPQ Básico

**Objetivo:** Configurador de productos y cotizaciones

**Tareas:**
1. Catálogo de servicios Gard
2. Configurador de cotizaciones
3. Integración con Payroll (costo empleador)
4. Template de cotización PDF
5. Workflow de aprobación

**Entregables:**
- [ ] CPQ operativo (Phase 1)
- [ ] Integración Payroll
- [ ] Template PDF

### Mes 4-6: Consolidación y RLS

**Objetivo:** Hardening de seguridad y performance

**Tareas:**
1. Implementar RLS en PostgreSQL
2. Migrar App Access a DB
3. Setup Monitoring (Sentry)
4. Performance optimization
5. Security audit

**Entregables:**
- [ ] RLS implementado y testeado
- [ ] Monitoring operativo
- [ ] Informe de seguridad

---

## 📊 MÉTRICAS Y KPIs DEL PROYECTO

### Código

- **Archivos totales:** ~250+
- **Líneas de código:** ~40,000+
- **Componentes React:** ~80+
- **API routes:** ~15+
- **Server Actions:** ~10+

### Base de Datos

- **Tablas:** 16
- **Migraciones:** 20
- **Índices:** ~60+
- **Schemas:** 3 (public, payroll, fx)

### Módulos

- **Operativos:** 5 (Hub, Docs, Auth, Admin, Payroll)
- **Placeholders:** 2 (CRM, CPQ)
- **Planificados:** 2 (Ops, Portal)

### Documentación

- **Documentos técnicos:** 30+
- **READMEs:** 5+
- **Diagramas:** (pendiente)

### Testing

- **Unit tests:** 0 ⚠️
- **Integration tests:** 0 ⚠️
- **E2E tests:** 0 ⚠️
- **Coverage:** 0% ⚠️

---

## 🎯 CONCLUSIONES

### ✅ Fortalezas del Proyecto

1. **Arquitectura Sólida**
   - MONOREPO bien estructurado
   - Multi-tenancy desde día 1
   - Separación clara de concerns

2. **Stack Moderno**
   - Next.js 15 con App Router
   - TypeScript completo
   - Prisma + PostgreSQL

3. **Funcionalidad Core Completa**
   - Hub ejecutivo operativo
   - Docs/Presentaciones robustos
   - Autenticación completa con RBAC
   - Payroll Phase 1 funcional

4. **Buenas Prácticas**
   - Server Components
   - Type safety
   - Documentación extensiva
   - Commits semánticos

### ⚠️ Áreas de Mejora Prioritarias

1. **Testing**
   - CRÍTICO: Implementar tests automatizados
   - Setup CI/CD

2. **Payroll Legal**
   - CRÍTICO: Completar parámetros legales
   - Validar con experto

3. **Seguridad**
   - ALTA: Implementar RLS
   - Audit de seguridad

4. **Módulos Pendientes**
   - MEDIA: Implementar CRM
   - MEDIA: Implementar CPQ

### 🚀 Recomendaciones Finales

**Corto Plazo (1-2 meses):**
1. Completar Payroll legal (CRÍTICO)
2. Implementar testing básico
3. Setup monitoring

**Mediano Plazo (3-6 meses):**
4. Implementar CRM básico
5. Implementar CPQ básico
6. Implementar RLS

**Largo Plazo (6-12 meses):**
7. Payroll real (integración asistencia)
8. Módulo Ops
9. Portal guardias/clientes
10. Multi-tenancy Phase 2 (UI)

---

## 📞 CONTACTO Y SOPORTE

**Product Owner:** Carlos Irigoyen (Gard Security)  
**Dominio:** opai.gard.cl  
**Repositorio:** gard-docs  
**Última actualización:** 6 de Febrero 2026

---

**© 2026 Gard Security - OPAI Suite**
