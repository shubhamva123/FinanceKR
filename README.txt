FinancerOS — Date-wise Transactions Patch

Included files are replacements/additions for the matching paths in your project.
Do NOT replace your .env file.

Before code changes:
1. Back up your current project.
2. Open Supabase Dashboard > SQL Editor.
3. Run the full SQL in:
   supabase/migrations/20261028120000_add_transaction_status_and_carry_forward.sql
4. Copy the included src folder into your project folder and replace matching files.
5. Run:
   npm run build
6. If build succeeds, run:
   npm run dev

Features:
- Date-wise transactions, including collections, expenses, income and transfers.
- Done/Pending status.
- Pending items carry forward into later selected-date lists while retaining their original date.
- Pending transactions do not change account balances until marked Done.
- Marking a pending transaction Done updates account balance; transfers are saved as paired ledger rows.

Important:
- The SQL migration adds status/original_due_date/transfer_group_id and balance-update triggers.
- Existing transaction rows default to DONE, but the migration does not retroactively replay them into account balances.
- Test with small amounts first, especially transfers and credit-card accounts.
- This patch has not been run against your live Supabase project. Verify the build and test behavior before using real financial records.
