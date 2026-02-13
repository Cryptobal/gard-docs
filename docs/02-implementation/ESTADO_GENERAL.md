# Estado General del Proyecto — OPAI Suite

> **Fecha:** 2026-02-11  
> **Estado:** Vigente — se actualiza con cada implementación  
> **Referencia:** `docs/00-product/MASTER_SPEC_OPI.md`

---

## Resumen Ejecutivo

OPAI Suite es una plataforma SaaS para empresas de seguridad que opera en `opai.gard.cl`. Actualmente tiene **9 módulos en producción** y **5 fases futuras** planificadas para expandir hacia operaciones (OPI).

| Dato | Valor |
|------|-------|
| Páginas implementadas | 44 |
| Endpoints API | 135 |
| Modelos de datos (Prisma) | 77 |
| Componentes UI | ~160 |
| Schemas PostgreSQL | 7 (public, crm, cpq, docs, payroll, fx, ops) |
| Roles RBAC | 4 (owner, admin, editor, viewer) |
| Stack | Next.js 15, TypeScript, Prisma, Neon PostgreSQL, Auth.js v5 |
| Deploy | Vercel |

---

## Estado por Módulo

### Hub Ejecutivo

| Aspecto | Detalle |
|---------|---------|
| **Estado** | ✅ Completo |
| **Ruta** | `/hub` |
| **Descripción** | Dashboard ejecutivo con KPIs de presentaciones, work queue, activity feed, app launcher |
| **Acceso** | owner, admin, editor, viewer |

**Funcionalidades:**
- KPIs: total presentaciones, enviadas, vistas, sin leer
- Quick actions: nueva propuesta, invitar usuario
- Apps launcher: acceso a todos los módulos
- Work queue: propuestas pendientes
- Activity feed: visualizaciones recientes
- CRM Global Search integrado

---

### CRM (Customer Relationship Management)

| Aspecto | Detalle |
|---------|---------|
| **Estado** | ✅ Completo |
| **Ruta** | `/crm/*` |
| **Páginas** | 12 |
| **APIs** | 33 endpoints |
| **Modelos** | 25 (schema `crm`) |
| **Acceso** | owner, admin, editor |

**Funcionalidades implementadas:**
- **Leads:** Creación pública/interna, aprobación, conversión a Account+Contact+Deal
- **Accounts:** CRUD completo, RUT, razón social, representante legal, industria, segmento
- **Contacts:** CRUD, vinculación a accounts, roles (primary, participant, decision_maker)
- **Deals:** Pipeline con stages configurables, historial de cambios, probabilidad, cotizaciones vinculadas
- **Installations:** CRUD, geolocalización (lat/lng), vinculación a accounts/leads, metadata
- **Pipeline:** Stages configurables por tenant, marcadores closed-won/closed-lost
- **Email:** Cuentas Gmail OAuth, threads, mensajes, envío, tracking (Resend webhooks)
- **Follow-ups:** Configuración automática por tenant, 2 secuencias, templates personalizables
- **WhatsApp:** Templates editables por tenant con tokens dinámicos
- **Custom Fields:** Campos personalizados configurables por entidad
- **Files:** Upload y vinculación de archivos a entidades
- **Search:** Búsqueda global unificada
- **Industries:** Catálogo de industrias configurable

**Pendiente:**
- Reportes CRM (marcado como disabled en UI)

---

### CPQ (Configure, Price, Quote)

| Aspecto | Detalle |
|---------|---------|
| **Estado** | ✅ Completo |
| **Ruta** | `/cpq/*`, `/crm/cotizaciones/*` |
| **Páginas** | 3 (+2 en CRM) |
| **APIs** | 22 endpoints |
| **Modelos** | 11 (schema `cpq`) |
| **Acceso** | owner, admin, editor |

**Funcionalidades implementadas:**
- **Cotizaciones:** CRUD, código único (CPQ-YYYY-XXX), estados (draft/sent/approved/rejected)
- **Posiciones:** Creación, edición, clonado, cálculo de costo empleador integrado con Payroll
- **Catálogo:** Items configurables (uniformes, exámenes, costos operacionales)
- **Parámetros:** Margen, meses de contrato, horas estándar, cambios de uniforme
- **Comidas:** Configuración por tipo y días de servicio
- **Vehículos:** Renta, combustible, mantención
- **Infraestructura:** Items con combustible (generadores, etc.)
- **AI:** Descripción automática de cotización con OpenAI
- **Export PDF:** Generación de PDF de cotización
- **Envío:** Email de cotización y presentación comercial
- **Clonado:** Clonar cotización completa con posiciones
- **Vinculación CRM:** FK a account, contact, deal, installation

---

### Presentaciones Comerciales

| Aspecto | Detalle |
|---------|---------|
| **Estado** | ✅ Completo |
| **Ruta** | `/opai/inicio`, `/p/[uniqueId]` |
| **Páginas** | 6 |
| **APIs** | 7 endpoints |
| **Modelos** | 3 (schema `public`) |
| **Acceso** | owner, admin, editor (viewer solo lectura); `/p/*` público |

**Funcionalidades implementadas:**
- **Templates:** 29 secciones de presentación comercial de seguridad B2B
- **Generación:** Desde datos de Zoho CRM (webhook) o manual
- **Tracking:** Vistas (IP, device, browser, ubicación), emails (opens, clicks, delivered, bounced)
- **Envío:** Email con template React Email + Resend, CC múltiple
- **Compartir:** WhatsApp directo al contacto, link público copiable
- **Dashboard:** Lista filtrable por vistas, estado email, fecha
- **Preview mode:** Vistas de admin no se contabilizan
- **PDF:** Generación con Playwright + Chromium

---

### Documentos Legales

| Aspecto | Detalle |
|---------|---------|
| **Estado** | ✅ Completo |
| **Ruta** | `/opai/documentos/*` |
| **Páginas** | 6 |
| **APIs** | 8 endpoints |
| **Modelos** | 6 (schema `docs`) |
| **Acceso** | owner, admin, editor (viewer solo lectura) |

**Funcionalidades implementadas:**
- **Templates:** Editor Tiptap con tokens dinámicos por módulo
- **Tokens:** Sistema de tokens resolvibles (account.name, contact.firstName, etc.)
- **Versionado:** Historial de versiones de templates con change notes
- **Documentos:** Generación desde template, resolución de tokens, estados (draft→approved→active→expired)
- **Categorías:** Organización por módulo (CRM, payroll, legal, mail)
- **Asociaciones:** Vinculación a entidades CRM (accounts, deals, installations, contacts)
- **Fechas:** Effective date, expiration date, renewal date, alertas automáticas
- **Firma digital de documentos:** Solo estructura en DB (`signatureStatus`, `signedAt`, `signedBy`, `signatureData`). No hay flujo implementado (ni UI ni API para firmar). Ver sección "Pendiente" más abajo.
- **PDF:** Generación de PDF del documento
- **Historial:** Auditoría de cambios por documento

---

### Payroll (Liquidaciones Chile)

| Aspecto | Detalle |
|---------|---------|
| **Estado** | ⚠️ Parcial (60%) — Fase 1 del módulo completada |
| **Ruta** | `/payroll/*` |
| **Páginas** | 3 |
| **APIs** | 3 endpoints |
| **Modelos** | 4 (schema `payroll`) |
| **Acceso** | owner, admin, editor |

**Implementado:**
- **Simulador:** Cálculo completo de liquidación con desglose
- **Engine:** `computeEmployerCost`, `simulatePayslip`, `taxCalculator`
- **Parámetros:** Versionado de parámetros legales con effective dates
- **AFP:** 10 AFPs con tasas actualizadas + comisión
- **SIS:** 1.54%
- **Salud:** Fonasa 7% / Isapre con plan variable
- **AFC:** CIC (3% empleador) + FCS (0.2% / 2.4%)
- **Topes 2026:** 89.9 UF / 135.1 UF
- **Impuesto Único:** 8 tramos
- **Mutual:** Tasa básica 0.95% default

**Pendiente:**
- Asignación Familiar (no implementada)
- Horas Extra (estructura sin validaciones)
- Días trabajados / ausencias
- Descuentos voluntarios (APV, etc.)
- Pensión alimenticia
- Mutual completo (solo tasa default)

---

### FX (Indicadores Financieros)

| Aspecto | Detalle |
|---------|---------|
| **Estado** | ✅ Completo |
| **APIs** | 3 endpoints |
| **Modelos** | 2 (schema `fx`) |

**Funcionalidades:**
- UF diaria (fuente SBIF)
- UTM mensual (fuente SII)
- Sync automático
- Sync manual con autorización válida (sin `force=true` público)
- Indicadores globales en UI

---

### Configuración

| Aspecto | Detalle |
|---------|---------|
| **Estado** | ✅ Completo |
| **Ruta** | `/opai/configuracion/*` |
| **Páginas** | 9 |
| **Acceso** | owner, admin |

**Funcionalidades:**
- **Usuarios:** CRUD, invitación por email, activación, roles, desactivación
- **Integraciones:** Gmail OAuth (connect, sync, send)
- **Firmas de email:** Editor Tiptap para pie de correo (firmas de email), default por usuario. No es firma digital de contratos.
- **Categorías:** Gestión de categorías de documentos por módulo
- **CRM Config:** Follow-up config, WhatsApp templates
- **CPQ Config:** Catálogo, roles, puestos de trabajo, cargos
- **Payroll Config:** Parámetros legales
- **Email Templates:** Templates de email CRM editables

---

### Auth y RBAC

| Aspecto | Detalle |
|---------|---------|
| **Estado** | ✅ Completo |
| **Páginas** | 4 (login, forgot, reset, activate) |
| **Modelos** | 3 (Admin, UserInvitation, PasswordResetToken) |

**Funcionalidades:**
- Auth.js v5 con Credentials (bcrypt)
- Sesión JWT con id, email, name, role, tenantId
- 4 roles jerárquicos: owner > admin > editor > viewer
- 10 permisos granulares
- Control de acceso a módulos por rol (app-access)
- Control de acceso a submodules (module-access)
- Invitación por email con token seguro
- Activación de cuenta
- Reset de contraseña
- Auditoría de acciones

---

## Qué falta por terminar (de lo que ya tenemos)

Resumen de lo incompleto dentro de los módulos actuales:

| Área | Qué falta | Prioridad sugerida |
|------|-----------|:------------------:|
| **Documentos — Firma digital** | Flujo completo de firma: pantalla "Firmar documento", captura de firma (canvas o proveedor externo), API para actualizar `signatureStatus`/`signedAt`/`signedBy`/`signatureData`, y opcionalmente integración con proveedor (ej. PandaDoc, Firma.cl). Hoy solo existen los campos en el modelo `Document`. | Alta si necesitas contratos firmados desde OPAI |
| **Payroll** | Asignación Familiar (cálculo real desde tramos IPS), Horas Extra con validaciones, días trabajados/ausencias, descuentos voluntarios, APV, pensión alimenticia, mutual completo. | Alta para liquidaciones reales |
| **CRM — Reportes** | Módulo de reportes (conversión pipeline, métricas por etapa, etc.). En la UI está deshabilitado. | Media |
| **Testing** | Tests automatizados (unit + e2e). No hay cobertura actual. | Media |

---

## Tecnologías y Dependencias Principales

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| Framework | Next.js | 15.x |
| Lenguaje | TypeScript | 5.6 |
| ORM | Prisma | 6.19 |
| Base de datos | PostgreSQL (Neon) | — |
| Auth | Auth.js (NextAuth) | 5.0 beta |
| UI | Tailwind CSS + Radix UI + shadcn/ui | 3.4 |
| Animaciones | Framer Motion | 12.x |
| Editor | Tiptap | — |
| Email | Resend | 6.9 |
| AI | OpenAI | 6.18 |
| PDF | Playwright + Chromium | 1.58 |
| Validación | Zod | 4.3 |
| Google | googleapis (Gmail OAuth) | 171.x |
| Deploy | Vercel | — |

---

## Cron Jobs Activos

| Job | Endpoint | Frecuencia | Estado |
|-----|----------|-----------|:------:|
| Follow-up emails | `/api/cron/followup-emails` | Diario | ✅ Activo |
| Document alerts | `/api/cron/document-alerts` | Diario | ✅ Activo |
| FX sync | `/api/fx/sync` | Diario (cron) + manual autorizado | ✅ Activo |

---

## Revisión de avances Fase 1 (2026-02-11)

Resultado de implementación real en repositorio (DB + API + UI):

| Ítem Fase 1 | Evidencia en repositorio | Estado |
|-------------|--------------------------|:------:|
| Modelos `ops`/`personas`/`te` en Prisma | `prisma/schema.prisma` + migración `20260223000000_phase1_ops_te_personas` | ✅ |
| APIs Fase 1 | Rutas `/api/ops/*`, `/api/te/*`, `/api/personas/*` implementadas | ✅ |
| UI Fase 1 | Pantallas `/ops/*`, `/te/*`, `/personas/*` implementadas en `src/app/(app)` | ✅ |
| Control de acceso | Sidebar, command palette y navegación móvil integradas con módulo `ops` | ✅ |
| Base comercial actual | Hub/CRM/CPQ/Docs/Config continúan operativos | ✅ |

### Avances recientes (Fase 1)

Se implementó el flujo MVP end-to-end:

- Puestos operativos (estructura base por instalación).
- Pauta mensual (generación y asignación).
- Asistencia diaria con reemplazo y generación automática de TE.
- Registro y aprobación/rechazo de TE.
- Lotes de pago TE, marcado pagado y exportación CSV bancaria.
- Gestión de guardias y lista negra.

### Refactorización OPS v2 (2026-02-12)

Se ejecutó una refactorización profunda del módulo OPS con los siguientes cambios:

**Base de datos:**
- Nuevo campo `slot_number` en `pauta_mensual` y `asistencia_diaria` (soporte multi-guardia por puesto).
- Nuevo campo `shift_code` en `pauta_mensual` (T=trabaja, -=descanso, V=vacaciones, L=licencia, P=permiso).
- Nueva tabla `serie_asignaciones` (definición de rotaciones: 4x4, 5x2, 7x7, etc.).
- Cambio de constraints: `UNIQUE(puestoId, date)` → `UNIQUE(puestoId, slotNumber, date)` en ambas tablas.
- Campos de bloqueo en asistencia: `locked_at`, `locked_by`, `correction_reason`.

**Puestos operativos (refactorizado):**
- Navegación jerárquica: Cliente → Instalación → Puestos.
- Modal para crear y editar puestos (antes solo formulario inline sin edición).
- Se filtra solo clientes activos con instalaciones activas.

**Pauta mensual (rediseñada):**
- Vista de matriz tipo spreadsheet: filas = puesto/slot/guardia, columnas = días del mes.
- Selector de mes con nombre (Enero, Febrero...) en vez de número.
- Sistema de pintado de series: click en celda → modal con guardia, patrón, posición de inicio → pintar toda la fila.
- Colores diferenciados por estado (T, -, V, L, P).
- Click derecho para ciclar estados especiales.
- Días bloqueados (procesados en asistencia) no editables.

**Asistencia diaria (rediseñada):**
- Renombrada de "Pauta diaria" a "Asistencia diaria".
- Vista multi-instalación con selector Cliente/Instalación y opción "Todas".
- Agrupación por instalación con tabla completa por cada una.
- Columnas: Puesto, Planificado, Real/Reemplazo, Horario, Check In/Out, Estado, Acciones.
- Dashboard de resumen: Total puestos, Cubiertos, PPC, TE, % Cobertura.
- Soporte para slotNumber (múltiples guardias por puesto).

**Turnos Extra en OPS:**
- Nueva página `/ops/turnos-extra` integrada en el SubNav de OPS.
- Muestra TE generados desde asistencia con filtros y acciones de aprobar/rechazar.

**PPC corregido:**
- Lógica corregida: PPC = solo puestos SIN guardia planificado.
- "No asistió" ya NO genera PPC (tiene guardia planificado, se resuelve con reemplazo → TE).
- Incluye PPC por vacaciones, licencia, permiso (guardia ausente con motivo → slot vacío).
- Vista con filtro día/mes y agrupación por instalación.

**SubNav OPS actualizado:**
- 6 tabs: Inicio | Puestos | Pauta mensual | Asistencia diaria | Turnos extra | PPC.

### Asignación de guardias a puestos (2026-02-12)

Se implementó el sistema de asignación de guardias a puestos operativos:

**Base de datos:**
- Nueva tabla `asignacion_guardias` (OpsAsignacionGuardia): vincula guardia → puesto + slot con fechas y historial.
- Nuevos campos en `puestos_operativos`: `puesto_trabajo_id`, `cargo_id`, `rol_id`, `base_salary` (relaciones a catálogos CPQ).

**OPS Puestos operativos (refactorizado):**
- Vista de puestos con slots expandidos mostrando guardia asignado o "Vacante (PPC)".
- Modal de asignación con buscador de guardias disponibles (solo `seleccionado` o `contratado_activo`).
- Desasignación con confirmación (genera PPC automáticamente).
- Colores por lifecycle status: Postulante (gris), Seleccionado (azul), Contratado (verde), Inactivo (amarillo), Desvinculado (rojo).
- Badge Día/Noche con colores diferenciados en cada puesto.

**CRM Instalaciones:**
- Sección "Dotación activa" renombrada a "Puestos operativos" (gestión de puestos).
- Nueva sección "Dotación activa" (read-only): muestra guardias asignados por puesto/slot, leída desde OPS.
- Modal estandarizado compartido con CPQ: tipo puesto, cargo, rol, horario, días, guardias, sueldo base.
- Filtro por estado (Todas/Activas/Inactivas) en listado de instalaciones.
- Botón eliminar puesto con confirmación.
- Badge Día/Noche en horario.

**Ficha del guardia:**
- Nueva sección "Asignación" (primera en la navegación): muestra asignación actual y historial de movimientos.
- Asignación actual: puesto, instalación, cliente, fecha de inicio.
- Historial: todas las asignaciones pasadas con fechas y motivo de cambio.

**Componente compartido:**
- `PuestoFormModal` (`src/components/shared/PuestoFormModal.tsx`): modal reutilizable para crear/editar puestos con catálogos CPQ.

**Documentación:**
- Nuevo glosario de términos: `docs/00-product/GLOSARIO.md`

---

## Qué sigue (recomendación actualizada)

Con la asignación de guardias implementada, el siguiente bloque recomendado es:

1. **Marcación digital de asistencia** ← 🔨 **EN IMPLEMENTACIÓN**  
   Sistema propio de marcación por RUT+PIN+geolocalización. Página pública `/marcar/[code]` para que guardias marquen entrada/salida desde celular. QR por instalación. Cumplimiento Resolución Exenta N°38 DT Chile. Ver `docs/07-etapa-3/ETAPA_3_MARCACION.md`.
2. **Desvinculación automática**  
   Cuando un guardia se desvincula (lifecycle → desvinculado), cerrar su asignación automáticamente y generar PPC.
3. **Pauta mensual: lectura de asignaciones**  
   Al generar pauta, pre-llenar guardias desde `OpsAsignacionGuardia` (no manual).
4. **Cruce con eventos RRHH**  
   Vacaciones/licencia/permiso → marcar en pauta y generar PPC automático.
5. **Bloqueo automático de días**  
   Cuando asistencia se confirma, bloquear en pauta mensual.
6. **Hardening + QA**  
   Tests e2e para asignación, pauta, asistencia, series, TE.

Plan de Marcación digital: `docs/07-etapa-3/ETAPA_3_MARCACION.md`  
Plan de Fase 1: `docs/05-etapa-1/ETAPA_1_IMPLEMENTACION.md`  
Roadmap completo: `docs/00-product/MASTER_SPEC_OPI.md`

---

### Marcación digital (Fase 2 — En implementación)

| Aspecto | Detalle |
|---------|---------|
| **Estado** | 🔨 En implementación |
| **Ruta pública** | `/marcar/[code]` |
| **Normativa** | Resolución Exenta N°38 DT Chile (09/05/2024) |
| **Métodos** | RUT+PIN (conocimiento) + Geolocalización (ubicación) |
| **Modelo nuevo** | `OpsMarcacion` (schema `ops`) |
| **Campos nuevos** | `marcacionPin` en OpsGuardia, `marcacionCode` en CrmInstallation |

**Funcionalidades:**
- Marcación de entrada/salida desde link web (sin app nativa)
- Validación RUT + PIN (4-6 dígitos, hasheado con bcrypt)
- Captura de geolocalización GPS con validación de radio (`geoRadiusM`)
- Hash SHA-256 de integridad por cada marcación (inmutable)
- Sello de tiempo del servidor
- Integración automática con `OpsAsistenciaDiaria` (checkInAt/checkOutAt)
- QR por instalación para escaneo rápido
- Gestión de PIN desde panel admin

**Plan detallado:** `docs/07-etapa-3/ETAPA_3_MARCACION.md`

---

*Este documento refleja el estado real del repositorio al 2026-02-12. Última actualización: Inicio implementación módulo de marcación digital.*
