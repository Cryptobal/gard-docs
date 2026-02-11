/**
 * Middleware - Protección de rutas con Auth.js v5
 * OPAI: opai.gard.cl - Rutas bajo /opai/*
 *
 * Protege: /opai/inicio, /opai/templates/*, /opai/preview/*, /opai/usuarios
 * Permite: /p/*, /api/*, /opai/login, /activate, assets
 *
 * Placeholders públicos: /hub, /crm
 */

import { auth } from '@/lib/auth';
import { hasAppAccess } from '@/lib/app-access';
import type { AppKey } from '@/lib/app-keys';

function isPublicPath(pathname: string): boolean {
  // Placeholders de módulos
  if (pathname === '/hub' || pathname === '/crm') return true;

  // Rutas públicas OPAI - presentaciones y preview (rutas reales: /p/, /preview/, /templates/)
  if (pathname.startsWith('/p/')) return true;
  if (pathname.startsWith('/preview/')) return true;
  if (pathname.startsWith('/postulacion/')) return true;

  // API (rutas reales en /api/)
  if (pathname.startsWith('/api/auth')) return true;
  if (pathname.startsWith('/api/webhook')) return true;
  if (pathname.startsWith('/api/test')) return true;
  if (pathname === '/api/presentations/send-email') return true;
  if (/^\/api\/presentations\/[^/]+\/track$/.test(pathname)) return true;
  if (pathname.startsWith('/api/debug')) return true;
  if (pathname.startsWith('/api/email-preview')) return true;
  if (pathname.startsWith('/api/pdf')) return true;
  if (pathname.startsWith('/api/public')) return true;
  // Firma electrónica pública: GET/POST por token sin sesión
  if (pathname.startsWith('/api/docs/sign')) return true;
  // Vista pública de documento firmado (por viewToken)
  if (pathname.startsWith('/api/docs/signed-view/')) return true;
  // PDF firmado: acceso con viewToken en query (la ruta valida el token)
  if (/^\/api\/docs\/documents\/[^/]+\/signed-pdf$/.test(pathname)) return true;

  // Páginas públicas (raíz / y /opai se manejan abajo para redirigir siempre a login/inicio)
  if (pathname === '/opai/login' || pathname.startsWith('/activate')) return true;
  if (pathname === '/opai/forgot-password' || pathname === '/opai/reset-password') return true;

  // Firma electrónica: link del email, sin login (token en URL)
  if (pathname.startsWith('/sign/')) return true;
  // Ver documento firmado (link público sin login)
  if (pathname.startsWith('/signed/')) return true;

  // Assets y estáticos
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/images') || pathname.startsWith('/logos')) return true;

  return false;
}

function requiredApiModule(pathname: string): AppKey | null {
  if (pathname === '/api/presentations' || pathname === '/api/templates') {
    return 'docs';
  }
  if (pathname.startsWith('/api/cpq/')) return 'cpq';
  if (pathname.startsWith('/api/crm/')) return 'crm';
  if (pathname.startsWith('/api/docs/')) return 'docs';
  if (pathname.startsWith('/api/payroll/')) return 'payroll';
  return null;
}

function getAuthRole(authData: unknown): string {
  if (!authData || typeof authData !== 'object') return '';
  const authObj = authData as { role?: string; user?: { role?: string } };
  return authObj.user?.role ?? authObj.role ?? '';
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Entrada al sitio: siempre llevar a login (sin sesión) o al Hub (con sesión)
  if (pathname === '/' || pathname === '/opai') {
    if (!req.auth) {
      const loginUrl = new URL('/opai/login', req.nextUrl.origin);
      loginUrl.searchParams.set('callbackUrl', '/hub');
      return Response.redirect(loginUrl);
    }
    return Response.redirect(new URL('/hub', req.nextUrl.origin));
  }

  if (isPublicPath(pathname)) return;

  // Rutas protegidas: sin sesión -> login OPAI
  if (!req.auth) {
    const loginUrl = new URL('/opai/login', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return Response.redirect(loginUrl);
  }

  // Endurecimiento de APIs por módulo para evitar bypass backend por URL directa
  const requiredModule = requiredApiModule(pathname);
  if (requiredModule) {
    const role = getAuthRole(req.auth);
    if (role && !hasAppAccess(role, requiredModule)) {
      return Response.json(
        { success: false, error: `Sin permisos para módulo ${requiredModule.toUpperCase()}` },
        { status: 403 }
      );
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
