'use client';

/**
 * RolesHelpCard - Modal con matriz de permisos por rol
 * Muestra una tabla visual de qué puede hacer cada rol
 */

import { PERMISSIONS, hasPermission, type Role } from '@/lib/rbac';
import { hasAppAccess } from '@/lib/app-access';
import {
  hasConfigSubmoduleAccess,
  hasCrmSubmoduleAccess,
  hasDocsSubmoduleAccess,
} from '@/lib/module-access';
import { HelpCircle, Check, X as XIcon } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Propietario',
  admin: 'Admin',
  editor: 'Editor',
  rrhh: 'RRHH',
  operaciones: 'Operaciones',
  reclutamiento: 'Reclutamiento',
  solo_documentos: 'Solo Documentos',
  solo_crm: 'Solo CRM',
  solo_ops: 'Solo Ops',
  solo_payroll: 'Solo Payroll',
  viewer: 'Visualizador',
};

const MODULE_RULES: Array<{ label: string; check: (role: Role) => boolean }> = [
  { label: 'Hub', check: (role) => hasAppAccess(role, 'hub') },
  { label: 'Documentos', check: (role) => hasAppAccess(role, 'docs') },
  { label: 'CRM', check: (role) => hasAppAccess(role, 'crm') },
  { label: 'CPQ', check: (role) => hasAppAccess(role, 'cpq') },
  { label: 'Payroll', check: (role) => hasAppAccess(role, 'payroll') },
  { label: 'Ops', check: (role) => hasAppAccess(role, 'ops') },
  { label: 'Configuración', check: (role) => hasConfigSubmoduleAccess(role, 'overview') },
];

const SUBMODULE_RULES: Array<{ label: string; check: (role: Role) => boolean }> = [
  { label: 'Docs · Editor de texto', check: (role) => hasDocsSubmoduleAccess(role, 'document_editor') },
  { label: 'CRM · Leads', check: (role) => hasCrmSubmoduleAccess(role, 'leads') },
  { label: 'Configuración · Usuarios', check: (role) => hasConfigSubmoduleAccess(role, 'users') },
  { label: 'Configuración · Integraciones', check: (role) => hasConfigSubmoduleAccess(role, 'integrations') },
  { label: 'Configuración · Notificaciones', check: (role) => hasConfigSubmoduleAccess(role, 'notifications') },
];

const PERMISSION_RULES: Array<{ label: string; key: (typeof PERMISSIONS)[keyof typeof PERMISSIONS] }> = [
  { label: 'Gestionar usuarios', key: PERMISSIONS.MANAGE_USERS },
  { label: 'Invitar usuarios', key: PERMISSIONS.INVITE_USERS },
  { label: 'Gestionar templates', key: PERMISSIONS.MANAGE_TEMPLATES },
  { label: 'Editar templates', key: PERMISSIONS.EDIT_TEMPLATES },
  { label: 'Ver templates', key: PERMISSIONS.VIEW_TEMPLATES },
  { label: 'Enviar propuestas', key: PERMISSIONS.SEND_PRESENTATIONS },
  { label: 'Crear presentaciones', key: PERMISSIONS.CREATE_PRESENTATIONS },
  { label: 'Ver presentaciones', key: PERMISSIONS.VIEW_PRESENTATIONS },
  { label: 'Ver analytics', key: PERMISSIONS.VIEW_ANALYTICS },
  { label: 'Gestionar configuración', key: PERMISSIONS.MANAGE_SETTINGS },
];

export default function RolesHelpCard() {
  const [open, setOpen] = useState(false);
  const rolesOrder: Role[] = [
    'owner',
    'admin',
    'editor',
    'rrhh',
    'operaciones',
    'reclutamiento',
    'solo_documentos',
    'solo_crm',
    'solo_ops',
    'solo_payroll',
    'viewer',
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <HelpCircle className="w-5 h-5 text-amber-400" />
          <span>Ver permisos</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[96vw] max-w-[1400px] h-[92vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-2">
          <DialogTitle className="text-xl">Matriz de Permisos por Rol</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto pr-1">
          <p className="text-sm text-muted-foreground">
            Vista real del sistema basada en la política central de roles. Si se agrega un rol nuevo, esta vista se actualiza desde esa misma fuente.
          </p>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {rolesOrder.map((role) => (
              <section
                key={role}
                className="rounded-xl border border-border bg-card/40 p-4 space-y-4"
              >
                <h3 className="text-base font-semibold">{ROLE_LABELS[role]}</h3>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Módulos visibles</p>
                  <div className="flex flex-wrap gap-2">
                    {MODULE_RULES.filter((rule) => rule.check(role)).map((rule) => (
                      <span
                        key={`${role}-module-${rule.label}`}
                        className="inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300"
                      >
                        {rule.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Submódulos clave</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {SUBMODULE_RULES.map((rule) => {
                      const has = rule.check(role);
                      return (
                        <div
                          key={`${role}-submodule-${rule.label}`}
                          className="flex items-center gap-2 text-xs"
                        >
                          {has ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <XIcon className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                          )}
                          <span className={has ? "text-foreground" : "text-muted-foreground"}>
                            {rule.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Permisos funcionales</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {PERMISSION_RULES.map((perm) => {
                      const has = hasPermission(role, perm.key);
                      return (
                        <div key={`${role}-permission-${perm.key}`} className="flex items-center gap-2 text-xs">
                          {has ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <XIcon className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                          )}
                          <span className={has ? "text-foreground" : "text-muted-foreground"}>{perm.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            ))}
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground space-y-2">
            <p><strong className="text-foreground">Fuente única:</strong> `src/lib/role-policy.ts`.</p>
            <p><strong className="text-purple-400">Propietario:</strong> acceso total a módulos, submódulos y permisos.</p>
            <p><strong className="text-blue-400">Administrador:</strong> acceso total a módulos, submódulos y permisos.</p>
            <p><strong className="text-green-400">Editor:</strong> ve módulos operativos (incluye Ops) sin acceso a Configuración.</p>
            <p><strong className="text-cyan-400">Roles Solo módulo:</strong> acceso exclusivo a su módulo asignado.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
