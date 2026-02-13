-- Add missing columns to turnos_extra
ALTER TABLE "ops"."turnos_extra"
  ADD COLUMN IF NOT EXISTS "tipo" TEXT NOT NULL DEFAULT 'turno_extra',
  ADD COLUMN IF NOT EXISTS "is_manual" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "horas_extra" DECIMAL(4,1);
