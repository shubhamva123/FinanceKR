-- Date-wise transactions: explicit status and original due date.
-- Pending rows remain a single row and are surfaced on later dates by the app.
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'DONE',
  ADD COLUMN IF NOT EXISTS original_due_date date,
  ADD COLUMN IF NOT EXISTS transfer_group_id uuid;

UPDATE public.transactions
SET original_due_date = date
WHERE original_due_date IS NULL;

ALTER TABLE public.transactions
  ALTER COLUMN original_due_date SET DEFAULT CURRENT_DATE,
  ALTER COLUMN original_due_date SET NOT NULL;

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_status_check;
ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_status_check CHECK (status IN ('DONE', 'PENDING'));

CREATE INDEX IF NOT EXISTS transactions_transfer_group_idx ON public.transactions (transfer_group_id) WHERE transfer_group_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS transactions_financer_date_status_idx
  ON public.transactions (financer_id, date DESC, status);

-- Keep current account balances in sync only for completed transactions.
-- Pending items do not move money until marked DONE. Transfers are stored as
-- a paired OUT/IN row in one INSERT statement, so both ledger rows are atomic.
CREATE OR REPLACE FUNCTION public.apply_transaction_balance_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'DONE' THEN
      PERFORM public.apply_transaction_balance_delta(NEW.account_id, NEW.direction, NEW.type, NEW.amount);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'DONE' THEN
      PERFORM public.apply_transaction_balance_delta(OLD.account_id, OLD.direction, OLD.type, -OLD.amount);
    END IF;
    RETURN OLD;
  ELSE
    IF OLD.status = 'DONE' THEN
      PERFORM public.apply_transaction_balance_delta(OLD.account_id, OLD.direction, OLD.type, -OLD.amount);
    END IF;
    IF NEW.status = 'DONE' THEN
      PERFORM public.apply_transaction_balance_delta(NEW.account_id, NEW.direction, NEW.type, NEW.amount);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_transaction_balance_delta(
  p_account_id uuid, p_direction text, p_type text, p_amount numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_type text;
BEGIN
  SELECT type INTO v_type FROM public.accounts WHERE id = p_account_id;
  IF NOT FOUND THEN RETURN; END IF;

  IF v_type = 'CARD' THEN
    UPDATE public.accounts
      SET used = GREATEST(0, COALESCE(used, 0) +
        CASE WHEN p_direction = 'OUT' THEN p_amount
             WHEN p_direction = 'IN' THEN -p_amount ELSE 0 END)
    WHERE id = p_account_id;
  ELSE
    UPDATE public.accounts
      SET balance = COALESCE(balance, 0) +
        CASE WHEN p_direction = 'IN' THEN p_amount
             WHEN p_direction = 'OUT' THEN -p_amount ELSE 0 END
    WHERE id = p_account_id;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS transactions_apply_balance_change ON public.transactions;
CREATE TRIGGER transactions_apply_balance_change
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.apply_transaction_balance_change();

REVOKE ALL ON FUNCTION public.apply_transaction_balance_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_transaction_balance_delta(uuid, text, text, numeric) FROM PUBLIC, anon, authenticated;
