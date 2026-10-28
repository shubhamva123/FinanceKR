-- FinancerOS: atomically record a collection and its account movement.
-- Apply after the core schema, record_payment RPC, and transaction balance trigger migrations.

CREATE OR REPLACE FUNCTION public.record_payment_and_update_account(
  p_contract_id uuid,
  p_schedule_entry_id uuid,
  p_date date,
  p_amount numeric,
  p_method text,
  p_account_id uuid,
  p_reference text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_financer_id uuid;
  v_person_id uuid;
  v_person_name text;
  v_account_name text;
  v_payment_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_account_id IS NULL THEN
    RAISE EXCEPTION 'Select the account that received this payment';
  END IF;

  IF p_schedule_entry_id IS NULL THEN
    RAISE EXCEPTION 'A due entry is required for a collection';
  END IF;

  v_financer_id := public.get_user_financer_id();
  IF v_financer_id IS NULL THEN
    RAISE EXCEPTION 'No financer profile is associated with this user';
  END IF;

  -- Validate that the contract and account belong to this financer.
  SELECT c.person_id, c.person_name
    INTO v_person_id, v_person_name
  FROM public.contracts AS c
  WHERE c.id = p_contract_id
    AND c.financer_id = v_financer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found or access denied';
  END IF;

  SELECT a.name
    INTO v_account_name
  FROM public.accounts AS a
  WHERE a.id = p_account_id
    AND a.financer_id = v_financer_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found or access denied';
  END IF;

  -- Existing RPC validates the amount, inserts the payment, updates the
  -- selected schedule entry, and recalculates contract totals. Any later
  -- failure in this function rolls the entire database transaction back.
  v_payment_id := public.record_payment(
    p_contract_id,
    p_schedule_entry_id,
    p_date,
    p_amount,
    p_method,
    p_account_id,
    p_reference,
    p_notes
  );

  -- The existing transactions trigger updates the selected account balance
  -- for DONE transactions. Insert exactly one matching money-in movement.
  INSERT INTO public.transactions (
    financer_id,
    date,
    account_id,
    account_name,
    direction,
    type,
    amount,
    description,
    contract_id,
    person_id,
    status,
    original_due_date
  )
  VALUES (
    v_financer_id,
    p_date,
    p_account_id,
    v_account_name,
    'IN',
    'COLLECTION',
    p_amount,
    'Collection received from ' || COALESCE(v_person_name, 'customer'),
    p_contract_id,
    v_person_id,
    'DONE',
    p_date
  );

  RETURN v_payment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_payment_and_update_account(
  uuid, uuid, date, numeric, text, uuid, text, text
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.record_payment_and_update_account(
  uuid, uuid, date, numeric, text, uuid, text, text
) TO authenticated;
