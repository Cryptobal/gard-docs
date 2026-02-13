-- Add missing columns to installations
ALTER TABLE "crm"."installations"
  ADD COLUMN IF NOT EXISTS "notes" TEXT,
  ADD COLUMN IF NOT EXISTS "marcacion_code" TEXT;

-- Unique constraint for marcacion_code
CREATE UNIQUE INDEX IF NOT EXISTS "installations_marcacion_code_key"
  ON "crm"."installations"("marcacion_code");
