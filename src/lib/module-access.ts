/**
 * Module Access - Visibilidad por submódulo según rol.
 *
 * Complementa App Access (módulo principal) con reglas finas para:
 * - CRM (submódulos)
 * - Configuración (submódulos)
 * - Docs (incluye editor de texto/templates)
 */

import { hasAppAccess } from "./app-access";
import { type Role } from "./rbac";

export type CrmSubmoduleKey =
  | "overview"
  | "leads"
  | "accounts"
  | "installations"
  | "contacts"
  | "deals"
  | "quotes";

export type ConfigSubmoduleKey =
  | "overview"
  | "users"
  | "integrations"
  | "signatures"
  | "doc_categories"
  | "notifications"
  | "crm"
  | "cpq"
  | "payroll";

export type DocsSubmoduleKey =
  | "overview"
  | "documents"
  | "document_editor"
  | "templates"
  | "template_editor";

export interface SubmoduleNavItem<K extends string> {
  key: K;
  href: string;
  label: string;
}

export const CRM_SUBMODULE_NAV_ITEMS: SubmoduleNavItem<CrmSubmoduleKey>[] = [
  { key: "leads", href: "/crm/leads", label: "Leads" },
  { key: "accounts", href: "/crm/accounts", label: "Cuentas" },
  { key: "installations", href: "/crm/installations", label: "Instalaciones" },
  { key: "contacts", href: "/crm/contacts", label: "Contactos" },
  { key: "deals", href: "/crm/deals", label: "Negocios" },
  { key: "quotes", href: "/crm/cotizaciones", label: "Cotizaciones" },
];

export const CONFIG_SUBMODULE_NAV_ITEMS: SubmoduleNavItem<ConfigSubmoduleKey>[] = [
  { key: "users", href: "/opai/configuracion/usuarios", label: "Usuarios" },
  { key: "integrations", href: "/opai/configuracion/integraciones", label: "Integraciones" },
  { key: "signatures", href: "/opai/configuracion/firmas", label: "Firmas" },
  { key: "doc_categories", href: "/opai/configuracion/categorias-plantillas", label: "Categorías plantillas" },
  { key: "crm", href: "/opai/configuracion/crm", label: "CRM" },
  { key: "cpq", href: "/opai/configuracion/cpq", label: "Configuración CPQ" },
  { key: "payroll", href: "/opai/configuracion/payroll", label: "Payroll" },
  { key: "notifications", href: "/opai/configuracion/notificaciones", label: "Notificaciones" },
];

const ROLE_CRM_SUBMODULE_ACCESS: Record<Role, CrmSubmoduleKey[]> = {
  owner: ["overview", "leads", "accounts", "installations", "contacts", "deals", "quotes"],
  admin: ["overview", "leads", "accounts", "installations", "contacts", "deals", "quotes"],
  editor: ["overview", "leads", "accounts", "installations", "contacts", "deals", "quotes"],
  rrhh: [],
  operaciones: [],
  reclutamiento: [],
  solo_ops: [],
  solo_crm: ["overview", "leads", "accounts", "installations", "contacts", "deals", "quotes"],
  solo_documentos: [],
  solo_payroll: [],
  viewer: [],
};

const ROLE_CONFIG_SUBMODULE_ACCESS: Record<Role, ConfigSubmoduleKey[]> = {
  owner: ["overview", "users", "integrations", "signatures", "doc_categories", "notifications", "crm", "cpq", "payroll"],
  admin: ["overview", "users", "integrations", "signatures", "doc_categories", "notifications", "crm", "cpq", "payroll"],
  editor: [],
  rrhh: [],
  operaciones: [],
  reclutamiento: [],
  solo_ops: [],
  solo_crm: [],
  solo_documentos: [],
  solo_payroll: [],
  viewer: [],
};

const ROLE_DOCS_SUBMODULE_ACCESS: Record<Role, DocsSubmoduleKey[]> = {
  owner: ["overview", "documents", "document_editor", "templates", "template_editor"],
  admin: ["overview", "documents", "document_editor", "templates", "template_editor"],
  editor: ["overview", "documents", "document_editor", "templates", "template_editor"],
  rrhh: [],
  operaciones: [],
  reclutamiento: [],
  solo_ops: [],
  solo_crm: [],
  solo_documentos: ["overview", "documents", "templates"],
  solo_payroll: [],
  viewer: ["overview", "documents", "templates"],
};

function hasRoleSubmoduleAccess<K extends string>(
  role: string,
  matrix: Record<Role, K[]>,
  key: K
): boolean {
  if (!(role in matrix)) {
    return false;
  }

  return matrix[role as Role].includes(key);
}

export function hasCrmSubmoduleAccess(role: string, key: CrmSubmoduleKey): boolean {
  if (!hasAppAccess(role, "crm")) {
    return false;
  }

  return hasRoleSubmoduleAccess(role, ROLE_CRM_SUBMODULE_ACCESS, key);
}

export function hasConfigSubmoduleAccess(role: string, key: ConfigSubmoduleKey): boolean {
  if (!hasAppAccess(role, "admin")) {
    return false;
  }

  return hasRoleSubmoduleAccess(role, ROLE_CONFIG_SUBMODULE_ACCESS, key);
}

export function hasDocsSubmoduleAccess(role: string, key: DocsSubmoduleKey): boolean {
  if (!hasAppAccess(role, "docs")) {
    return false;
  }

  return hasRoleSubmoduleAccess(role, ROLE_DOCS_SUBMODULE_ACCESS, key);
}

export function getVisibleCrmNavItems(role: string): SubmoduleNavItem<CrmSubmoduleKey>[] {
  return CRM_SUBMODULE_NAV_ITEMS.filter((item) => hasCrmSubmoduleAccess(role, item.key));
}

export function getVisibleConfigNavItems(
  role: string
): SubmoduleNavItem<ConfigSubmoduleKey>[] {
  return CONFIG_SUBMODULE_NAV_ITEMS.filter((item) =>
    hasConfigSubmoduleAccess(role, item.key)
  );
}

export function hasAnyConfigSubmoduleAccess(role: string): boolean {
  return getVisibleConfigNavItems(role).length > 0;
}
