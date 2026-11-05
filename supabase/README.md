# Supabase backend (project "Dog Show")

- Tables: `breeds`, `shows`, `dogs`, `entries`, `live_results`, `team_members`; view `entries_view`.
- Only emails in `team_members` can read anything (row level security through `private.is_team()`). What they can change depends on `team_members.role`: admin, organiser, steward (awards only) or viewer. See `migrations/20261103_team_roles.sql`.
- Functions called by the site: `save_entry`, `import_entries`, `sync_state`.
- Edge function `extract` (this folder) reads uploaded catalogues with Claude Sonnet 5.5. It needs the secret `ANTHROPIC_API_KEY`.

To add a team member: create their user in Authentication > Users, then give them a role on the site's Users and roles page (admins only).

## Entry fee payments (Revolut)

The edge function `payments` creates Revolut checkouts and marks entries paid. To switch it on:

1. Apply `migrations/20261105_payments.sql` in the SQL editor.
2. Deploy the function with JWT verification **off** (Revolut's webhook has no Supabase login; the function checks the caller's team role itself): `supabase functions deploy payments --no-verify-jwt`.
3. In Edge Functions > Secrets add `REVOLUT_SECRET_KEY` (Merchant API secret key) and `REVOLUT_MODE` (`sandbox` while testing with a key from sandbox-business.revolut.com, `live` with the Production key from Revolut Business > Merchant > Merchant API).
4. Register the webhook once per mode so payments are ticked off even if the payer closes the page:
   `curl -X POST https://sandbox-merchant.revolut.com/api/webhooks -H "Authorization: Bearer $REVOLUT_SECRET_KEY" -H "Revolut-Api-Version: 2024-09-01" -H "Content-Type: application/json" -d '{"url":"https://cyikakfookjygycziqfg.supabase.co/functions/v1/payments","events":["ORDER_COMPLETED","ORDER_AUTHORISED","ORDER_CANCELLED","ORDER_FAILED"]}'`
   (use `https://merchant.revolut.com` for live).
