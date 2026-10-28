# FinancerOS collection/accounting fix

## What changed
- `src/pages/DuePage.tsx`: passes the selected due row ID as `scheduleEntryId`.
- `src/services/SupabaseApiService.ts`: calls `record_payment_and_update_account` and surfaces RPC errors.
- `supabase/migrations/20261028130000_atomic_collection_account_update.sql`: adds one tenant-scoped RPC that calls the existing `record_payment` function and inserts the matching `IN`/`DONE` transaction in the same database transaction. The existing transaction trigger then updates the selected account balance.

## Apply in this order
1. Back up your current project and database.
2. In Supabase SQL Editor, run the contents of `supabase/migrations/20261028130000_atomic_collection_account_update.sql` once, after the earlier migrations have been applied.
3. Replace the matching `src` files with the ones in this archive.
4. Restart the Vite dev server and test using a test contract and a small amount.
5. Confirm that the selected due entry's remaining amount decreases and the selected account balance increases by exactly the same amount.

## Important
- This assumes the existing `public.record_payment(uuid, uuid, date, numeric, text, uuid, text, text)` RPC and `public.apply_transaction_balance_change` trigger from the supplied migrations are already installed.
- Do not run the new migration repeatedly unless needed; `CREATE OR REPLACE FUNCTION` is safe to reapply, but it should be treated as a migration.
- Previously recorded payments are not automatically reconciled. Do not resubmit them to “fix” old records, or you may double-count collections.
- This patch has not been tested against your live Supabase database. Validate on test data before using real collections.
