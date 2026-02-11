-- Enforce account/installation active consistency at DB level.

CREATE OR REPLACE FUNCTION "crm"."ensure_installation_account_active"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  account_active BOOLEAN;
BEGIN
  IF NEW.account_id IS NULL OR NEW.is_active IS DISTINCT FROM TRUE THEN
    RETURN NEW;
  END IF;

  SELECT a.is_active
  INTO account_active
  FROM "crm"."accounts" a
  WHERE a.id = NEW.account_id;

  IF COALESCE(account_active, FALSE) = FALSE THEN
    RAISE EXCEPTION 'Cannot set installation active for inactive account (%).', NEW.account_id
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "trg_installation_requires_active_account"
ON "crm"."installations";

CREATE TRIGGER "trg_installation_requires_active_account"
BEFORE INSERT OR UPDATE OF is_active, account_id
ON "crm"."installations"
FOR EACH ROW
EXECUTE FUNCTION "crm"."ensure_installation_account_active"();

CREATE OR REPLACE FUNCTION "crm"."deactivate_account_installations"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
    UPDATE "crm"."installations"
    SET is_active = FALSE
    WHERE account_id = NEW.id
      AND is_active = TRUE;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "trg_deactivate_installations_on_account_inactive"
ON "crm"."accounts";

CREATE TRIGGER "trg_deactivate_installations_on_account_inactive"
AFTER UPDATE OF is_active
ON "crm"."accounts"
FOR EACH ROW
EXECUTE FUNCTION "crm"."deactivate_account_installations"();
