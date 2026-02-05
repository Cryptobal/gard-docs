# Sistema de Usuarios y Roles - GARD DOCS

**Versión:** 2.0  
**Fecha:** 05 de Febrero de 2026  
**Estado:** ✅ Implementado

---

## 🎯 RESUMEN

Sistema completo de administración de usuarios internos con invitación por email, gestión de roles (RBAC) y auditoría integrada.

---

## 👥 GESTIÓN DE USUARIOS

### Acceso

**Ruta:** `/usuarios`

**Permisos requeridos:** `owner` o `admin`

### Funcionalidades

#### 1. **Ver Lista de Usuarios**
- Tabla con todos los usuarios del tenant
- Columnas:
  - Usuario (nombre + email)
  - Rol (con cambio inline para owner/admin)
  - Estado (activo/desactivado/invitado)
  - Último login (tiempo relativo)
  - Acciones (menú de opciones)

#### 2. **Invitar Nuevo Usuario**
- Botón "Invitar Usuario" en el header
- Modal con formulario:
  - Email del invitado
  - Rol inicial (viewer/editor/admin/owner)
- Envía email automático con link de activación
- Token seguro con expiración de 48 horas

#### 3. **Cambiar Rol de Usuario**
- Dropdown select en la columna "Rol"
- Solo para owner/admin
- No se puede cambiar el propio rol
- Protección: mínimo 1 owner activo siempre

#### 4. **Activar/Desactivar Usuario**
- Menú de acciones (tres puntos)
- Opción "Desactivar" para usuarios activos
- Opción "Activar" para usuarios desactivados
- No se puede desactivar a sí mismo
- Protección: mínimo 1 owner activo

#### 5. **Revocar Invitaciones**
- Tabla separada para invitaciones pendientes
- Botón "Revocar" con confirmación
- Muestra tiempo desde envío y hasta expiración

---

## 🔐 ROLES Y PERMISOS (RBAC)

### Jerarquía de Roles

```
owner (nivel 4)
  ↓
admin (nivel 3)
  ↓
editor (nivel 2)
  ↓
viewer (nivel 1)
```

### Matriz de Permisos

| Funcionalidad | Owner | Admin | Editor | Viewer |
|--------------|-------|-------|--------|--------|
| **Usuarios** |  |  |  |  |
| Invitar usuarios | ✅ | ✅ | ❌ | ❌ |
| Cambiar roles | ✅ | ✅ | ❌ | ❌ |
| Activar/desactivar | ✅ | ✅ | ❌ | ❌ |
| **Templates** |  |  |  |  |
| Crear/editar templates | ✅ | ✅ | ✅ | ❌ |
| Ver templates | ✅ | ✅ | ✅ | ✅ |
| **Presentaciones** |  |  |  |  |
| Crear presentaciones | ✅ | ✅ | ✅ | ❌ |
| Enviar por email | ✅ | ✅ | ✅ | ❌ |
| Ver presentaciones | ✅ | ✅ | ✅ | ✅ |
| **Analytics** |  |  |  |  |
| Ver estadísticas | ✅ | ✅ | ❌ | ❌ |
| **Configuración** |  |  |  |  |
| Gestionar settings | ✅ | ❌ | ❌ | ❌ |

### Descripción de Roles

#### Owner (Propietario)
- Máximo control sobre el tenant
- Puede gestionar todos los aspectos
- Solo un owner puede crear/modificar owners
- Mínimo 1 owner activo por tenant

#### Admin (Administrador)
- Gestión completa de usuarios y contenido
- No puede modificar configuración global
- Ideal para team leads

#### Editor
- Puede crear y enviar presentaciones
- Puede editar templates
- No puede gestionar usuarios
- Ideal para equipo comercial

#### Viewer (Visualizador)
- Solo lectura
- No puede crear ni modificar contenido
- Ideal para stakeholders o clientes internos

---

## 📧 FLUJO DE INVITACIÓN

### Paso 1: Invitación

```
1. Owner/Admin → /usuarios → "Invitar Usuario"
2. Completa formulario:
   - Email: usuario@ejemplo.com
   - Rol: editor
3. Click "Enviar Invitación"
```

**Sistema ejecuta:**
```typescript
- Verifica que el email no exista
- Verifica que no haya invitación pendiente
- Genera token aleatorio (32 bytes hex)
- Hashea token con bcrypt
- Crea registro en UserInvitation
- Envía email con link de activación
- Registra evento en AuditLog
```

### Paso 2: Usuario Recibe Email

**Email contiene:**
- Nombre de quien invita
- Rol asignado
- Botón "Activar mi cuenta"
- Link: `/activate?token=XXXXXX`
- Nota: "Expira en 48 horas"

### Paso 3: Activación

```
1. Usuario click en link del email
2. Carga página /activate?token=XXXXXX
3. Completa formulario:
   - Nombre completo
   - Contraseña (mínimo 8 caracteres)
   - Confirmar contraseña
4. Click "Activar cuenta"
```

**Sistema ejecuta:**
```typescript
- Valida token (bcrypt compare contra todos los tokens pendientes)
- Verifica que no esté expirado
- Verifica que no esté ya usado
- Crea usuario en tabla Admin:
  - email (del invitation)
  - name (del formulario)
  - password (hasheado)
  - role (del invitation)
  - status: 'active'
  - tenantId (del invitation)
  - invitedBy, invitedAt, activatedAt
- Marca invitación como acceptedAt
- Registra evento en AuditLog
- Redirect a /login
```

### Paso 4: Primer Login

```
1. Usuario ingresa email y contraseña
2. Sistema autentica
3. Redirect a /inicio
4. Usuario puede trabajar según su rol
```

---

## 🔒 SEGURIDAD

### Tokens de Invitación

- **Generación**: `crypto.randomBytes(32).toString('hex')`
- **Almacenamiento**: Hash bcrypt (no se guarda el token en claro)
- **Validación**: Busca todos los tokens pendientes y hace bcrypt.compare
- **Expiración**: 48 horas desde creación
- **One-time use**: Se marca `acceptedAt` al usarse
- **Revocación**: Campo `revokedAt` para invalidar manualmente

### Validaciones de Negocio

#### Al Invitar
- ✅ Email no puede existir en Admin
- ✅ No puede haber invitación pendiente para el mismo email
- ✅ Rol debe ser válido (owner/admin/editor/viewer)
- ✅ Solo owner/admin pueden invitar

#### Al Cambiar Rol
- ✅ Solo owner/admin pueden cambiar roles
- ✅ No puedes cambiar tu propio rol
- ✅ Si es owner, debe quedar al menos 1 owner activo
- ✅ Usuario debe pertenecer al mismo tenant

#### Al Desactivar
- ✅ Solo owner/admin pueden desactivar
- ✅ No puedes desactivarte a ti mismo
- ✅ Si es owner activo, debe quedar al menos 1 owner activo

### Scope Multi-Tenant

Todas las operaciones están filtradas por `tenantId`:
- Invitaciones solo al tenant propio
- Usuarios solo del tenant propio
- Cambios solo a usuarios del mismo tenant

---

## 📊 MODELO DE DATOS

### Admin (Usuarios)

```prisma
model Admin {
  id        String   @id
  email     String   @unique
  password  String   // Hash bcrypt
  name      String
  role      String   // "owner", "admin", "editor", "viewer"
  status    String   // "invited", "active", "disabled"
  
  tenantId  String
  tenant    Tenant   @relation(...)
  
  lastLoginAt DateTime?
  invitedBy   String?   // ID del usuario que invitó
  invitedAt   DateTime? // Cuándo fue invitado
  activatedAt DateTime? // Cuándo activó su cuenta
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### UserInvitation (Invitaciones)

```prisma
model UserInvitation {
  id        String   @id
  email     String
  role      String
  tenantId  String
  
  token     String   @unique // Hash bcrypt
  expiresAt DateTime // 48 horas
  
  acceptedAt DateTime? // Cuándo se aceptó
  revokedAt  DateTime? // Si se revocó
  invitedBy  String?   // ID del que invitó
  
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

---

## 🎨 DISEÑO DARK MODE

### Paleta de Colores

```css
/* Backgrounds */
bg-slate-950  /* Fondo principal */
bg-slate-900  /* Cards y paneles */
bg-slate-800  /* Elementos elevados */

/* Borders */
border-slate-800  /* Borders principales */
border-slate-700  /* Borders interactivos */

/* Text */
text-white       /* Títulos */
text-slate-300   /* Labels */
text-slate-400   /* Descripciones */
text-slate-500   /* Placeholders */

/* Accent */
bg-teal-600 hover:bg-teal-500  /* Botones primarios */

/* Status */
bg-emerald-600  /* Success (active) */
bg-red-600      /* Error (disabled) */
bg-amber-600    /* Warning (invited) */
```

### Componentes

- **Tablas**: `bg-slate-900` con headers en `bg-slate-800`
- **Inputs**: `bg-slate-800 border-slate-700 text-white`
- **Buttons**: Primary = `bg-teal-600`, Ghost = `hover:bg-slate-800`
- **Badges**: Color-coded con roles y estados
- **Dialogs**: `bg-slate-900 border-slate-800`

---

## 📝 SERVER ACTIONS

### Código de Ejemplo

```typescript
import { inviteUser, changeUserRole, toggleUserStatus, revokeInvitation, listUsers, listPendingInvitations } from '@/app/actions/users';

// Invitar usuario
const result = await inviteUser('usuario@ejemplo.com', 'editor');

// Cambiar rol
await changeUserRole(userId, 'admin');

// Activar/desactivar
await toggleUserStatus(userId);

// Revocar invitación
await revokeInvitation(invitationId);

// Listar usuarios
const { success, users } = await listUsers();

// Listar invitaciones
const { success, invitations } = await listPendingInvitations();
```

---

## 📈 AUDITORÍA

### Eventos Registrados

| Evento | Acción | Detalles |
|--------|--------|----------|
| `user.invited` | Usuario invitado | email, role |
| `user.activated` | Cuenta activada | userId |
| `user.role_changed` | Rol modificado | oldRole, newRole |
| `user.enabled` | Usuario activado | userId |
| `user.disabled` | Usuario desactivado | userId |
| `invitation.revoked` | Invitación revocada | email |

### Query de Auditoría

```typescript
const logs = await prisma.auditLog.findMany({
  where: {
    tenantId: session.user.tenantId,
    entity: 'user',
  },
  orderBy: { createdAt: 'desc' },
});
```

---

## ✅ CHECKLIST DE FUNCIONALIDADES

### Core Features
- [x] Página /usuarios visible solo para owner/admin
- [x] Tabla de usuarios activos
- [x] Tabla de invitaciones pendientes
- [x] Botón "Invitar Usuario" con modal
- [x] Cambio de rol inline (dropdown en tabla)
- [x] Activar/desactivar usuarios
- [x] Revocar invitaciones
- [x] Página /activate para nuevos usuarios

### Email System
- [x] Template React Email profesional
- [x] Envío vía Resend
- [x] Link seguro con token hasheado
- [x] Expiración de 48 horas
- [x] Información clara (rol, quien invita)

### Security
- [x] Tokens hasheados (bcrypt)
- [x] One-time use tokens
- [x] Validación de permisos en server
- [x] Validación de permisos en UI
- [x] Protección contra eliminar último owner
- [x] Scope por tenant

### UX/UI
- [x] Dark mode completo
- [x] Loading states
- [x] Error handling
- [x] Confirmaciones en acciones destructivas
- [x] Feedback visual en todas las acciones

### Auditoría
- [x] Registro de invitaciones
- [x] Registro de activaciones
- [x] Registro de cambios de rol
- [x] Registro de activaciones/desactivaciones
- [x] Registro de revocaciones

---

## 🚀 PRÓXIMOS PASOS

### Mejoras Futuras (v3.0)

- [ ] Búsqueda y filtros en tabla de usuarios
- [ ] Paginación para tenants con muchos usuarios
- [ ] Exportar lista de usuarios (CSV)
- [ ] Página de perfil de usuario (editar nombre, cambiar password)
- [ ] 2FA (Two-Factor Authentication)
- [ ] SSO (Google, Microsoft, etc.)
- [ ] Membership many-to-many (usuario en múltiples tenants)
- [ ] Roles personalizados por tenant
- [ ] Grupos de usuarios
- [ ] Permisos granulares por recurso
- [ ] Historial de actividad por usuario
- [ ] Notificaciones de seguridad (login desde nueva IP, etc.)

---

**Última actualización:** 05 de Febrero de 2026
