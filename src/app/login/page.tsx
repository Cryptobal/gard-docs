/**
 * Página de login - Auth.js v5 Credentials
 * Redirige a /inicio tras login exitoso
 */

import { signIn } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Iniciar sesión - Gard Docs',
  description: 'Acceso al panel administrativo',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || '/inicio';
  const error = params.error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Gard Docs</h1>
          <p className="text-slate-400 mt-1">Iniciar sesión</p>
        </div>
        <form
          action={async (formData: FormData) => {
            'use server';
            await signIn('credentials', {
              email: String(formData.get('email') ?? ''),
              password: String(formData.get('password') ?? ''),
              redirectTo: callbackUrl,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="admin@gard.cl"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400">
              {error === 'CredentialsSignin' ? 'Email o contraseña incorrectos.' : 'Error al iniciar sesión.'}
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-lg bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Entrar
          </button>
        </form>
        <p className="text-center text-sm text-slate-500">
          Panel administrativo · Gard Security
        </p>
      </div>
    </div>
  );
}
