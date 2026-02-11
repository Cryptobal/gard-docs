export type OpsCapability =
  | "guardias_manage"
  | "guardias_blacklist"
  | "guardias_documents"
  | "ops_execution"
  | "te_execution"
  | "rrhh_events";

const ROLE_OPS_CAPABILITIES: Record<string, OpsCapability[]> = {
  owner: [
    "guardias_manage",
    "guardias_blacklist",
    "guardias_documents",
    "ops_execution",
    "te_execution",
    "rrhh_events",
  ],
  admin: [
    "guardias_manage",
    "guardias_blacklist",
    "guardias_documents",
    "ops_execution",
    "te_execution",
    "rrhh_events",
  ],
  editor: ["guardias_manage", "guardias_documents", "ops_execution", "te_execution"],
  rrhh: ["guardias_manage", "guardias_blacklist", "guardias_documents", "rrhh_events"],
  operaciones: ["guardias_documents", "ops_execution", "te_execution"],
  reclutamiento: ["guardias_manage", "guardias_documents"],
  viewer: [],
};

export function hasOpsCapability(role: string, capability: OpsCapability): boolean {
  return (ROLE_OPS_CAPABILITIES[role] || []).includes(capability);
}
