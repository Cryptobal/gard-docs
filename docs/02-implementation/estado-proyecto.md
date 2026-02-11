# Estado del Proyecto (Snapshot Operativo)

> **Fecha:** 2026-02-11  
> **Estado:** Vigente  
> **Referencia principal:** `docs/02-implementation/ESTADO_GENERAL.md`

---

## Donde estamos hoy

OPAI tiene base comercial estable (Hub/CRM/CPQ/Docs/Config), Payroll parcial y **Fase 1 OPI implementada en MVP v1**.

### Fase 1 (Ops + TE + Personas)

- **Estado:** ✅ Implementada (MVP v1)
- **Incluye:** puestos, pauta mensual/diaria, asistencia, PPC, TE, lotes/pagos, guardias y lista negra
- **Backend:** schema `ops` + APIs `/api/ops/*`, `/api/te/*`, `/api/personas/*`
- **Frontend:** rutas `/ops/*`, `/te/*`, `/personas/*`

### Datos globales del repositorio

| Indicador | Valor |
|-----------|-------|
| Modelos Prisma | 77 |
| Schemas DB | 7 (`public`, `crm`, `cpq`, `docs`, `payroll`, `fx`, `ops`) |
| Endpoints API | 135 |

---

## Que sigue inmediato

1. **Hardening Fase 1** (tests, QA, estabilizacion de reglas operativas)
2. **RBAC operacional fino** (`rrhh`, `operaciones`, `reclutamiento`)
3. **Inicio Fase 2** (Postventa + Tickets) segun `docs/06-etapa-2/`

---

## Fuente de verdad

- Estado real detallado: `docs/02-implementation/ESTADO_GENERAL.md`
- Plan Fase 1: `docs/05-etapa-1/ETAPA_1_IMPLEMENTACION.md`
- Plan Fase 2: `docs/06-etapa-2/ETAPA_2_IMPLEMENTACION.md`
- Roadmap maestro: `docs/00-product/MASTER_SPEC_OPI.md`
