# Eventos Laborales — Arquitectura e Implementacion

> Documento generado tras auditoría completa del repositorio.
> Fecha: 2026-02-14

---

## 1. Lo que entendí del repo

### 1.1 Stack y estructura

| Capa | Tecnología | Evidencia |
|------|-----------|-----------|
| Framework | Next.js 14+ (App Router) | `src/app/(app)/...`, `src/app/api/...` |
| ORM | Prisma (multi-schema: `public`, `crm`, `ops`, `docs`, `cpq`, `payroll`, `finance`) | `prisma/schema.prisma` |
| Auth | NextAuth v5 (`auth.ts`) | `src/lib/auth.ts`, `src/lib/api-auth.ts` |
| UI | shadcn/ui + Tailwind | `src/components/ui/` |
| Email | Resend | `src/lib/resend.ts` |
| Storage | Supabase Storage (uploads) | `src/lib/supabase.ts` |
| Permisos | RBAC v2 granular (módulo/submódulo/capability) | `src/lib/permissions.ts` |
| Documentos | Tiptap JSON + tokens/placeholders + render PDF | `src/lib/docs/token-registry.ts`, `token-resolver.ts` |

### 1.2 Módulos relevantes (con rutas)

#### Ficha de Guardia
- **Page**: `src/app/(app)/personas/guardias/[id]/page.tsx`
- **Client component**: `src/components/ops/GuardiaDetailClient.tsx`
- **API CRUD**: `src/app/api/personas/guardias/route.ts`, `[id]/route.ts`
- **Prisma model**: `OpsGuardia` → tabla `guardias` (schema `ops`)
- Incluye: persona, bankAccounts, comments, documents, historyEvents, asignaciones
- **NO existe** pestaña de "Eventos laborales" ni endpoint para registrar ausencias/finiquitos

#### Documentos (Templates + Generación)
- **Templates API**: `src/app/api/templates/route.ts`
- **Documents API**: `src/app/api/docs/route.ts`
- **Token registry**: `src/lib/docs/token-registry.ts` — módulos: account, contact, installation, deal, quote, system, signature
- **Token resolver**: `src/lib/docs/token-resolver.ts` — resuelve Tiptap JSON → texto con valores reales
- **Associations**: `DocAssociation` — vincula documentos a entidades (`entity_type` + `entity_id`)
- **History**: `DocHistory` — log de acciones sobre documentos
- **Signature**: `DocSignatureRequest` — firmas digitales
- **Categorías payroll ya definidas**: `contrato_laboral`, `anexo_contrato`, `finiquito` (en `DOC_CATEGORIES.payroll`)
- **NO existe** categoría para amonestaciones ni cartas de aviso

#### Pauta Mensual
- **API**: `src/app/api/ops/pauta-mensual/route.ts` (GET/POST)
- **Generar**: `src/app/api/ops/pauta-mensual/generar/route.ts`
- **Pintar serie**: `src/app/api/ops/pauta-mensual/pintar-serie/route.ts`
- **Model**: `OpsPautaMensual` — campos clave: `puestoId`, `slotNumber`, `date`, `plannedGuardiaId`, `shiftCode`
- **shiftCode values**: `T` (trabajo), `-` (libre), `V` (vacaciones), `L` (licencia), `P` (permiso)
- **Ya existe lógica** de V/L/P en shiftCode pero **no hay endpoint que los pinte** desde un evento laboral

#### Asistencia Diaria
- **API**: `src/app/api/ops/asistencia/route.ts`
- **Model**: `OpsAsistenciaDiaria` — `attendanceStatus`: pendiente, asistio, no_asistio, reemplazo, ppc
- **Auto-crea** filas desde pauta solo para `shiftCode="T"` (días de trabajo)
- Si shiftCode es V/L/P, **no crea fila de asistencia** (correcto: no se espera que asista)

#### PPC (Puestos Por Cubrir)
- **API**: `src/app/api/ops/ppc/route.ts`
- Detecta slots donde `shiftCode in ["V", "L", "P"]` como motivos de cobertura
- Ya mapea: V → "vacaciones", L → "licencia", P → "permiso"

#### Marcaciones
- **API**: `src/app/api/ops/marcacion/reporte/route.ts`
- **Model**: `OpsMarcacion` — check-in/out con geolocalización, hash SHA-256
- Si guardia está con V/L/P en la pauta, no hay fila de asistencia → **marcación no se espera** (correcto por diseño)

#### Evento RRHH actual (rudimentario)
- **Model**: `OpsEventoRrhh` — tabla `eventos_rrhh` (schema `ops`)
- Campos: `id`, `tenantId`, `guardiaId`, `date` (single date), `type`, `status`, `notes`, `createdBy`, `createdAt`
- **NO tiene**: fecha_fin, rango de fechas, adjuntos, versionado, workflow, integración con documentos
- **NO se usa en ningún endpoint ni componente** del frontend (0 referencias en `src/`)
- Es el punto de partida natural para evolucionar

#### RBAC
- **Permisos**: `src/lib/permissions.ts`
- Submódulo OPS: `guardias`, `pauta_mensual`, `pauta_diaria`, `marcaciones`, `ppc`, etc.
- Capabilities: `te_approve`, `guardias_blacklist`, etc.
- **No existe** capability para aprobar eventos laborales

### 1.3 Deuda técnica detectada

| # | Issue | Impacto |
|---|-------|---------|
| 1 | `OpsEventoRrhh` tiene solo `date` (no rango) | No puede representar vacaciones de N días |
| 2 | `OpsEventoRrhh` no se usa en ningún endpoint/UI | Código muerto |
| 3 | Token registry no tiene módulo `guardia` ni `labor_event` | No puede generar cartas con datos del guardia |
| 4 | `DOC_CATEGORIES.payroll` tiene "finiquito" pero no "amonestación", "carta_aviso", "licencia_medica" | Faltan categorías |
| 5 | No hay mecanismo de "pintar" V/L/P en pauta desde un evento | Se haría manual celda por celda |
| 6 | No hay tabla de tickets ni solicitudes | Módulo por crear |

---

## 2. Arquitectura propuesta

### 2.1 Principio rector

> Evolucionar `OpsEventoRrhh` → `OpsGuardEvent` (evento laboral rico).
> Reutilizar `Document` + `DocAssociation` para instancias de documento.
> Agregar `OpsGuardRequest` para solicitudes del guardia.
> Impactar `OpsPautaMensual` programáticamente al aprobar eventos.

### 2.2 Diagrama textual de entidades

```
┌─────────────────┐     1:N     ┌─────────────────────┐
│   OpsGuardia    │────────────▶│    OpsGuardEvent     │
│  (guardia)      │             │  (guard_events)      │
└─────────────────┘             │                      │
                                │ - category (enum)    │
                                │ - subtype            │
                                │ - startDate/endDate  │
                                │ - status (workflow)   │
                                │ - metadata (JSON)    │
                                │ - attachments[]      │
                                └──────────┬───────────┘
                                           │
                           ┌───────────────┼───────────────┐
                           │               │               │
                           ▼               ▼               ▼
                  DocAssociation    OpsGuardRequest   OpsPautaMensual
                  (entity_type=     (solicitud que     (shiftCode
                   "guard_event")    origina evento)    V/L/P pintado
                        │                                auto)
                        ▼
                    Document
                  (template rendered
                   como instancia)
```

### 2.3 Modelo `OpsGuardEvent` (reemplaza `OpsEventoRrhh`)

```prisma
model OpsGuardEvent {
  id              String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  tenantId        String    @map("tenant_id")
  guardiaId       String    @map("guardia_id") @db.Uuid

  // Clasificación
  category        String    // "ausencia" | "finiquito" | "amonestacion"
  subtype         String    // "vacaciones" | "licencia_medica" | "permiso_con_goce" | "permiso_sin_goce" | "finiquito" | "amonestacion_verbal" | "amonestacion_escrita" | "amonestacion_grave"

  // Rango de fechas
  startDate       DateTime  @map("start_date") @db.Date
  endDate         DateTime? @map("end_date") @db.Date        // null para amonestaciones (evento puntual)
  totalDays       Int?      @map("total_days")                // calculado (endDate - startDate + 1)
  isPartialDay    Boolean   @default(false) @map("is_partial_day") // futuro: medio día

  // Workflow
  status          String    @default("draft")  // draft | pending | approved | rejected | cancelled

  // Finiquito específico
  causalDtCode    String?   @map("causal_dt_code")            // código causal DT (Art. 159 N°1, etc.)
  causalDtLabel   String?   @map("causal_dt_label")           // descripción legible

  // Contenido
  reason          String?   @db.Text                           // motivo / observación
  internalNotes   String?   @map("internal_notes") @db.Text   // notas internas (no visibles al guardia)

  // Adjuntos (URLs en Supabase Storage)
  attachments     Json?     @default("[]")                     // [{url, name, type, uploadedAt}]

  // Metadata extensible
  metadata        Json?     @default("{}")                     // DT upload evidence, email tracking, etc.

  // Auditoría
  createdBy       String    @map("created_by")
  approvedBy      String?   @map("approved_by")
  approvedAt      DateTime? @map("approved_at") @db.Timestamptz(6)
  rejectedBy      String?   @map("rejected_by")
  rejectedAt      DateTime? @map("rejected_at") @db.Timestamptz(6)
  cancelledBy     String?   @map("cancelled_by")
  cancelledAt     DateTime? @map("cancelled_at") @db.Timestamptz(6)
  rejectionReason String?   @map("rejection_reason") @db.Text

  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  // Referencia a solicitud que originó este evento (si aplica)
  requestId       String?   @unique @map("request_id") @db.Uuid

  // Relaciones
  guardia         OpsGuardia        @relation(fields: [guardiaId], references: [id], onDelete: Cascade)
  request         OpsGuardRequest?  @relation(fields: [requestId], references: [id])

  @@unique([tenantId, guardiaId, startDate, subtype], map: "uq_guard_event_no_overlap")
  @@index([tenantId], map: "idx_guard_events_tenant")
  @@index([guardiaId], map: "idx_guard_events_guardia")
  @@index([tenantId, guardiaId, status], map: "idx_guard_events_guardia_status")
  @@index([startDate], map: "idx_guard_events_start")
  @@index([status], map: "idx_guard_events_status")
  @@map("guard_events")
  @@schema("ops")
}
```

### 2.4 Modelo `OpsGuardRequest` (solicitudes del guardia)

```prisma
model OpsGuardRequest {
  id              String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  tenantId        String    @map("tenant_id")
  guardiaId       String    @map("guardia_id") @db.Uuid

  // Tipo de solicitud
  type            String    // "vacaciones" | "permiso_con_goce" | "permiso_sin_goce" | "licencia_medica"

  // Fechas solicitadas
  startDate       DateTime  @map("start_date") @db.Date
  endDate         DateTime  @map("end_date") @db.Date
  totalDays       Int       @map("total_days")

  // Contenido
  reason          String?   @db.Text
  attachments     Json?     @default("[]")     // licencia médica escaneada, etc.

  // Workflow
  status          String    @default("pending") // pending | approved | rejected | cancelled

  // Auditoría
  reviewedBy      String?   @map("reviewed_by")
  reviewedAt      DateTime? @map("reviewed_at") @db.Timestamptz(6)
  reviewNotes     String?   @map("review_notes") @db.Text

  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  // Relaciones
  guardia         OpsGuardia      @relation(fields: [guardiaId], references: [id], onDelete: Cascade)
  event           OpsGuardEvent?  // evento laboral generado al aprobar

  @@index([tenantId], map: "idx_guard_requests_tenant")
  @@index([guardiaId], map: "idx_guard_requests_guardia")
  @@index([status], map: "idx_guard_requests_status")
  @@map("guard_requests")
  @@schema("ops")
}
```

### 2.5 Integración con Documentos (sin nuevo módulo)

No se crea un "segundo módulo de documentos". Se reutiliza el sistema existente:

```
Document (template) ──render──▶ Document (instancia)
                                     │
                                DocAssociation
                                entity_type = "guard_event"
                                entity_id   = guardEventId
```

**Flujo concreto:**

1. Admin selecciona template (ej: "Carta de Amonestación") desde la ficha del evento
2. Backend: `resolveDocument(template.content, entities)` con datos del guardia + evento
3. Se crea un nuevo `Document` con `status: "generated"`, `sourceTemplateId` referenciando al template
4. Se crea `DocAssociation` con `entityType: "guard_event"`, `entityId: event.id`
5. Si se regenera, se crea nueva versión (nuevo Document, misma association → se puede versionar por `createdAt`)

**Nuevos tokens necesarios** (agregar al `token-registry.ts`):

```typescript
{
  key: "guardia",
  label: "Guardia",
  tokens: [
    { key: "guardia.fullName", label: "Nombre completo", path: "fullName" },
    { key: "guardia.rut", label: "RUT", path: "rut" },
    { key: "guardia.code", label: "Código", path: "code" },
    { key: "guardia.email", label: "Email", path: "email" },
    { key: "guardia.phone", label: "Teléfono", path: "phone" },
    { key: "guardia.currentInstallation", label: "Instalación actual", path: "currentInstallation" },
  ]
},
{
  key: "labor_event",
  label: "Evento Laboral",
  tokens: [
    { key: "labor_event.type", label: "Tipo de evento", path: "subtypeLabel" },
    { key: "labor_event.startDate", label: "Fecha inicio", path: "startDate", type: "date" },
    { key: "labor_event.endDate", label: "Fecha término", path: "endDate", type: "date" },
    { key: "labor_event.totalDays", label: "Días totales", path: "totalDays", type: "number" },
    { key: "labor_event.reason", label: "Motivo", path: "reason" },
    { key: "labor_event.causalDt", label: "Causal DT", path: "causalDtLabel" },
  ]
}
```

**Nuevas categorías de documento** (agregar a `DOC_CATEGORIES`):

```typescript
labor: [
  { key: "carta_amonestacion", label: "Carta de Amonestación" },
  { key: "carta_aviso_termino", label: "Carta de Aviso de Término" },
  { key: "certificado_vacaciones", label: "Certificado de Vacaciones" },
  { key: "permiso_laboral", label: "Permiso Laboral" },
  { key: "otro_labor", label: "Otro" },
]
```

**Estados del documento generado** (usar `DocHistory` existente para trazabilidad):

```
generated → sent → signed → uploaded_dt
```

Cada transición se registra en `DocHistory` con `action` correspondiente.

### 2.6 Impacto en Pauta Mensual / Asistencia / Marcaciones

#### Mecanismo: "Event Hook" síncrono

Cuando un `OpsGuardEvent` pasa a `status: "approved"`:

```typescript
async function applyEventToPauta(event: OpsGuardEvent) {
  // 1. Determinar shiftCode según subtype
  const codeMap: Record<string, string> = {
    vacaciones: "V",
    licencia_medica: "L",
    permiso_con_goce: "P",
    permiso_sin_goce: "P",
  };
  const shiftCode = codeMap[event.subtype];
  if (!shiftCode) return; // amonestaciones no afectan pauta

  // 2. Obtener asignaciones activas del guardia
  const asignaciones = await prisma.opsAsignacionGuardia.findMany({
    where: { guardiaId: event.guardiaId, isActive: true }
  });

  // 3. Para cada día del rango, pintar shiftCode en la pauta
  for (let d = event.startDate; d <= event.endDate; d = addDays(d, 1)) {
    for (const asig of asignaciones) {
      await prisma.opsPautaMensual.updateMany({
        where: {
          tenantId: event.tenantId,
          puestoId: asig.puestoId,
          slotNumber: asig.slotNumber,
          date: d,
          plannedGuardiaId: event.guardiaId,
          shiftCode: "T",  // solo pintar sobre días de trabajo
        },
        data: { shiftCode }
      });
    }
  }

  // 4. Limpiar filas de asistencia "pendiente" que ya no aplican
  //    (el GET de asistencia ya filtra shiftCode="T", así que filas con V/L/P no se recrearán)
  await prisma.opsAsistenciaDiaria.deleteMany({
    where: {
      tenantId: event.tenantId,
      plannedGuardiaId: event.guardiaId,
      date: { gte: event.startDate, lte: event.endDate },
      attendanceStatus: { in: ["pendiente", "ppc"] },
      lockedAt: null,
    }
  });
}
```

#### Al anular un evento (`status: "cancelled"`):

```typescript
async function revertEventFromPauta(event: OpsGuardEvent) {
  // Revertir a "T" los días que estaban pintados con V/L/P por este evento
  // Solo si el día original era de trabajo según la serie
  // (verificar con OpsSerieAsignacion)
}
```

#### Marcaciones

No requiere cambio. La lógica actual ya funciona:
- Si `shiftCode != "T"` → no se crea fila de asistencia → no se espera marcación
- El endpoint de PPC detecta V/L/P → reporta como "puesto por cubrir"

#### Finiquito

Al aprobar un finiquito:
1. Se pinta `shiftCode = "-"` desde `startDate` en adelante (o se deja sin cambio si ya es "-")
2. Se desactiva `OpsAsignacionGuardia.isActive = false` a partir de la fecha
3. Se marca `OpsGuardia.status = "inactivo"` (o "en_proceso_finiquito" hasta confirmar)
4. Se notifica por email

### 2.7 Solicitudes del guardia — decisión de diseño

**Decisión: Solicitudes como módulo separado, NO como ticket.**

**Justificación:**

| Criterio | Solicitud separada | Unificado con tickets |
|----------|-------------------|-----------------------|
| Complejidad | Baja: CRUD + workflow simple | Alta: sistema de tickets genérico + tipos |
| Time-to-market | 1-2 días | 5-7 días |
| UX guardia (mobile) | Formulario simple y directo | Demasiada abstracción |
| Integración con evento | 1:1 directo (requestId) | Requiere polimorfismo |
| Futuro tickets | Se puede agregar después e interoperar | Sobreingeniería ahora |

La solicitud del guardia vive como `OpsGuardRequest`. Si en el futuro se necesita un módulo de tickets, se puede crear un `OpsTicket` con `originType: "guard_request"` + `originId` para interoperar.

### 2.8 Catálogo de causales DT

```prisma
model OpsCausalDt {
  id        String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  tenantId  String   @map("tenant_id")
  code      String   // "159-1", "159-2", "160-1", etc.
  article   String   // "Art. 159"
  number    String   // "N° 1"
  label     String   // "Mutuo acuerdo de las partes"
  fullText  String?  @map("full_text") @db.Text
  isActive  Boolean  @default(true) @map("is_active")
  sortOrder Int      @default(0) @map("sort_order")

  // Template asociado por defecto (opcional)
  defaultTemplateId String? @map("default_template_id") @db.Uuid

  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  @@unique([tenantId, code], map: "uq_causal_dt_code")
  @@index([tenantId], map: "idx_causal_dt_tenant")
  @@map("causales_dt")
  @@schema("ops")
}
```

Se puede poblar con un seed de las causales más comunes del Código del Trabajo chileno.

### 2.9 Nuevos permisos y capabilities

Agregar al RBAC existente:

```typescript
// En SUBMODULE_KEYS.ops:
"eventos_laborales"

// En CAPABILITY_KEYS:
"labor_event_approve"    // puede aprobar/rechazar eventos laborales
"labor_event_finiquito"  // puede registrar finiquitos (acción de alto impacto)

// En SUBMODULE_META:
{ key: "ops.eventos_laborales", module: "ops", submodule: "eventos_laborales",
  label: "Eventos Laborales", href: "/personas/guardias" }
```

---

## 3. Modelo de datos completo (resumen)

| Modelo | Tabla | Schema | Propósito |
|--------|-------|--------|-----------|
| `OpsGuardEvent` | `guard_events` | ops | Evento laboral (ausencia/finiquito/amonestación) |
| `OpsGuardRequest` | `guard_requests` | ops | Solicitud del guardia |
| `OpsCausalDt` | `causales_dt` | ops | Catálogo causales DT |
| `Document` (existente) | `documents` | docs | Template renderizado como instancia |
| `DocAssociation` (existente) | `doc_associations` | docs | Vínculo documento ↔ evento laboral |
| `DocHistory` (existente) | `doc_history` | docs | Trazabilidad de envío/firma/subida DT |

**Migración de `OpsEventoRrhh`**: Se elimina y se migran datos existentes (si los hay) a `OpsGuardEvent`.

---

## 4. Flujos (diagramas textuales)

### 4.1 Crear ausencia (vacaciones) desde ficha del guardia

```
Admin abre ficha guardia
  → Tab "Eventos Laborales"
  → Click "Nuevo Evento" → Selecciona "Ausencia > Vacaciones"
  → Completa: startDate, endDate, motivo
  → Guarda como "draft" o directamente como "approved" (según permiso)

  SI status = "approved":
    → applyEventToPauta(): pinta V en pauta mensual
    → PPC detecta automáticamente slots descubiertos
    → Asistencia diaria no crea filas para esos días
    → (Opcional) genera carta de vacaciones desde template
    → (Opcional) envía por email al guardia
```

### 4.2 Solicitud del guardia (portal guardia)

```
Guardia accede a portal (URL pública o sección autenticada)
  → "Solicitar vacaciones"
  → Completa: startDate, endDate, motivo
  → Se crea OpsGuardRequest (status: "pending")
  → Notificación email a aprobador(es)

Aprobador abre panel de solicitudes
  → Ve solicitud pendiente
  → Aprueba
  → Se crea OpsGuardEvent (status: "approved", requestId = request.id)
  → Se actualiza OpsGuardRequest (status: "approved")
  → applyEventToPauta() se ejecuta
  → Notificación email al guardia: "Tu solicitud fue aprobada"
```

### 4.3 Finiquito

```
Admin → ficha guardia → Eventos Laborales → "Registrar Finiquito"
  → Selecciona causal DT (desde catálogo OpsCausalDt)
  → Fecha de término
  → Status: "draft" (en preparación)

Admin genera documentos:
  → "Carta de aviso" (desde template) → DocAssociation
  → "Finiquito DT" (desde template) → DocAssociation
  → Envía por email al guardia

Admin cambia status a "approved":
  → guardia.status = "en_proceso_finiquito"
  → Se desactivan asignaciones desde la fecha
  → Pauta se ajusta (- desde fecha)

Admin confirma (marca como "executed"):
  → guardia.status = "inactivo"
  → Registro en historyEvents
```

### 4.4 Amonestación

```
Admin → ficha guardia → Eventos Laborales → "Nueva Amonestación"
  → Tipo: verbal / escrita / grave
  → Fecha, descripción
  → Genera carta desde template
  → Envía por email al guardia
  → Marca "subido a DT" (checkbox + adjunto evidencia)
  → No afecta pauta (amonestación no es ausencia)
```

---

## 5. Plan de implementación por fases (PRs)

### PR1: DB Models + Migraciones + Seeds

**Scope:**
- [x] Crear modelo `OpsGuardEvent` en schema.prisma
- [x] Crear modelo `OpsGuardRequest` en schema.prisma
- [x] Crear modelo `OpsCausalDt` en schema.prisma
- [x] Migración para eliminar/renombrar `OpsEventoRrhh`
- [x] Seed de causales DT comunes (Art. 159, 160, 161)
- [x] Agregar relaciones en `OpsGuardia`
- [x] Agregar submódulo `eventos_laborales` y capabilities en `permissions.ts`

**Endpoints:** Ninguno (solo DB)

**Criterios de aceptación:**
- `npx prisma migrate dev` ejecuta sin errores
- `npx prisma db seed` pobla causales DT
- Schema compila sin warnings

---

### PR2: API CRUD Eventos Laborales + Validaciones

**Scope:**
- [x] `GET /api/ops/guard-events` — listar eventos (filtros: guardiaId, category, status, dateRange)
- [x] `POST /api/ops/guard-events` — crear evento
- [x] `GET /api/ops/guard-events/[id]` — detalle
- [x] `PATCH /api/ops/guard-events/[id]` — editar (solo draft/pending)
- [x] `POST /api/ops/guard-events/[id]/approve` — aprobar
- [x] `POST /api/ops/guard-events/[id]/reject` — rechazar
- [x] `POST /api/ops/guard-events/[id]/cancel` — anular
- [x] `GET /api/ops/causales-dt` — listar causales DT
- [x] Validación de solapamiento de fechas (Zod + query DB)
- [x] Permisos RBAC: `canEdit(perms, "ops", "eventos_laborales")`, capability `labor_event_approve`

**Pruebas mínimas:**
- Crear evento con fechas válidas → 201
- Crear evento con solapamiento → 409
- Aprobar evento → actualiza pauta mensual
- Rechazar evento → no toca pauta

**Criterios de aceptación:**
- CRUD funcional con auth + permisos
- Solapamiento detectado en todos los casos
- Audit trail (createdBy, approvedBy, etc.)

---

### PR3: UI en Ficha Guardia — Tab "Eventos Laborales"

**Scope:**
- [x] Nueva tab "Eventos Laborales" en `GuardiaDetailClient.tsx`
- [x] Tabla/listado de eventos del guardia (fecha, tipo, estado, badge)
- [x] Modal/drawer "Nuevo Evento" con form:
  - Selector de categoría (ausencia/finiquito/amonestación)
  - Campos dinámicos según categoría
  - DatePicker rango (startDate/endDate)
  - Upload adjuntos (Supabase)
  - Selector de causal DT (solo para finiquito)
- [x] Detalle de evento con timeline de auditoría
- [x] Botones de acción: Aprobar / Rechazar / Anular (según permisos)
- [x] Mobile-first: todo accesible desde móvil

**Criterios de aceptación:**
- Se ve la tab en ficha guardia
- Se pueden crear los 3 tipos de evento
- Responsivo en mobile

---

### PR4: Integración con Documentos — Instancias + Preview

**Scope:**
- [x] Agregar tokens `guardia.*` y `labor_event.*` al token-registry
- [x] Agregar módulo `labor` con categorías al `DOC_CATEGORIES`
- [x] Endpoint `POST /api/ops/guard-events/[id]/generate-doc` — genera documento desde template
  - Recibe `templateId`
  - Resuelve tokens con datos del guardia + evento
  - Crea `Document` (instancia) + `DocAssociation`
- [x] UI: sección "Documentos asociados" en detalle de evento
  - Listar documentos generados
  - Botón "Generar desde template" (selector de templates filtrado por categoría)
  - Preview del documento generado
  - Badge de estado: generado / enviado / firmado / subido_dt
- [x] Versionado: si regenero, se crea nuevo Document, el anterior se marca como `superseded`

**Criterios de aceptación:**
- Puedo generar carta de amonestación desde template con datos del guardia
- Preview muestra el documento renderizado
- Si regenero, veo historial de versiones

---

### PR5: Envío de Correo + Logs de Envío

**Scope:**
- [x] Endpoint `POST /api/ops/guard-events/[id]/send-doc` — envía documento por email
  - Usa Resend (ya integrado)
  - Envía al email del guardia (persona.email)
  - CC opcional a RRHH
  - Adjunta PDF generado
- [x] Registrar envío en `DocHistory` (action: "sent", details: {to, cc, sentAt})
- [x] UI: botón "Enviar por correo" en cada documento
- [x] Notificaciones automáticas:
  - Al aprobar evento → email al guardia
  - Al rechazar solicitud → email al guardia
  - Al generar finiquito → email a RRHH

**Criterios de aceptación:**
- Email llega al guardia con PDF adjunto
- DocHistory registra el envío
- No se puede enviar si documento no está generado

---

### PR6: Solicitudes del Guardia + Aprobación

**Scope:**
- [x] `GET /api/ops/guard-requests` — listar solicitudes (filtros: guardiaId, type, status)
- [x] `POST /api/ops/guard-requests` — crear solicitud
- [x] `POST /api/ops/guard-requests/[id]/approve` — aprobar → crea OpsGuardEvent + applyToPauta
- [x] `POST /api/ops/guard-requests/[id]/reject` — rechazar → notifica guardia
- [x] Portal de solicitudes (UI):
  - Vista guardia: "Mis solicitudes" + "Nueva solicitud"
  - Vista aprobador: "Solicitudes pendientes" + acciones
- [x] Página pública o autenticada para el guardia (evaluar: ¿misma auth o link con token?)

**Criterios de aceptación:**
- Guardia puede crear solicitud de vacaciones
- Aprobador ve solicitudes pendientes
- Al aprobar, se crea evento laboral y se pinta en pauta
- Email de notificación al guardia

---

### PR7: Integración con Pauta / Asistencia / Marcaciones

**Scope:**
- [x] Service `applyEventToPauta()` — pinta V/L/P en pauta mensual al aprobar
- [x] Service `revertEventFromPauta()` — revierte al anular
- [x] Service `applyFiniquito()` — desactiva asignaciones + marca guardia inactivo
- [x] Validación: si hay asistencia locked en el rango, no permitir anular
- [x] PPC: verificar que detecta correctamente los nuevos V/L/P pintados
- [x] Test: crear evento vacaciones → verificar pauta → verificar asistencia no crea fila → verificar PPC reporta

**Criterios de aceptación:**
- Al aprobar vacaciones del 15 al 20, pauta muestra V en esos días
- Asistencia diaria no crea filas para esos días
- PPC muestra "vacaciones" como motivo
- Al anular, pauta vuelve a T

---

### PR8: Tickets internos (opcional, post-MVP)

**Scope:**
- [x] Modelo `OpsTicket` básico (si se decide implementar)
- [x] Interoperabilidad con `OpsGuardRequest` vía `originType`/`originId`
- [x] UI de tickets para supervisores

> Este PR es opcional y puede posponerse. Las solicitudes del guardia ya funcionan sin él.

---

## 6. Riesgos + Mitigaciones

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|--------|-------------|---------|------------|
| 1 | Solapamiento de eventos no detectado | Media | Alto | Validación en DB (unique constraint) + check en API |
| 2 | Pauta mensual no generada para el mes del evento | Media | Medio | Verificar existencia de pauta antes de pintar; si no existe, crear esqueleto |
| 3 | Anular evento con asistencia ya locked | Baja | Alto | Validar que no haya filas locked en el rango antes de permitir anulación |
| 4 | Guardia sin asignación activa → no se puede pintar pauta | Media | Medio | Validar y advertir al admin; registrar evento igual pero sin efecto en pauta |
| 5 | Email del guardia no existe | Media | Bajo | Validar persona.email antes de enviar; mostrar warning en UI |
| 6 | Template no tiene tokens de guardia/evento | Baja | Bajo | Preview muestra `{{token}}` sin resolver; admin se da cuenta |
| 7 | Migración de OpsEventoRrhh rompe algo | Baja | Medio | La tabla no se usa en ningún endpoint; renombrar primero, eliminar después |

---

## 7. Mejoras opcionales (post-MVP)

| # | Mejora | Valor | Esfuerzo |
|---|--------|-------|----------|
| 1 | **Cola de jobs** (BullMQ/Inngest) para envío de emails y cálculos pesados | Alto | Medio |
| 2 | **Firma digital** integrada (ya existe `DocSignatureRequest` en el repo) | Alto | Medio |
| 3 | **Portal guardia autenticado** con magic link (sin password) | Alto | Bajo |
| 4 | **Automatización DT**: upload vía API de la Dirección del Trabajo | Alto | Alto |
| 5 | **Dashboard RRHH** con métricas: ausentismo, vacaciones pendientes, finiquitos en proceso | Medio | Medio |
| 6 | **Calendario visual** de eventos laborales por guardia (tipo Gantt) | Medio | Bajo |
| 7 | **Alertas de vencimiento**: vacaciones que vencen, licencias por expirar | Medio | Bajo |
| 8 | **Medio día / parcialidad**: soporte para permiso de medio día | Bajo | Bajo |
| 9 | **Saldo de vacaciones**: calcular días disponibles según antigüedad | Alto | Medio |
| 10 | **Registro de subida a DT** con evidencia: upload de comprobante + fecha | Medio | Bajo |

---

## Punto extra: Detalles adicionales

### Causal DT como catálogo mantenible

Seed inicial con causales del Código del Trabajo chileno:

```typescript
const CAUSALES_DT_SEED = [
  { code: "159-1", article: "Art. 159", number: "N° 1", label: "Mutuo acuerdo de las partes" },
  { code: "159-2", article: "Art. 159", number: "N° 2", label: "Renuncia del trabajador" },
  { code: "159-3", article: "Art. 159", number: "N° 3", label: "Muerte del trabajador" },
  { code: "159-4", article: "Art. 159", number: "N° 4", label: "Vencimiento del plazo convenido" },
  { code: "159-5", article: "Art. 159", number: "N° 5", label: "Conclusión del trabajo o servicio" },
  { code: "159-6", article: "Art. 159", number: "N° 6", label: "Caso fortuito o fuerza mayor" },
  { code: "160-1", article: "Art. 160", number: "N° 1", label: "Conductas indebidas de carácter grave" },
  { code: "160-2", article: "Art. 160", number: "N° 2", label: "Negociaciones prohibidas por contrato" },
  { code: "160-3", article: "Art. 160", number: "N° 3", label: "No concurrencia sin causa justificada" },
  { code: "160-4", article: "Art. 160", number: "N° 4", label: "Abandono del trabajo" },
  { code: "160-5", article: "Art. 160", number: "N° 5", label: "Actos, omisiones o imprudencias temerarias" },
  { code: "160-6", article: "Art. 160", number: "N° 6", label: "Perjuicio material causado intencionalmente" },
  { code: "160-7", article: "Art. 160", number: "N° 7", label: "Incumplimiento grave de las obligaciones" },
  { code: "161-1", article: "Art. 161", number: "Inc. 1°", label: "Necesidades de la empresa" },
  { code: "161-2", article: "Art. 161", number: "Inc. 2°", label: "Desahucio escrito del empleador" },
];
```

Mantenible vía endpoint CRUD o UI en configuración OPS.

### Plantillas por causal

Cada `OpsCausalDt` puede tener `defaultTemplateId` que apunta a un template específico. Al seleccionar la causal en el formulario de finiquito, se sugiere automáticamente el template.

### Registro "subido a DT"

En el campo `metadata` del evento (JSON):
```json
{
  "dtUpload": {
    "uploadedAt": "2026-02-14T10:00:00Z",
    "uploadedBy": "admin-uuid",
    "evidenceUrl": "https://storage.../dt-receipt.pdf",
    "notes": "Folio 12345"
  }
}
```

### Firma

El repo ya tiene `DocSignatureRequest`. Se puede vincular directamente:
1. Generar documento desde evento
2. Crear `DocSignatureRequest` para ese documento
3. Enviar link de firma al guardia
4. Al firmar, actualizar estado del documento a "signed"
