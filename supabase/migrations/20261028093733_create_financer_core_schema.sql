/*
# Create Financer Management Core Schema

## Purpose
Database backend for a moneylender / financer management SaaS. Each "financer"
(lending business) has their own data isolated by financer_id. Users belong to a
financer and can only see/modify their own financer's data. An admin role can see
all financers.

## New Tables
1. financers — lending business entity (tenant)
2. profiles — app users linked to auth.users + financer
3. people — borrowers/contacts
4. accounts — cash/bank/card accounts
5. contracts — lending contracts (5 types, details in jsonb)
6. schedule_entries — due entries per contract
7. payments — collection records
8. adjustments — manual credit/debit
9. transactions — account-level money movements
10. notes — notes on people or contracts
11. audit_logs — audit trail

## Security
- RLS on every table.
- Tenant isolation via get_user_financer_id() SECURITY DEFINER helper.
- 4 policies per CRUD verb per table, scoped TO authenticated.
- financer_id columns DEFAULT get_user_financer_id().
- profiles/financers: own-row access + admin sees all.
- Grants: CRUD to authenticated; SELECT to service_role.
*/

-- ============================================================
-- 1. financers (created first, no dependency on helper)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.financers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  owner_name text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE',
  subscription_status text NOT NULL DEFAULT 'TRIAL',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_activity timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  financer_id uuid REFERENCES public.financers(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'financer',
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login timestamptz
);

-- ============================================================
-- Helper function: get current user's financer_id
-- (defined after profiles exists)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_financer_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT financer_id FROM public.profiles WHERE id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_financer_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_financer_id() TO authenticated;

-- ============================================================
-- 3. people
-- ============================================================
CREATE TABLE IF NOT EXISTS public.people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  financer_id uuid NOT NULL DEFAULT public.get_user_financer_id() REFERENCES public.financers(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  address text,
  notes text,
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  financer_id uuid NOT NULL DEFAULT public.get_user_financer_id() REFERENCES public.financers(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  balance numeric NOT NULL DEFAULT 0,
  credit_limit numeric,
  used numeric,
  due_date date,
  bank_name text,
  account_number text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. contracts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  financer_id uuid NOT NULL DEFAULT public.get_user_financer_id() REFERENCES public.financers(id) ON DELETE CASCADE,
  person_id uuid REFERENCES public.people(id) ON DELETE SET NULL,
  person_name text NOT NULL,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE',
  actual_amount_given numeric NOT NULL DEFAULT 0,
  total_expected_recovery numeric NOT NULL DEFAULT 0,
  total_collected numeric NOT NULL DEFAULT 0,
  outstanding numeric NOT NULL DEFAULT 0,
  overdue numeric NOT NULL DEFAULT 0,
  next_due_date date,
  next_due_amount numeric NOT NULL DEFAULT 0,
  start_date date NOT NULL,
  end_date date,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. schedule_entries
-- ============================================================
CREATE TABLE IF NOT EXISTS public.schedule_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  financer_id uuid NOT NULL DEFAULT public.get_user_financer_id() REFERENCES public.financers(id) ON DELETE CASCADE,
  due_date date NOT NULL,
  amount numeric NOT NULL,
  collected numeric NOT NULL DEFAULT 0,
  remaining numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. payments
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  financer_id uuid NOT NULL DEFAULT public.get_user_financer_id() REFERENCES public.financers(id) ON DELETE CASCADE,
  person_name text NOT NULL,
  schedule_entry_id uuid REFERENCES public.schedule_entries(id) ON DELETE SET NULL,
  date date NOT NULL,
  amount numeric NOT NULL,
  method text NOT NULL,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  account_name text,
  reference text,
  notes text,
  collected_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. adjustments
-- ============================================================
CREATE TABLE IF NOT EXISTS public.adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  financer_id uuid NOT NULL DEFAULT public.get_user_financer_id() REFERENCES public.financers(id) ON DELETE CASCADE,
  date date NOT NULL,
  amount numeric NOT NULL,
  reason text NOT NULL,
  type text NOT NULL,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  financer_id uuid NOT NULL DEFAULT public.get_user_financer_id() REFERENCES public.financers(id) ON DELETE CASCADE,
  date date NOT NULL,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  account_name text NOT NULL,
  direction text NOT NULL,
  type text NOT NULL,
  amount numeric NOT NULL,
  description text NOT NULL,
  contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  person_id uuid REFERENCES public.people(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 10. notes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  financer_id uuid NOT NULL DEFAULT public.get_user_financer_id() REFERENCES public.financers(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  content text NOT NULL,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 11. audit_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  financer_id uuid REFERENCES public.financers(id) ON DELETE CASCADE,
  action text NOT NULL,
  performed_by text NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  details text,
  severity text NOT NULL DEFAULT 'INFO'
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_people_financer ON public.people(financer_id);
CREATE INDEX IF NOT EXISTS idx_accounts_financer ON public.accounts(financer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_financer ON public.contracts(financer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_person ON public.contracts(person_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_schedule_contract ON public.schedule_entries(contract_id);
CREATE INDEX IF NOT EXISTS idx_schedule_financer ON public.schedule_entries(financer_id);
CREATE INDEX IF NOT EXISTS idx_schedule_due_date ON public.schedule_entries(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_contract ON public.payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_financer ON public.payments(financer_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(date);
CREATE INDEX IF NOT EXISTS idx_adjustments_contract ON public.adjustments(contract_id);
CREATE INDEX IF NOT EXISTS idx_adjustments_financer ON public.adjustments(financer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_financer ON public.transactions(financer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_notes_entity ON public.notes(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notes_financer ON public.notes(financer_id);
CREATE INDEX IF NOT EXISTS idx_audit_financer ON public.audit_logs(financer_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON public.audit_logs(timestamp);

-- ============================================================
-- RLS + POLICIES + GRANTS
-- ============================================================

-- financers
ALTER TABLE public.financers ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE ON public.financers TO authenticated;
GRANT SELECT ON public.financers TO service_role;

DROP POLICY IF EXISTS "select_own_financer" ON public.financers;
CREATE POLICY "select_own_financer"
ON public.financers FOR SELECT TO authenticated
USING (id = public.get_user_financer_id()
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "update_own_financer" ON public.financers;
CREATE POLICY "update_own_financer"
ON public.financers FOR UPDATE TO authenticated
USING (id = public.get_user_financer_id())
WITH CHECK (id = public.get_user_financer_id());

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE, INSERT ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO service_role;

DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile"
ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
CREATE POLICY "insert_own_profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- people
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.people TO authenticated;
GRANT SELECT ON public.people TO service_role;

DROP POLICY IF EXISTS "select_own_people" ON public.people;
CREATE POLICY "select_own_people" ON public.people FOR SELECT TO authenticated
USING (financer_id = public.get_user_financer_id());
DROP POLICY IF EXISTS "insert_own_people" ON public.people;
CREATE POLICY "insert_own_people" ON public.people FOR INSERT TO authenticated
WITH CHECK (financer_id = public.get_user_financer_id());
DROP POLICY IF EXISTS "update_own_people" ON public.people;
CREATE POLICY "update_own_people" ON public.people FOR UPDATE TO authenticated
USING (financer_id = public.get_user_financer_id())
WITH CHECK (financer_id = public.get_user_financer_id());
DROP POLICY IF EXISTS "delete_own_people" ON public.people;
CREATE POLICY "delete_own_people" ON public.people FOR DELETE TO authenticated
USING (financer_id = public.get_user_financer_id());

-- accounts
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT SELECT ON public.accounts TO service_role;

DROP POLICY IF EXISTS "select_own_accounts" ON public.accounts;
CREATE POLICY "select_own_accounts" ON public.accounts FOR SELECT TO authenticated
USING (financer_id = public.get_user_financer_id());
DROP POLICY IF EXISTS "insert_own_accounts" ON public.accounts;
CREATE POLICY "insert_own_accounts" ON public.accounts FOR INSERT TO authenticated
WITH CHECK (financer_id = public.get_user_financer_id());
DROP POLICY IF EXISTS "update_own_accounts" ON public.accounts;
CREATE POLICY "update_own_accounts" ON public.accounts FOR UPDATE TO authenticated
USING (financer_id = public.get_user_financer_id())
WITH CHECK (financer_id = public.get_user_financer_id());
DROP POLICY IF EXISTS "delete_own_accounts" ON public.accounts;
CREATE POLICY "delete_own_accounts" ON public.accounts FOR DELETE TO authenticated
USING (financer_id = public.get_user_financer_id());

-- contracts
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contracts TO authenticated;
GRANT SELECT ON public.contracts TO service_role;

DROP POLICY IF EXISTS "select_own_contracts" ON public.contracts;
CREATE POLICY "select_own_contracts" ON public.contracts FOR SELECT TO authenticated
USING (financer_id = public.get_user_financer_id());
DROP POLICY IF EXISTS "insert_own_contracts" ON public.contracts;
CREATE POLICY "insert_own_contracts" ON public.contracts FOR INSERT TO authenticated
WITH CHECK (financer_id = public.get_user_financer_id());
DROP POLICY IF EXISTS "update_own_contracts" ON public.contracts;
CREATE POLICY "update_own_contracts" ON public.contracts FOR UPDATE TO authenticated
USING (financer_id = public.get_user_financer_id())
WITH CHECK (financer_id = public.get_user_financer_id());
DROP POLICY IF EXISTS "delete_own_contracts" ON public.contracts;
CREATE POLICY "delete_own_contracts" ON public.contracts FOR DELETE TO authenticated
USING (financer_id = public.get_user_financer_id());

-- schedule_entries
ALTER TABLE public.schedule_entries ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schedule_entries TO authenticated;
GRANT SELECT ON public.schedule_entries TO service_role;

DROP POLICY IF EXISTS "select_own_schedule" ON public.schedule_entries;
CREATE POLICY "select_own_schedule" ON public.schedule_entries FOR SELECT TO authenticated
USING (financer_id = public.get_user_financer_id());
DROP POLICY IF EXISTS "insert_own_schedule" ON public.schedule_entries;
CREATE POLICY "insert_own_schedule" ON public.schedule_entries FOR INSERT TO authenticated
WITH CHECK (financer_id = public.get_user_financer_id());
DROP POLICY IF EXISTS "update_own_schedule" ON public.schedule_entries;
CREATE POLICY "update_own_schedule" ON public.schedule_entries FOR UPDATE TO authenticated
USING (financer_id = public.get_user_financer_id())
WITH CHECK (financer_id = public.get_user_financer_id());
DROP POLICY IF EXISTS "delete_own_schedule" ON public.schedule_entries;
CREATE POLICY "delete_own_schedule" ON public.schedule_entries FOR DELETE TO authenticated
USING (financer_id = public.get_user_financer_id());

-- payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT SELECT ON public.payments TO service_role;

DROP POLICY IF EXISTS "select_own_payments" ON public.payments;
CREATE POLICY "select_own_payments" ON public.payments FOR SELECT TO authenticated
USING (financer_id = public.get_user_financer_id());
DROP POLICY IF EXISTS "insert_own_payments" ON public.payments;
CREATE POLICY "insert_own_payments" ON public.payments FOR INSERT TO authenticated
WITH CHECK (financer_id = public.get_user_financer_id());
DROP POLICY IF EXISTS "update_own_payments" ON public.payments;
CREATE POLICY "update_own_payments" ON public.payments FOR UPDATE TO authenticated
USING (financer_id = public.get_user_financer_id())
WITH CHECK (financer_id = public.get_user_financer_id());
DROP POLICY IF EXISTS "delete_own_payments" ON public.payments;
CREATE POLICY "delete_own_payments" ON public.payments FOR DELETE TO authenticated
USING (financer_id = public.get_user_financer_id());

-- adjustments
ALTER TABLE public.adjustments ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.adjustments TO authenticated;
GRANT SELECT ON public.adjustments TO service_role;

DROP POLICY IF EXISTS "select_own_adjustments" ON public.adjustments;
CREATE POLICY "select_own_adjustments" ON public.adjustments FOR SELECT TO authenticated
USING (financer_id = public.get_user_financer_id());
DROP POLICY IF EXISTS "insert_own_adjustments" ON public.adjustments;
CREATE POLICY "insert_own_adjustments" ON public.adjustments FOR INSERT TO authenticated
WITH CHECK (financer_id = public.get_user_financer_id());
DROP POLICY IF EXISTS "update_own_adjustments" ON public.adjustments;
CREATE POLICY "update_own_adjustments" ON public.adjustments FOR UPDATE TO authenticated
USING (financer_id = public.get_user_financer_id())
WITH CHECK (financer_id = public.get_user_financer_id());
DROP POLICY IF EXISTS "delete_own_adjustments" ON public.adjustments;
CREATE POLICY "delete_own_adjustments" ON public.adjustments FOR DELETE TO authenticated
USING (financer_id = public.get_user_financer_id());

-- transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT SELECT ON public.transactions TO service_role;

DROP POLICY IF EXISTS "select_own_transactions" ON public.transactions;
CREATE POLICY "select_own_transactions" ON public.transactions FOR SELECT TO authenticated
USING (financer_id = public.get_user_financer_id());
DROP POLICY IF EXISTS "insert_own_transactions" ON public.transactions;
CREATE POLICY "insert_own_transactions" ON public.transactions FOR INSERT TO authenticated
WITH CHECK (financer_id = public.get_user_financer_id());
DROP POLICY IF EXISTS "update_own_transactions" ON public.transactions;
CREATE POLICY "update_own_transactions" ON public.transactions FOR UPDATE TO authenticated
USING (financer_id = public.get_user_financer_id())
WITH CHECK (financer_id = public.get_user_financer_id());
DROP POLICY IF EXISTS "delete_own_transactions" ON public.transactions;
CREATE POLICY "delete_own_transactions" ON public.transactions FOR DELETE TO authenticated
USING (financer_id = public.get_user_financer_id());

-- notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT SELECT ON public.notes TO service_role;

DROP POLICY IF EXISTS "select_own_notes" ON public.notes;
CREATE POLICY "select_own_notes" ON public.notes FOR SELECT TO authenticated
USING (financer_id = public.get_user_financer_id());
DROP POLICY IF EXISTS "insert_own_notes" ON public.notes;
CREATE POLICY "insert_own_notes" ON public.notes FOR INSERT TO authenticated
WITH CHECK (financer_id = public.get_user_financer_id());
DROP POLICY IF EXISTS "update_own_notes" ON public.notes;
CREATE POLICY "update_own_notes" ON public.notes FOR UPDATE TO authenticated
USING (financer_id = public.get_user_financer_id())
WITH CHECK (financer_id = public.get_user_financer_id());
DROP POLICY IF EXISTS "delete_own_notes" ON public.notes;
CREATE POLICY "delete_own_notes" ON public.notes FOR DELETE TO authenticated
USING (financer_id = public.get_user_financer_id());

-- audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT SELECT ON public.audit_logs TO service_role;

DROP POLICY IF EXISTS "select_own_audit_logs" ON public.audit_logs;
CREATE POLICY "select_own_audit_logs" ON public.audit_logs FOR SELECT TO authenticated
USING (financer_id = public.get_user_financer_id()
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "insert_own_audit_logs" ON public.audit_logs;
CREATE POLICY "insert_own_audit_logs" ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (financer_id = public.get_user_financer_id());
