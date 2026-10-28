
-- FinancerOS: Atomic, tenant-safe payment recording.
-- Apply only after the core schema and security migrations.

CREATE OR REPLACE FUNCTION public.record_payment(
  p_contract_id uuid,
  p_schedule_entry_id uuid,
  p_date date,
  p_amount numeric,
  p_method text,
  p_account_id uuid,
  p_reference text,
  p_notes text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_financer_id uuid;
  v_contract_financer_id uuid;
  v_person_name text;
  v_account_name text;
  v_collected_by text;
  v_payment_id uuid;
  v_schedule_financer_id uuid;
  v_schedule_contract_id uuid;
  v_schedule_remaining numeric;
  v_schedule_collected numeric;
  v_new_remaining numeric;
  v_total_collected numeric;
  v_outstanding numeric;
  v_overdue numeric;
  v_next_due_date date;
  v_next_due_amount numeric;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_financer_id := public.get_user_financer_id();

  IF v_financer_id IS NULL THEN
    RAISE EXCEPTION 'No financer profile is associated with this user';
  END IF;

  IF p_contract_id IS NULL THEN
    RAISE EXCEPTION 'Contract ID is required';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero';
  END IF;

  IF p_date IS NULL OR NULLIF(BTRIM(p_method), '') IS NULL THEN
    RAISE EXCEPTION 'Payment date and method are required';
  END IF;

  -- Lock and validate the contract.
  SELECT financer_id, person_name
  INTO v_contract_financer_id, v_person_name
  FROM public.contracts
  WHERE id = p_contract_id
  FOR UPDATE;

  IF NOT FOUND OR v_contract_financer_id <> v_financer_id THEN
    RAISE EXCEPTION 'Contract not found or access denied';
  END IF;

  -- Validate the optional account.
  IF p_account_id IS NOT NULL THEN
    SELECT name
    INTO v_account_name
    FROM public.accounts
    WHERE id = p_account_id
      AND financer_id = v_financer_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Account not found or access denied';
    END IF;
  END IF;

  -- Validate and lock the optional schedule entry.
  IF p_schedule_entry_id IS NOT NULL THEN
    SELECT financer_id, contract_id, remaining, collected
    INTO
      v_schedule_financer_id,
      v_schedule_contract_id,
      v_schedule_remaining,
      v_schedule_collected
    FROM public.schedule_entries
    WHERE id = p_schedule_entry_id
    FOR UPDATE;

    IF NOT FOUND
       OR v_schedule_financer_id <> v_financer_id
       OR v_schedule_contract_id <> p_contract_id THEN
      RAISE EXCEPTION 'Schedule entry not found or access denied';
    END IF;

    IF p_amount > v_schedule_remaining THEN
      RAISE EXCEPTION 'Payment exceeds remaining schedule balance';
    END IF;
  END IF;

  SELECT name
  INTO v_collected_by
  FROM public.profiles
  WHERE id = v_user_id;

  -- Record the payment.
  INSERT INTO public.payments (
    contract_id,
    financer_id,
    person_name,
    schedule_entry_id,
    date,
    amount,
    method,
    account_id,
    account_name,
    reference,
    notes,
    collected_by
  )
  VALUES (
    p_contract_id,
    v_financer_id,
    v_person_name,
    p_schedule_entry_id,
    p_date,
    p_amount,
    BTRIM(p_method),
    p_account_id,
    v_account_name,
    p_reference,
    p_notes,
    COALESCE(v_collected_by, 'User')
  )
  RETURNING id INTO v_payment_id;

  -- Update the linked schedule entry, if provided.
  IF p_schedule_entry_id IS NOT NULL THEN
    v_new_remaining := v_schedule_remaining - p_amount;

    UPDATE public.schedule_entries
    SET
      collected = v_schedule_collected + p_amount,
      remaining = v_new_remaining,
      status = CASE
        WHEN v_new_remaining <= 0 THEN 'PAID'
        WHEN due_date < CURRENT_DATE THEN 'OVERDUE'
        ELSE 'PARTIAL'
      END
    WHERE id = p_schedule_entry_id;
  END IF;

  -- Recalculate schedule statuses.
  UPDATE public.schedule_entries
  SET status = CASE
    WHEN remaining <= 0 THEN 'PAID'
    WHEN due_date < CURRENT_DATE THEN 'OVERDUE'
    WHEN collected > 0 THEN 'PARTIAL'
    ELSE 'PENDING'
  END
  WHERE contract_id = p_contract_id
    AND financer_id = v_financer_id;

  -- Calculate totals for this contract.
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_collected
  FROM public.payments
  WHERE contract_id = p_contract_id
    AND financer_id = v_financer_id;

  SELECT
    COALESCE(SUM(remaining), 0),
    COALESCE(SUM(remaining) FILTER (WHERE status = 'OVERDUE'), 0)
  INTO v_outstanding, v_overdue
  FROM public.schedule_entries
  WHERE contract_id = p_contract_id
    AND financer_id = v_financer_id;

  v_next_due_date := NULL;
  v_next_due_amount := 0;

  SELECT due_date, remaining
  INTO v_next_due_date, v_next_due_amount
  FROM public.schedule_entries
  WHERE contract_id = p_contract_id
    AND financer_id = v_financer_id
    AND remaining > 0
  ORDER BY due_date ASC
  LIMIT 1;

  UPDATE public.contracts
  SET
    total_collected = v_total_collected,
    outstanding = v_outstanding,
    overdue = v_overdue,
    next_due_date = v_next_due_date,
    next_due_amount = COALESCE(v_next_due_amount, 0),
    status = CASE
      WHEN v_outstanding <= 0
           AND EXISTS (
             SELECT 1
             FROM public.schedule_entries se
             WHERE se.contract_id = p_contract_id
               AND se.financer_id = v_financer_id
           )
        THEN 'CLOSED'
      WHEN v_overdue > 0 THEN 'OVERDUE'
      ELSE 'ACTIVE'
    END
  WHERE id = p_contract_id
    AND financer_id = v_financer_id;

  RETURN v_payment_id;
END;
$$;

-- Only authenticated users may call the payment RPC.
REVOKE ALL ON FUNCTION public.record_payment(
  uuid, uuid, date, numeric, text, uuid, text, text
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.record_payment(
  uuid, uuid, date, numeric, text, uuid, text, text
) TO authenticated;
