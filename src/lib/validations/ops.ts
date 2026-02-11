import { z } from "zod";

const weekdayEnum = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createPuestoSchema = z.object({
  installationId: z.string().uuid("installationId inválido"),
  name: z.string().trim().min(1, "Nombre es requerido").max(200),
  shiftStart: z.string().regex(timeRegex, "shiftStart debe tener formato HH:MM"),
  shiftEnd: z.string().regex(timeRegex, "shiftEnd debe tener formato HH:MM"),
  weekdays: z.array(weekdayEnum).min(1, "Debe seleccionar al menos un día"),
  requiredGuards: z.number().int().min(1).max(20).default(1),
  teMontoClp: z.number().min(0).optional().nullable(),
  active: z.boolean().optional(),
});

export const updatePuestoSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  shiftStart: z.string().regex(timeRegex, "shiftStart debe tener formato HH:MM").optional(),
  shiftEnd: z.string().regex(timeRegex, "shiftEnd debe tener formato HH:MM").optional(),
  weekdays: z.array(weekdayEnum).min(1).optional(),
  requiredGuards: z.number().int().min(1).max(20).optional(),
  teMontoClp: z.number().min(0).optional().nullable(),
  active: z.boolean().optional(),
});

export const bulkCreatePuestosSchema = z.object({
  installationId: z.string().uuid("installationId inválido"),
  puestos: z.array(createPuestoSchema.omit({ installationId: true })).min(1, "Debes enviar al menos un puesto"),
});

export const upsertPautaItemSchema = z.object({
  puestoId: z.string().uuid("puestoId inválido"),
  date: z.string().regex(dateRegex, "date debe tener formato YYYY-MM-DD"),
  plannedGuardiaId: z.string().uuid("plannedGuardiaId inválido").optional().nullable(),
  status: z.string().trim().min(1).max(50).default("planificado"),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const generatePautaSchema = z.object({
  installationId: z.string().uuid("installationId inválido"),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  overwrite: z.boolean().default(false),
  defaultGuardiaId: z.string().uuid("defaultGuardiaId inválido").optional().nullable(),
});

export const updateAsistenciaSchema = z.object({
  attendanceStatus: z.enum(["pendiente", "asistio", "no_asistio", "reemplazo", "ppc"]).optional(),
  actualGuardiaId: z.string().uuid("actualGuardiaId inválido").optional().nullable(),
  replacementGuardiaId: z.string().uuid("replacementGuardiaId inválido").optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  checkInAt: z.string().datetime().optional().nullable(),
  checkOutAt: z.string().datetime().optional().nullable(),
});

export const createGuardiaSchema = z.object({
  firstName: z.string().trim().min(1, "Nombre es requerido").max(100),
  lastName: z.string().trim().min(1, "Apellido es requerido").max(100),
  rut: z.string().trim().max(20).optional().nullable(),
  email: z.string().trim().email("Email inválido").max(200).optional().nullable().or(z.literal("")),
  phone: z.string().trim().max(30).optional().nullable(),
  code: z.string().trim().max(50).optional().nullable(),
  bankName: z.string().trim().max(100).optional().nullable(),
  accountType: z.string().trim().max(50).optional().nullable(),
  accountNumber: z.string().trim().max(100).optional().nullable(),
  holderName: z.string().trim().max(150).optional().nullable(),
  holderRut: z.string().trim().max(20).optional().nullable(),
});

export const updateGuardiaSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  rut: z.string().trim().max(20).optional().nullable(),
  email: z.string().trim().email("Email inválido").max(200).optional().nullable().or(z.literal("")),
  phone: z.string().trim().max(30).optional().nullable(),
  code: z.string().trim().max(50).optional().nullable(),
  status: z.string().trim().max(50).optional(),
});

export const updateBlacklistSchema = z.object({
  isBlacklisted: z.boolean(),
  reason: z.string().trim().max(500).optional().nullable(),
});

export const rejectTeSchema = z.object({
  reason: z.string().trim().max(500).optional().nullable(),
});

export const createLoteTeSchema = z.object({
  weekStart: z.string().regex(dateRegex, "weekStart debe tener formato YYYY-MM-DD"),
  weekEnd: z.string().regex(dateRegex, "weekEnd debe tener formato YYYY-MM-DD"),
});
