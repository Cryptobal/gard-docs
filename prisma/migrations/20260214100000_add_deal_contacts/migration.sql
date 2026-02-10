-- Add deal_contacts table for many-to-many deal-contact relationships

CREATE TABLE IF NOT EXISTS crm.deal_contacts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   TEXT NOT NULL,
  deal_id     UUID NOT NULL REFERENCES crm.deals(id) ON DELETE CASCADE,
  contact_id  UUID NOT NULL REFERENCES crm.contacts(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'participant',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_crm_deal_contact
  ON crm.deal_contacts (deal_id, contact_id);

CREATE INDEX IF NOT EXISTS idx_crm_deal_contacts_deal
  ON crm.deal_contacts (deal_id);

CREATE INDEX IF NOT EXISTS idx_crm_deal_contacts_contact
  ON crm.deal_contacts (contact_id);

-- Backfill: create deal_contacts from existing primaryContactId
INSERT INTO crm.deal_contacts (tenant_id, deal_id, contact_id, role)
SELECT d.tenant_id, d.id, d.primary_contact_id, 'primary'
FROM crm.deals d
WHERE d.primary_contact_id IS NOT NULL
ON CONFLICT DO NOTHING;
