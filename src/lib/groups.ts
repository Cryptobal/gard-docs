/**
 * Groups — Grupos de usuarios para organización y cadenas de aprobación
 *
 * Los grupos son independientes de los roles:
 *  - Rol = qué puede hacer (permisos CRUD)
 *  - Grupo = a qué equipo/departamento pertenece
 *
 * Un usuario puede pertenecer a N grupos simultáneamente.
 * Las cadenas de aprobación de tickets referencian grupos.
 */

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export interface AdminGroup {
  id: string;
  tenantId: string;
  slug: string;
  name: string;
  description: string | null;
  color: string; // hex color for badges
  isSystem: boolean; // system groups cannot be deleted
  isActive: boolean;
  membersCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type GroupMemberRole = "member" | "lead";

export interface AdminGroupMembership {
  id: string;
  groupId: string;
  adminId: string;
  role: GroupMemberRole;
  joinedAt: string;
  // Populated
  adminName?: string;
  adminEmail?: string;
  adminRole?: string;
  groupName?: string;
  groupSlug?: string;
}

// ═══════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════

export const GROUP_MEMBER_ROLES: { value: GroupMemberRole; label: string; description: string }[] = [
  { value: "member", label: "Miembro", description: "Pertenece al grupo, recibe notificaciones" },
  { value: "lead", label: "Líder", description: "Puede aprobar en nombre del grupo y gestionar miembros" },
];

export const GROUP_COLORS = [
  { value: "#3B82F6", label: "Azul" },
  { value: "#10B981", label: "Verde" },
  { value: "#F59E0B", label: "Ámbar" },
  { value: "#EF4444", label: "Rojo" },
  { value: "#8B5CF6", label: "Violeta" },
  { value: "#EC4899", label: "Rosa" },
  { value: "#06B6D4", label: "Cyan" },
  { value: "#F97316", label: "Naranja" },
  { value: "#6B7280", label: "Gris" },
  { value: "#14B8A6", label: "Teal" },
] as const;

// ═══════════════════════════════════════════════════════════════
//  SEED DATA — Default groups per tenant
// ═══════════════════════════════════════════════════════════════

export const GROUP_SEEDS: Omit<AdminGroup, "id" | "tenantId" | "membersCount" | "createdAt" | "updatedAt">[] = [
  {
    slug: "rrhh",
    name: "Recursos Humanos",
    description: "Gestión de personas, contrataciones, desvinculaciones y beneficios",
    color: "#3B82F6",
    isSystem: true,
    isActive: true,
  },
  {
    slug: "operaciones",
    name: "Operaciones",
    description: "Gestión operativa: pautas, asignaciones, supervisión en terreno",
    color: "#10B981",
    isSystem: true,
    isActive: true,
  },
  {
    slug: "finanzas",
    name: "Finanzas",
    description: "Pagos, sueldos, rendiciones y control financiero",
    color: "#F59E0B",
    isSystem: true,
    isActive: true,
  },
  {
    slug: "inventario",
    name: "Inventario",
    description: "Uniformes, equipos, activos y control de implementos",
    color: "#8B5CF6",
    isSystem: true,
    isActive: true,
  },
  {
    slug: "it_admin",
    name: "IT / Admin",
    description: "Soporte técnico de plataforma y administración de sistemas",
    color: "#06B6D4",
    isSystem: true,
    isActive: true,
  },
  {
    slug: "gerencia",
    name: "Gerencia",
    description: "Nivel ejecutivo, aprobaciones de alto nivel",
    color: "#EF4444",
    isSystem: true,
    isActive: true,
  },
];

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════

/** Generate a slug from group name */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/** Check if a user (by group memberships) can approve for a given group */
export function canApproveForGroup(
  memberships: AdminGroupMembership[],
  groupId: string,
): boolean {
  return memberships.some((m) => m.groupId === groupId);
}

/** Get groups where user is a lead */
export function getLeadGroups(memberships: AdminGroupMembership[]): AdminGroupMembership[] {
  return memberships.filter((m) => m.role === "lead");
}

/** Get group display badge style */
export function getGroupBadgeStyle(color: string): { backgroundColor: string; color: string; borderColor: string } {
  return {
    backgroundColor: `${color}15`,
    color: color,
    borderColor: `${color}30`,
  };
}
