-- Add missing columns to asistencia_diaria
ALTER TABLE "ops"."asistencia_diaria"
  ADD COLUMN IF NOT EXISTS "slot_number" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "locked_at" TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "locked_by" TEXT,
  ADD COLUMN IF NOT EXISTS "correction_reason" TEXT;

-- Update unique constraint to include slot_number (drop old, add new)
DROP INDEX IF EXISTS "ops"."uq_ops_asistencia_puesto_fecha";
CREATE UNIQUE INDEX IF NOT EXISTS "uq_ops_asistencia_puesto_slot_fecha"
  ON "ops"."asistencia_diaria"("puesto_id", "slot_number", "date");
