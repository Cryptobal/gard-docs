OBJETIVO
Agregar el Documento Maestro Global de la suite OPAI dentro de este repo (GARD-DOCS) SOLO como referencia estratégica, sin cambiar código. Mantener el master local de la app Docs como fuente operativa principal.

TAREAS
1) Crear carpeta si no existe:
   - docs/00-product/

2) Crear archivo:
   - docs/00-product/000-opai-suite-master.md

3) Contenido del archivo (pegar EXACTO lo siguiente):

---
# OPAI Suite — Documento Maestro Global

> Nota: Este repo (GARD-DOCS) implementa solo el módulo Docs/Proposals. Este documento existe aquí como referencia macro. El master operativo de esta app es: docs/00-product/001-gard-docs-master.md (o el archivo master local equivalente).

## 1. Propósito
OPAI es una suite SaaS para empresas de seguridad que unifica:
- Propuestas comerciales (Docs/Proposals)
- CRM y seguimiento
- Operaciones (turnos, incidentes, supervisión)
- Portal de guardias (tickets, documentos, solicitudes)
- Portal de clientes (visibilidad controlada)
- Integraciones (correo, asistencia FaceID externa, payroll externo; Zoho solo legacy si aplica)

## 2. Principios de arquitectura
- Multi-tenant desde el día 1 (tenant = empresa).
- SSO único para toda la suite.
- Arquitectura multi-app (subdominios) con un Hub (launcher) como entrypoint.
- DB Postgres única inicialmente (Neon) con `tenant_id` en todas las tablas + schemas por dominio.
- Autorización central: RBAC + Scopes (ABAC) + Policies.
- Integración interna por eventos (Outbox) para desacoplar módulos.
- Hardening por etapas: RLS en Postgres (fase 2).

## 3. Apps (subdominios)
- docs.opai.*    → Propuestas/Presentaciones + tracking
- hub.opai.*     → Dashboard central + app switcher + (futuro) tenant switcher/billing
- crm.opai.*     → Pipeline comercial, contactos, actividades, emails, IA
- ops.opai.*     → Operación: turnos, incidentes, rondas, cumplimiento
- portal.opai.*  → Guardias/clientes: tickets, documentos, solicitudes, SLA
- admin.opai.*   → Configuración tenant, usuarios/roles/scopes, integraciones, billing

## 4. Multi-tenancy
- Un usuario puede pertenecer a varios tenants vía memberships.
- Regla de negocio típica: salvo guardias (y casos especiales), usuarios operan con 1 tenant activo.
- Cada request opera en un “tenant activo” (tenant context).
- En V1, la selección de tenant se hace por UI (tenant switcher), no por subdominio por tenant.

## 5. Autorización (RBAC + Scopes)
Roles base: owner, admin, sales, ops_manager, supervisor, guard, client.
Scopes: installation_id, client_id, guard_id (self), region_id (si aplica).
Policies por acción: ops.incident.create, docs.proposal.send, portal.ticket.read, etc.

## 6. Datos
- `tenant_id` en todas las tablas.
- schemas por dominio: auth, core, docs, crm, ops, portal, integrations, audit.
- auditoría mínima: created_at, updated_at, created_by_membership_id.

## 7. Integraciones
- Eventos internos vía outbox:
  - docs.proposal.sent
  - docs.email.opened
  - crm.deal.updated
  - ops.incident.created
  - portal.ticket.created
- Externos (según estrategia):
  - Email provider → tracking opens/clicks
  - Asistencia FaceID → webhooks → ops.attendance_*
  - Payroll externo → export/import mensual
  - Zoho CRM → solo legacy durante transición (después CRM OPAI será fuente principal)

## 8. Roadmap (alto nivel)
Fase 0: estabilizar docs/proposals y tracking + base multi-tenant.
Fase 1: Hub (launcher) + CRM mínimo.
Fase 2: Ops (incidentes + pauta/turnos base).
Fase 3: Portal guardias (tickets + docs + SLA).
Fase 4: Admin SaaS (tenants, billing, roles/scopes UI, integraciones).

## 9. Convenciones
- Naming: {domain}.{entity} en DB. Ej: ops.incidents, crm.deals.
- IDs: UUID/CUID (definir estándar único al consolidar monorepo).
- APIs: /api/{domain}/{resource}
- Events: {domain}.{entity}.{verb}
---

4) Ajuste mínimo para reducir confusión:
   - Si el master local actual se llama "000-GardDocsMaster.md", renombrarlo a:
     docs/00-product/001-gard-docs-master.md
     (Mantener el contenido intacto; solo rename.)
   - Si no quieres renombrar, entonces agregar en la primera línea del master local una nota:
     "Este es el master OPERATIVO de la app. El master global está en: docs/00-product/000-opai-suite-master.md"

RESTRICCIONES
- No modificar src/, prisma/, ni ninguna lógica de la app.
- Solo crear/mover archivos dentro de /docs.

DEFINICIÓN DE HECHO
- Existe docs/00-product/000-opai-suite-master.md con el contenido anterior.
- Queda explícito cuál es master global y cuál es master de esta app.