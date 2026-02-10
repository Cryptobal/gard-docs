/**
 * Página de login - Auth.js v5 Credentials
 * Fuera de (app) para evitar redirect loop - no requiere layout con auth
 * Redirige a /hub tras login exitoso
 */

import Image from 'next/image';
import { LoginForm } from './LoginForm';

export const metadata = {
  title: 'Iniciar sesión - OPAI',
  description: 'Acceso al panel OPAI',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || '/hub';
  const error = params.error;
  const success = params.success;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Image
            src="/icons/icon-96x96.png"
            alt="OPAI"
            width={64}
            height={64}
            className="mx-auto h-16 w-16 object-contain"
            priority
          />
          <h1 className="text-2xl font-bold text-foreground mt-3">OPAI</h1>
          <p className="text-muted-foreground mt-1 text-sm">Iniciar sesión</p>
        </div>
        <LoginForm callbackUrl={callbackUrl} error={error} success={success} />
        <p className="text-center text-xs text-muted-foreground">
          opai.gard.cl · Gard Security
        </p>
      </div>
    </div>
  );
}
