/**
 * Middleware - Protección de rutas con Auth.js v5
 * Protege: /inicio, /templates/*, /preview/*
 * Permite: /p/*, /api/auth/*, /api/webhook/*, assets, login
 */

import { auth } from '@/lib/auth';

function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith('/p/')) return true;
  if (pathname.startsWith('/api/auth')) return true;
  if (pathname.startsWith('/api/webhook')) return true;
  if (pathname === '/api/presentations/send-email') return true;
  if (/^\/api\/presentations\/[^/]+\/track$/.test(pathname)) return true;
  if (pathname.startsWith('/api/debug')) return true;
  if (pathname.startsWith('/api/email-preview')) return true;
  if (pathname.startsWith('/api/pdf')) return true;
  if (pathname === '/' || pathname === '/login') return true;
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.startsWith('/images') || pathname.startsWith('/logos')) return true;
  return false;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (isPublicPath(pathname)) return;
  // Rutas protegidas: sin sesión -> login
  if (!req.auth) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: [
    // Excluir estáticos y api interna que no necesita auth en middleware
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
