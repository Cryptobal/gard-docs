# Role Policy - Single Source of Truth

**Estado:** Activo y obligatorio  
**Fuente oficial:** `src/lib/role-policy.ts`

---

## Objetivo

Eliminar inconsistencias entre UI, páginas, APIs y documentación para permisos/roles.

---

## Regla principal

Toda definición de acceso por rol vive en un solo archivo:

- `src/lib/role-policy.ts`

Este archivo define:

- Roles (`Role`)
- Permisos funcionales (`Permission`)
- Acceso por módulo (`appAccess`)
- Acceso por submódulo (`crmSubmodules`, `configSubmodules`, `docsSubmodules`)
- Capacidades Ops (`opsCapabilities`)

---

## Archivos derivados (no editar matriz manual)

- `src/lib/rbac.ts`
- `src/lib/app-access.ts`
- `src/lib/module-access.ts`
- `src/lib/ops-rbac.ts`
- `src/components/usuarios/RolesHelpCard.tsx`

Todos estos deben leer la política central.

---

## Protocolo al agregar/modificar roles

1. Editar `src/lib/role-policy.ts`.
2. Verificar guards de:
   - `/opai/configuracion/*`
   - APIs de configuración (por ejemplo `/api/notifications/config`)
3. Verificar UI:
   - Sidebar
   - Command palette
   - Modal "Ver permisos"
4. Actualizar docs:
   - `docs/01-architecture/auth.md`
   - `docs/02-implementation/usuarios-roles.md`
5. Registrar cambio en changelog de etapa si aplica.

---

## Decisión actual de negocio (Feb 2026)

- `owner`: acceso total.
- `admin`: acceso total.
- `editor`: acceso total operativo incluyendo `Ops`, sin `Configuración`.
- Resto de roles: se mantienen según política vigente.
