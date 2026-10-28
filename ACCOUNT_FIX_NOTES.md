# FinancerOS account creation fix

## Scope
- Added `createAccount` to the API interface and Supabase implementation.
- Added matching mock implementation so TypeScript's shared API interface remains valid.
- No Due page, payment/collection logic, or database migrations were changed.
- Account types remain CASH, BANK, CARD, OTHER.

## Important
The account insert relies on the existing database default `financer_id = public.get_user_financer_id()` in the supplied core schema. No schema change is included.

## Verification
- `npm run typecheck`: passed.
- `npm run build`: could not be completed in the supplied environment because the uploaded `node_modules` lacked the optional Rollup Linux binary. Run `npm install` (or `npm ci`) in your environment, then `npm run build`.
- Not tested against your live Supabase project.
