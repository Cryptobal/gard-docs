# Gard Docs (OPAI Proposals) — Documento Maestro de la Aplicación

## Rol dentro de OPAI
Este repositorio corresponde al módulo **Proposals / Docs** de la suite OPAI.
Su responsabilidad es:
- Crear y gestionar templates de propuestas
- Generar presentaciones desde templates + tokens
- Enviar propuestas por email
- Trackear visualizaciones
- Exponer vistas públicas vía /p/[id]

No contiene CRM ni Operaciones. Consume datos desde integraciones o, en el futuro, desde OPAI CRM.

---

## Rutas
### Privadas (requieren login)
- /inicio
- /templates/*
- /preview/*

### Públicas
- /p/[id] → Vista pública de presentación (sin login)

---

## Autenticación
- Auth.js v5 (NextAuth v5)
- Provider: Credentials (email/password)
- Usuarios almacenados en BD
- Soporta **multi-tenant**
- Tenant activo presente en sesión

---

## Multi-Tenancy
- Todas las entidades internas pertenecen a un tenant
- tenantId es obligatorio en:
  - Template
  - Presentation
  - WebhookSession
  - AuditLog
- Actualmente existe tenant inicial: `gard`

---

## Módulos
- Templates
- Presentations
- Sending & Tracking
- Public Viewer (/p)
- Audit & Logs

---

## Integraciones
- Ingest genérico por webhook (legacy Zoho soportado)
- CRM OPAI será la fuente principal futura

---

## Estado actual
- Auth: implementado
- Multi-tenant: implementado
- Tracking: operativo
- Documentación: en proceso de ordenamiento

---

## Roadmap inmediato
1) Ordenar documentación y estándares
2) Crear Hub (launcher de apps)
3) Iniciar desarrollo de CRM