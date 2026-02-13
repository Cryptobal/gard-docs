-- Add missing columns to marcaciones
ALTER TABLE "ops"."marcaciones"
  ADD COLUMN IF NOT EXISTS "foto_evidencia_url" TEXT,
  ADD COLUMN IF NOT EXISTS "atraso_minutos" INTEGER;
