-- Add quote_id to Presentation for linking documents to CPQ quotes
ALTER TABLE "public"."Presentation" ADD COLUMN "quote_id" TEXT;

-- Index for finding presentations by quote
CREATE INDEX "idx_presentation_quote_id" ON "public"."Presentation" ("quote_id");
