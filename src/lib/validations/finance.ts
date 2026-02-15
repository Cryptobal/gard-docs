/**
 * Zod schemas for Finance / Accounting API validation
 */

import { z } from "zod";

// ── Account Plan ──

export const createAccountSchema = z.object({
  code: z.string().trim().min(1).max(20),
  name: z.string().trim().min(1).max(200),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "COST", "EXPENSE"]),
  nature: z.enum(["DEBIT", "CREDIT"]),
  parentId: z.string().uuid().optional().nullable(),
  level: z.number().int().min(1).max(10),
  acceptsEntries: z.boolean(),
  description: z.string().trim().max(500).optional().nullable(),
  taxCode: z.string().trim().max(20).optional().nullable(),
});

export const updateAccountSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
  acceptsEntries: z.boolean().optional(),
});

// ── Accounting Periods ──

export const openPeriodSchema = z.object({
  year: z.number().int().min(2020).max(2099),
  month: z.number().int().min(1).max(12),
});

// ── Journal Entries ──

const journalLineSchema = z.object({
  accountId: z.string().uuid(),
  description: z.string().trim().max(500).optional().nullable(),
  debit: z.number().min(0),
  credit: z.number().min(0),
  costCenterId: z.string().uuid().optional().nullable(),
  thirdPartyId: z.string().optional().nullable(),
  thirdPartyType: z.enum(["CUSTOMER", "SUPPLIER"]).optional().nullable(),
});

export const createJournalEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha debe ser YYYY-MM-DD"),
  description: z.string().trim().min(1).max(500),
  reference: z.string().trim().max(100).optional().nullable(),
  sourceType: z
    .enum([
      "MANUAL",
      "INVOICE_ISSUED",
      "INVOICE_RECEIVED",
      "PAYMENT",
      "RECONCILIATION",
      "FACTORING",
      "EXPENSE_REPORT",
      "OPENING",
      "CLOSING",
    ])
    .optional(),
  sourceId: z.string().optional().nullable(),
  costCenterId: z.string().uuid().optional().nullable(),
  lines: z.array(journalLineSchema).min(2, "Un asiento requiere al menos 2 lineas"),
});

// ── Suppliers ──

export const createSupplierSchema = z.object({
  rut: z.string().trim().min(8).max(12),
  name: z.string().trim().min(1).max(200),
  tradeName: z.string().trim().max(200).optional().nullable(),
  address: z.string().trim().max(300).optional().nullable(),
  commune: z.string().trim().max(100).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().trim().max(20).optional().nullable(),
  contactName: z.string().trim().max(200).optional().nullable(),
  paymentTermDays: z.number().int().min(0).max(365).optional(),
  accountPayableId: z.string().uuid().optional().nullable(),
  accountExpenseId: z.string().uuid().optional().nullable(),
});

export const updateSupplierSchema = createSupplierSchema.partial().omit({ rut: true });

// ── DTE Issuance ──

const dteLineSchema = z.object({
  itemCode: z.string().trim().max(50).optional().nullable(),
  itemName: z.string().trim().min(1).max(200),
  description: z.string().trim().max(500).optional().nullable(),
  quantity: z.number().positive(),
  unit: z.string().trim().max(20).optional().nullable(),
  unitPrice: z.number().min(0),
  discountPct: z.number().min(0).max(100).optional(),
  isExempt: z.boolean().optional(),
  accountId: z.string().uuid().optional().nullable(),
  costCenterId: z.string().uuid().optional().nullable(),
});

export const issueDteSchema = z.object({
  dteType: z.number().int().refine((v) => [33, 34, 39, 52, 56, 61].includes(v), {
    message: "Tipo de DTE invalido",
  }),
  receiverRut: z.string().trim().min(8).max(12),
  receiverName: z.string().trim().min(1).max(200),
  receiverEmail: z.string().email().optional().nullable(),
  lines: z.array(dteLineSchema).min(1, "Debe incluir al menos una linea"),
  currency: z.enum(["CLP", "USD", "UF"]).optional(),
  notes: z.string().trim().max(1000).optional().nullable(),
  accountId: z.string().optional().nullable(),
  autoSendEmail: z.boolean().optional(),
});

export const dteCreditNoteSchema = z.object({
  referenceDteId: z.string().uuid(),
  reason: z.string().trim().min(1).max(500),
  referenceType: z.number().int().min(1).max(3).optional(),
  lines: z.array(dteLineSchema).min(1).optional(),
});

// ── Query params helpers ──

export const dateRangeQuerySchema = z.object({
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.string().optional(),
  sourceType: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const supplierQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const ledgerQuerySchema = z.object({
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
