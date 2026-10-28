# Financer Management SaaS — Project Handover

## What This App Is

A moneylender / financer management tool that tracks every rupee — who owes you, how much,
when it's due, what you've collected, and what your cash position will look like on any future
date. Built as a multi-tenant SaaS: each lending business ("financer") signs up, gets their own
isolated data, and can only see their own records.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS 3 |
| Routing | React Router 7 |
| Icons | Lucide React |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Database access | Supabase JS client (direct, no custom server) |

---

## Architecture Overview

```
src/
├── api/ApiService.ts          # Interface defining all 30+ API methods
├── lib/supabase.ts            # Supabase client singleton
├── services/
│   ├── index.ts               # Exports active ApiService implementation
│   ├── auth.ts                # Exports active AuthService
│   ├── SupabaseApiService.ts  # Real implementation — maps all API methods to Supabase queries
│   ├── SupabaseAuthService.ts # Real auth — signUp, login, logout, session restore
│   └── MockApiService.ts      # Old mock (kept for reference, not wired)
├── contexts/
│   ├── AuthContext.tsx        # React context for auth state + onAuthStateChange
│   └── ToastContext.tsx       # Toast notifications
├── types/index.ts             # All domain types (Contract union, Person, Account, etc.)
├── pages/                     # All page components
├── components/
│   ├── common/                # StatCard, Modal, Badge, LoadingSpinner, etc.
│   └── layout/                # Header, Sidebar, ProtectedRoute
└── utils/format.ts            # Indian currency + date formatters
```

### Data flow

```
UI components
    → useAuth() / api (imported from @/services)
    → SupabaseApiService / SupabaseAuthService
    → @supabase/supabase-js client
    → Supabase Postgres (RLS-protected)
```

The `ApiService` interface is the single abstraction layer. The UI never knows whether it's
talking to Supabase, a mock, or a future REST backend — it just calls `api.getPeople()`,
`api.createLDD()`, etc.

---

## Database Schema (11 tables)

All tables are in the `public` schema. Migrations are applied to Supabase and also saved in
`supabase/migrations/`.

### Tables

1. **financers** — The lending business (tenant). One row per customer business.
   - `id`, `business_name`, `owner_name`, `status`, `subscription_status`, `created_at`, `last_activity`

2. **profiles** — App users, linked to `auth.users` and to a financer.
   - `id` (FK → auth.users), `financer_id` (FK → financers), `name`, `email`, `role`, `status`, `last_login`

3. **people** — Borrowers / contacts.
   - `id`, `financer_id`, `name`, `phone`, `address`, `notes`, `status`, `created_at`

4. **accounts** — Cash, bank, credit card accounts.
   - `id`, `financer_id`, `name`, `type` (CASH/BANK/CARD/OTHER), `balance`, `credit_limit`, `used`, `due_date`, `bank_name`, `account_number`

5. **contracts** — Lending contracts (5 types, all stored in one table).
   - `id`, `financer_id`, `person_id`, `person_name`, `type`, `status`, `actual_amount_given`, `total_expected_recovery`, `total_collected`, `outstanding`, `overdue`, `next_due_date`, `next_due_amount`, `start_date`, `end_date`, `details` (jsonb), `created_at`
   - The `details` jsonb column stores type-specific fields (see below).

6. **schedule_entries** — Individual due entries per contract.
   - `id`, `contract_id`, `financer_id`, `due_date`, `amount`, `collected`, `remaining`, `status` (PAID/PARTIAL/PENDING/OVERDUE)

7. **payments** — Collection records.
   - `id`, `contract_id`, `financer_id`, `person_name`, `schedule_entry_id`, `date`, `amount`, `method`, `account_id`, `account_name`, `reference`, `notes`, `collected_by`

8. **adjustments** — Manual credit/debit on a contract.
   - `id`, `contract_id`, `financer_id`, `date`, `amount`, `reason`, `type` (CREDIT/DEBIT), `created_by`

9. **transactions** — Account-level money movements.
   - `id`, `financer_id`, `date`, `account_id`, `account_name`, `direction` (IN/OUT/TRANSFER), `type`, `amount`, `description`, `contract_id`, `person_id`

10. **notes** — Notes on people or contracts.
    - `id`, `financer_id`, `entity_type` (PERSON/CONTRACT), `entity_id`, `content`, `created_by`, `created_at`

11. **audit_logs** — Audit trail.
    - `id`, `financer_id`, `action`, `performed_by`, `timestamp`, `details`, `severity`

### Contract types and their `details` jsonb fields

| Type | Key fields in `details` |
|------|------------------------|
| LDD | `dailyCollection`, `days`, `upfrontDeduction`, `dateRule` |
| MONTHLY_MANUAL | `monthlyInterest`, `period`, `plannedMonthlyPayment`, `dateRule`, `firstDueDate` |
| MONTHLY_DIRECT | `monthlyInterest`, `numberOfMonths`, `interestCreditDate`, `finalPrincipalDate` |
| DIRECT2 | `totalAmountToReceive`, `dueDate`, `profit` |
| THIRD_PARTY | `thirdPartyType`, `recoveryMode`, `monthlyAmount`, `purpose` |

### RPC functions (applied to Supabase)

- `mark_schedule_payment(p_entry_id, p_amount)` — Increments collected, decrements remaining, sets status to PAID/PARTIAL on a schedule entry.
- `update_contract_totals(p_contract_id)` — Recalculates total_collected, outstanding, overdue, next_due_date, and status on a contract from its schedule entries and payments.
- `get_user_financer_id()` — Returns the current user's financer_id from their profile. Used by all RLS policies.

### Security (RLS)

- **Row Level Security enabled on every table.**
- **Tenant isolation via `financer_id`**: every financer-scoped table has 4 policies (SELECT/INSERT/UPDATE/DELETE), each checking `financer_id = get_user_financer_id()`.
- `financer_id` columns **default to `get_user_financer_id()`** so client inserts don't need to pass it.
- **profiles**: users can read/update their own row; admin role can read all profiles.
- **financers**: users can read their own financer; admin can read all.
- **audit_logs**: financer-scoped logs visible to that financer's users; all logs visible to admin.
- Grants: CRUD to `authenticated` on financer-scoped tables; SELECT to `service_role`.

---

## Authentication

- Uses **Supabase Auth** (email/password only — no magic links or social providers).
- Sign-up flow: `supabase.auth.signUp()` → creates auth user → inserts financer row → inserts profile row.
- `AuthContext` uses `onAuthStateChange` with the mandatory async wrapper pattern (avoids deadlock).
- Login page has a toggle between "Sign In" and "Create Account".
- Email confirmation is OFF (per Supabase project settings).
- Protected routes check `session` via `ProtectedRoute` component; admin routes check `role === 'admin'`.

---

## Contract Types — How They Work

### LDD (Daily Lending)
Give money, collect a fixed amount daily for N days. Profit = totalRecovery - actualAmountGiven
(deducted upfront). Schedule auto-skips Sundays in AUTO mode.

### Monthly Manual
Give money, collect a fixed monthly payment for N months. Interest is entered manually; the
monthly payment is whatever the financer plans to collect.

### Monthly Direct
Give money, collect monthly interest for N months, then get principal back on a final date.
Interest date and principal date are set separately.

### Direct 2
Simple one-shot loan. Give money, get full amount back on a single due date. Profit = receive - given.

### Third Party
Tracks non-standard money: loans given (recoverable), loans taken (payable), EMIs you're paying,
or family/personal money. Recovery mode can be None, One Time, Monthly, EMI, or Manual.

---

## Key Features

1. **Dashboard** — Cash position (hand + bank + credit cards), total outstanding, today's dues, overdue, active people/contracts.
2. **Date Planner** — Select any future date, see projected cash position including expected in/out, shortfall warning, and a chronological timeline of all scheduled events.
3. **Due Management** — Today/upcoming/overdue dues with payment recording. Payments update schedule entries via RPC and recalculate contract totals.
4. **People** — Borrower directory with active/closed contracts, recent payments, notes.
5. **New Entry** — Create LDD, Monthly (Manual/Direct/Direct2), or Third Party contracts. Schedule auto-generated.
6. **Ledger** — Full contract view: schedule, payment history, adjustments, notes.
7. **Monthly Reports** — Year/month selector with cash summary, money given/collected, expenses, daily collection chart.
8. **Admin** — Platform-wide dashboard (all financers, MRR, audit logs). Admin role only.

---

## What's Completed

- [x] Database schema — 11 tables + RLS policies (applied to Supabase)
- [x] RPC functions — `mark_schedule_payment`, `update_contract_totals` (applied to Supabase)
- [x] Supabase client singleton (`src/lib/supabase.ts`)
- [x] `SupabaseAuthService` — real login/signup/logout/session restore
- [x] `SupabaseApiService` — all 30+ ApiService methods mapped to Supabase queries
- [x] Services wired into app (replaced MockApiService)
- [x] Login page updated with sign-up toggle
- [x] `AuthContext` updated with `onAuthStateChange` + `signUp` method
- [x] Date Planner page — fully built with date selection, projections, timeline
- [x] TypeScript typecheck passes
- [x] Production build passes

---

## What's Pending / Known Gaps

### 1. Seed Data
The database is empty. No demo data has been inserted. To test the app end-to-end, you need to:
1. Sign up (creates a financer + profile).
2. Add accounts (cash, bank, credit card) — the Accounts page is currently a stub.
3. Add people.
4. Create contracts (LDD, Monthly, Third Party) — the new entry forms exist and work.
5. Record payments to test the schedule + contract totals flow.

### 2. Stub Pages (not yet built)
These pages exist as placeholder stubs (`PageStub` component) and need real implementations:
- **Accounts page** (`AccountsPage`) — list accounts, add account
- **Account Detail** (`AccountDetailPage`) — single account with transactions
- **Transactions page** (`TransactionsPage`) — full transaction log with filters
- **Monthly Reports** (`ReportsPage`) — the API method exists (`getMonthlyReport`) but the page is a stub
- **Settings** (`SettingsPage`)
- **Ledger entry** (`LedgerEntryPage`) — the API method exists (`getLedger`) but the page is a stub
- **Admin pages** (Dashboard, Financers, Users, Subscriptions, Audit) — API methods exist but pages are stubs

### 3. Missing Backend Logic
- **`createAddon`** and **`renewContract`** in `SupabaseApiService` are no-ops (return success without doing anything). Need real implementations.
- **`collectedToday`** in `getDashboard` always returns 0 — needs a query to sum today's payments.
- **`recentActivity`** in `getLedger` and `getPerson` returns empty array — needs audit log queries.
- **`projectedBalance`** in Date Planner timeline events always returns 0 — needs a running balance calculation.
- **`otherIncome`**, **`receivable`**, **`payable`** in `MonthlyReport` always return 0 — need queries.

### 4. Account Balance Updates
When a transaction or payment is created, the account's `balance` field is not automatically
updated. This needs either:
- A database trigger on `transactions` insert, or
- A client-side update to the account after each transaction/payment.

### 5. Admin Role Assignment
Currently, the `role` field in `profiles` defaults to `'financer'`. There's no UI or flow to
assign admin role. To test admin features, manually set `role = 'admin'` on a profile row via
SQL.

### 6. Old Mock Files
`MockApiService.ts` and `src/mock/data.ts` are still in the project but no longer wired in.
Safe to delete once the team confirms they're not needed for reference.

### 7. Supabase Config
The `supabase/config.toml` file may need a `[functions.*]` table entry if edge functions are
added later. No edge functions exist yet.

---

## Environment Variables

All Supabase env vars are pre-populated in `.env`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The service role key and database URL are available in the Supabase dashboard if needed for
edge functions or server-side scripts.

---

## Ideal Database Prompt (for recreating this schema)

If you want to recreate this database in a new Supabase project, use this prompt:

---

**Prompt:**

> Create a multi-tenant financer (moneylender) management SaaS database in Supabase with the
> following requirements:
>
> **Tenancy:** Each "financer" (lending business) is a tenant. Users belong to a financer via a
> `profiles` table linked to `auth.users`. All data is isolated by `financer_id` using RLS
> policies with a `get_user_financer_id()` SECURITY DEFINER helper.
>
> **Tables needed:**
> - `financers` — business name, owner name, status, subscription status
> - `profiles` — links to auth.users, has financer_id, name, email, role (financer/admin)
> - `people` — borrowers with name, phone, address, notes, status
> - `accounts` — cash/bank/card accounts with balance, credit_limit, used, due_date
> - `contracts` — 5 types (LDD, MONTHLY_MANUAL, MONTHLY_DIRECT, DIRECT2, THIRD_PARTY) in one
>   table with a `details` jsonb column for type-specific fields. Tracks actual_amount_given,
>   total_expected_recovery, total_collected, outstanding, overdue, next_due_date, status
> - `schedule_entries` — due entries per contract with due_date, amount, collected, remaining,
>   status (PAID/PARTIAL/PENDING/OVERDUE)
> - `payments` — collection records with method, account, reference, collected_by
> - `adjustments` — manual credit/debit on contracts
> - `transactions` — account-level money movements (IN/OUT/TRANSFER) with type classification
> - `notes` — attachable to people or contracts
> - `audit_logs` — action, performer, timestamp, severity
>
> **Security:**
> - RLS on every table
> - 4 policies per table (SELECT/INSERT/UPDATE/DELETE), scoped to authenticated users
> - financer_id defaults to get_user_financer_id() so client inserts omit it
> - Admin role can read all financers, profiles, and audit_logs
> - Grants: CRUD to authenticated on financer-scoped tables; SELECT to service_role
>
> **RPC functions:**
> - mark_schedule_payment(entry_id, amount) — updates collected/remaining/status on a schedule
>   entry when a payment is recorded
> - update_contract_totals(contract_id) — recalculates contract's total_collected, outstanding,
>   overdue, next_due_date, and status from schedule entries and payments
>
> **Indexes:** On financer_id, contract_id, person_id, due_date, date, status, and
> entity_type+entity_id across relevant tables.

---

## How to Run

```bash
npm install      # install dependencies
npm run dev      # start dev server (runs automatically in Bolt)
npm run build    # production build
npm run typecheck # TypeScript check
```

---

## Migration Files

Applied migrations are in `supabase/migrations/`:
1. `20261028093733_create_financer_core_schema.sql` — all 11 tables + RLS + indexes
2. `20261028094020_add_payment_rpc_functions.sql` — mark_schedule_payment + update_contract_totals

These are already applied to the live Supabase instance. Re-running them is safe (uses
`IF NOT EXISTS` and `DROP POLICY IF EXISTS` patterns).
