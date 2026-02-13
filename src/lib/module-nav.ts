/**
 * Module Navigation — Configuración centralizada para bottom nav contextual.
 *
 * Define los sub-items de cada módulo con iconos, labels y hrefs.
 * Usado por BottomNav para mostrar navegación contextual cuando el usuario
 * está dentro de un módulo específico.
 *
 * Patrón mobile-first nivel Salesforce/HubSpot: al entrar en un módulo,
 * el bottom nav muestra las subcategorías del módulo en lugar del menú principal.
 */

import type { LucideIcon } from "lucide-react";
import {
  // Main nav
  Grid3x3,
  FileText,
  Building2,
  Calculator,
  ClipboardList,
  Settings,
  // CRM
  Users,
  MapPin,
  TrendingUp,
  Contact,
  DollarSign,
  // Ops
  CalendarDays,
  UserRoundCheck,
  ShieldAlert,
  Fingerprint,
  // TE
  CheckCircle2,
  Layers,
  Banknote,
  // Personas
  Shield,
  Ban,
  // Docs
  FolderOpen,
  // Config
  Plug,
  Bell,
} from "lucide-react";
import {
  CRM_SECTIONS,
  MODULE_DETAIL_SECTIONS,
} from "@/components/crm/CrmModuleIcons";
import { hasAppAccess } from "./app-access";
import {
  hasCrmSubmoduleAccess,
  hasConfigSubmoduleAccess,
  hasAnyConfigSubmoduleAccess,
  type CrmSubmoduleKey,
  type ConfigSubmoduleKey,
} from "./module-access";

/* ── Types ── */

export interface BottomNavItem {
  key: string;
  href: string;
  label: string;
  icon: LucideIcon;
  /** Si true, el item es un ancla de sección (scroll) en vez de un link de navegación */
  isSection?: boolean;
}

/* ── Main nav items ── */

const MAIN_ITEMS: (BottomNavItem & { app: string })[] = [
  { key: "hub", href: "/hub", label: "Inicio", icon: Grid3x3, app: "hub" },
  { key: "docs", href: "/opai/inicio", label: "Docs", icon: FileText, app: "docs" },
  { key: "crm", href: "/crm", label: "CRM", icon: Building2, app: "crm" },
  { key: "payroll", href: "/payroll", label: "Payroll", icon: Calculator, app: "payroll" },
  { key: "ops", href: "/ops", label: "Ops", icon: ClipboardList, app: "ops" },
  { key: "config", href: "/opai/configuracion", label: "Config", icon: Settings, app: "admin" },
];

/* ── CRM sub-items ── */

const CRM_ITEMS: (BottomNavItem & { subKey: CrmSubmoduleKey })[] = [
  { key: "crm-leads", href: "/crm/leads", label: "Leads", icon: Users, subKey: "leads" },
  { key: "crm-accounts", href: "/crm/accounts", label: "Cuentas", icon: Building2, subKey: "accounts" },
  { key: "crm-installations", href: "/crm/installations", label: "Instalaciones", icon: MapPin, subKey: "installations" },
  { key: "crm-deals", href: "/crm/deals", label: "Negocios", icon: TrendingUp, subKey: "deals" },
  { key: "crm-contacts", href: "/crm/contacts", label: "Contactos", icon: Contact, subKey: "contacts" },
  { key: "crm-quotes", href: "/crm/cotizaciones", label: "CPQ", icon: DollarSign, subKey: "quotes" },
];

/* ── Ops sub-items ── */

const OPS_ITEMS: BottomNavItem[] = [
  { key: "ops-puestos", href: "/ops/puestos", label: "Puestos", icon: ClipboardList },
  { key: "ops-pauta-mensual", href: "/ops/pauta-mensual", label: "Mensual", icon: CalendarDays },
  { key: "ops-pauta-diaria", href: "/ops/pauta-diaria", label: "Diaria", icon: UserRoundCheck },
  { key: "ops-marcaciones", href: "/ops/marcaciones", label: "Marcaciones", icon: Fingerprint },
  { key: "ops-ppc", href: "/ops/ppc", label: "PPC", icon: ShieldAlert },
];

/* ── TE sub-items ── */

const TE_ITEMS: BottomNavItem[] = [
  { key: "te-registro", href: "/te/registro", label: "Registro", icon: ClipboardList },
  { key: "te-aprobaciones", href: "/te/aprobaciones", label: "Aprobaciones", icon: CheckCircle2 },
  { key: "te-lotes", href: "/te/lotes", label: "Lotes", icon: Layers },
  { key: "te-pagos", href: "/te/pagos", label: "Pagos", icon: Banknote },
];

/* ── Personas sub-items ── */

const PERSONAS_ITEMS: BottomNavItem[] = [
  { key: "personas-guardias", href: "/personas/guardias", label: "Guardias", icon: Shield },
  { key: "personas-lista-negra", href: "/personas/lista-negra", label: "Lista negra", icon: Ban },
];

/* ── Payroll sub-items ── */

const PAYROLL_ITEMS: BottomNavItem[] = [
  { key: "payroll-simulator", href: "/payroll/simulator", label: "Simulador", icon: Calculator },
  { key: "payroll-parameters", href: "/payroll/parameters", label: "Parámetros", icon: FileText },
];

/* ── Docs sub-items ── */

const DOCS_ITEMS: BottomNavItem[] = [
  { key: "docs-presentaciones", href: "/opai/inicio", label: "Envíos", icon: FileText },
  { key: "docs-gestion", href: "/opai/documentos", label: "Gestión", icon: FolderOpen },
];

/* ── Config sub-items (top 5 for bottom nav) ── */

const CONFIG_ITEMS: (BottomNavItem & { subKey: ConfigSubmoduleKey })[] = [
  { key: "config-users", href: "/opai/configuracion/usuarios", label: "Usuarios", icon: Users, subKey: "users" },
  { key: "config-integrations", href: "/opai/configuracion/integraciones", label: "Integraciones", icon: Plug, subKey: "integrations" },
  { key: "config-notifications", href: "/opai/configuracion/notificaciones", label: "Alertas", icon: Bell, subKey: "notifications" },
  { key: "config-crm", href: "/opai/configuracion/crm", label: "CRM", icon: TrendingUp, subKey: "crm" },
  { key: "config-cpq", href: "/opai/configuracion/cpq", label: "CPQ", icon: DollarSign, subKey: "cpq" },
  { key: "config-ops", href: "/opai/configuracion/ops", label: "Ops", icon: ClipboardList, subKey: "ops" },
];

/* ── Module detection ── */

interface ModuleDetection {
  test: (path: string) => boolean;
  getItems: (role: string) => BottomNavItem[];
}

const MODULE_DETECTIONS: ModuleDetection[] = [
  {
    test: (p) => p === "/crm" || p.startsWith("/crm/"),
    getItems: (role) =>
      CRM_ITEMS.filter((item) => hasCrmSubmoduleAccess(role, item.subKey)),
  },
  {
    test: (p) => p === "/ops" || p.startsWith("/ops/"),
    getItems: () => OPS_ITEMS,
  },
  {
    test: (p) => p === "/te" || p.startsWith("/te/"),
    getItems: () => TE_ITEMS,
  },
  {
    test: (p) => p === "/personas" || p.startsWith("/personas/"),
    getItems: () => PERSONAS_ITEMS,
  },
  {
    test: (p) => p === "/payroll" || p.startsWith("/payroll/"),
    getItems: () => PAYROLL_ITEMS,
  },
  {
    test: (p) =>
      p.startsWith("/opai/inicio") ||
      p.startsWith("/opai/documentos") ||
      p.startsWith("/opai/templates"),
    getItems: () => DOCS_ITEMS,
  },
  {
    test: (p) => p.startsWith("/opai/configuracion"),
    getItems: (role) =>
      CONFIG_ITEMS.filter((item) =>
        hasConfigSubmoduleAccess(role, item.subKey)
      ),
  },
];

/* ── CRM detail page → section items ── */

const CRM_MODULE_MAP: Record<string, string> = {
  leads: "leads",
  accounts: "accounts",
  contacts: "contacts",
  deals: "deals",
  installations: "installations",
  cotizaciones: "quotes",
};

/** Abreviaciones para el bottom nav (espacio limitado) */
const SECTION_SHORT_LABELS: Record<string, string> = {
  general: "Info",
  account: "Cuenta",
  contacts: "Contacto",
  deals: "Negocio",
  installations: "Instal.",
  quotes: "CPQ",
  followup: "Seguim.",
  communication: "Correos",
  notes: "Notas",
  staffing: "Puestos",
  dotacion: "Dotación",
  files: "Archivos",
};

/**
 * Detecta si el pathname es una página de detalle CRM (ej: /crm/leads/cm7xxx)
 * y devuelve los items de sección para la bottom nav.
 */
function getCrmDetailSectionItems(pathname: string): BottomNavItem[] | null {
  // Patrón: /crm/{module}/{id} donde id es un cuid (cm...) u otro identificador
  const match = pathname.match(
    /^\/crm\/(leads|accounts|contacts|deals|installations|cotizaciones)\/([^/]+)$/
  );
  if (!match) return null;

  const moduleKey = CRM_MODULE_MAP[match[1]];
  if (!moduleKey) return null;

  const sectionKeys = MODULE_DETAIL_SECTIONS[moduleKey];
  if (!sectionKeys || sectionKeys.length === 0) return null;

  return sectionKeys.map((key) => {
    const section = CRM_SECTIONS[key];
    return {
      key: `section-${key}`,
      href: `#section-${key}`,
      label: SECTION_SHORT_LABELS[key] || section.label,
      icon: section.icon,
      isSection: true,
    };
  });
}

/**
 * Devuelve los items del bottom nav según la ruta actual y el rol del usuario.
 *
 * - En detalle CRM: muestra secciones del registro (scroll a anclas)
 * - Dentro de un módulo: muestra subcategorías del módulo
 * - En ruta general: muestra navegación principal
 */
export function getBottomNavItems(
  pathname: string,
  role: string
): BottomNavItem[] {
  // Prioridad 1: páginas de detalle CRM → secciones del registro
  const sectionItems = getCrmDetailSectionItems(pathname);
  if (sectionItems) return sectionItems;

  // Prioridad 2: módulos → subcategorías
  for (const detection of MODULE_DETECTIONS) {
    if (detection.test(pathname)) {
      const items = detection.getItems(role);
      if (items.length > 0) return items;
    }
  }

  // Default: main nav items
  return MAIN_ITEMS.filter((item) => {
    if (item.app === "admin") return hasAnyConfigSubmoduleAccess(role);
    return hasAppAccess(role, item.app as Parameters<typeof hasAppAccess>[1]);
  });
}

/* ── Exports para SubNav components ── */

export const OPS_SUBNAV_ITEMS = OPS_ITEMS;
export const TE_SUBNAV_ITEMS = TE_ITEMS;
export const PERSONAS_SUBNAV_ITEMS = PERSONAS_ITEMS;
export const PAYROLL_SUBNAV_ITEMS = PAYROLL_ITEMS;
export const DOCS_SUBNAV_ITEMS = DOCS_ITEMS;
