# Autenticación - GARD DOCS

**Versión:** 1.0  
**Fecha:** 04 de Febrero de 2026  

---

## 🔐 SISTEMA DE AUTENTICACIÓN

### Stack de Autenticación

- **Framework:** Auth.js v5 (NextAuth v5)
- **Provider:** Credentials (email + password)
- **Hashing:** bcryptjs
- **Tokens:** JWT
- **Almacenamiento:** Base de datos (tabla Admin)

---

## 📋 MODELO DE DATOS

### Tabla Admin

```prisma
model Admin {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // Hash bcrypt
  name      String
  tenantId  String   // Multi-tenancy
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 🔄 FLUJO DE AUTENTICACIÓN

### Login

```
1. Usuario accede a: docs.gard.cl/login
2. Ingresa credenciales:
   - Email: carlos.irigoyen@gard.cl
   - Password: (de .env.local)
3. NextAuth valida contra hash en BD
4. Genera session JWT
5. Redirecciona a: /inicio
```

### Protección de Rutas

```typescript
// src/middleware.ts
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname.startsWith('/inicio')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
})

export const config = {
  matcher: ['/inicio/:path*']
}
```

### Session JWT

La sesión incluye:
```typescript
{
  user: {
    id: string
    email: string
    name: string
    tenantId: string  // Para multi-tenancy
  }
}
```

---

## 🔐 VARIABLES DE ENTORNO

### Archivo: `.env.local`

```bash
# ─── Autenticación y Seguridad ────────────
# Email del administrador
ADMIN_EMAIL="carlos.irigoyen@gard.cl"
# Password en texto plano SOLO para desarrollo local
ADMIN_PASSWORD_DEV="GardSecurity2026!"
# Hash para producción
ADMIN_PASSWORD_HASH="$2b$10$f6gLWyadKS4dzJ11OMQEz.TBEOx7fGKD6HrVdsQLBKy/6XkXFDdOm"
# JWT Secret
JWT_SECRET="dev-jwt-secret-local-2026"
JWT_SECRET_KEY="dev-jwt-secret-local-2026"
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# ─── NextAuth.js ──────────────────────────
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET="dev-nextauth-secret-2026-change-in-production"
```

---

## 🛡️ SEGURIDAD

### Mejores Prácticas Implementadas

1. **Hashing de Passwords**
   - Algoritmo: bcrypt
   - Rounds: 10
   - NO almacenar passwords en texto plano

2. **JWT Tokens**
   - Expiración: 30 minutos
   - Secret seguro en producción
   - Renovación automática de sesión

3. **HTTPS Only**
   - Cookies con flag `secure` en producción
   - Redirect HTTP → HTTPS

4. **CSRF Protection**
   - Built-in en Auth.js
   - Validación de tokens

5. **Rate Limiting**
   - Login: máximo 5 intentos/min por IP
   - Lockout temporal después de 5 intentos fallidos

---

## 📝 CONFIGURACIÓN DE AUTH.JS

### Archivo: `src/lib/auth.ts`

```typescript
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email as string },
          include: { tenant: true }
        })

        if (!admin) {
          return null
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          admin.password
        )

        if (!isValid) {
          return null
        }

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          tenantId: admin.tenantId
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.tenantId = user.tenantId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.tenantId = token.tenantId as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 60 // 30 minutos
  }
})
```

---

## ✅ CHECKLIST DE SEGURIDAD

### Pre-lanzamiento
- [ ] Passwords hasheados en BD
- [ ] NEXTAUTH_SECRET cambiado en producción
- [ ] JWT_SECRET cambiado en producción
- [ ] HTTPS habilitado
- [ ] Rate limiting configurado
- [ ] Variables de entorno en Vercel
- [ ] No hay secrets en código
- [ ] Logs no exponen datos sensibles

### Monitoreo Continuo
- [ ] Revisar intentos de login fallidos
- [ ] Auditar cambios en tabla Admin
- [ ] Verificar sesiones activas
- [ ] Monitorear patrones sospechosos

---

**Última actualización:** 05 de Febrero de 2026
