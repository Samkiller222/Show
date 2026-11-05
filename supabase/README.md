# Supabase backend (project "Dog Show")

- Tables: `breeds`, `shows`, `dogs`, `entries`, `live_results`, `team_members`; view `entries_view`.
- Only emails in `team_members` can read anything (row level security through `private.is_team()`). What they can change depends on `team_members.role`: admin, organiser, steward (awards only), viewer, handler or owner (only their own dogs, linked by `dogs.handler_emails` / `dogs.owner_emails`). See `migrations/20261103_team_roles.sql` and `migrations/20261105_handler_owner_roles.sql`.
- Functions called by the site: `save_entry`, `import_entries`, `sync_state`.
- Edge function `extract` (this folder) reads uploaded catalogues with Claude Sonnet 5.5. It needs the secret `ANTHROPIC_API_KEY`.

To add a team member: create their user in Authentication > Users, then give them a role on the site's Users and roles page (admins only).

## Entry fee payments (Stripe, paid out to Revolut)

The edge function `payments` creates Stripe Checkout pages for entry fees and marks entries paid once Stripe confirms them. Stripe pays the money out to the club's Revolut account. To switch it on:

1. Sign up at stripe.com (an individual or sole trader account is fine). In Settings > Payouts, add the Revolut account's IBAN as the payout bank account.
2. Apply `migrations/20261105_payments.sql` in the SQL editor.
3. Deploy the function with JWT verification **off** (Stripe's webhook has no Supabase login; the function checks the caller's team role itself): `supabase functions deploy payments --no-verify-jwt`.
4. In Edge Functions > Secrets add `STRIPE_SECRET_KEY`: the test key (`sk_test_...`, from Stripe > Developers > API keys with "Test mode" on) while trying it out, then the live key (`sk_live_...`). Test or live is worked out from the key.
5. In Stripe > Developers > Webhooks, add an endpoint `https://cyikakfookjygycziqfg.supabase.co/functions/v1/payments` with the events `checkout.session.completed`, `checkout.session.async_payment_succeeded` and `checkout.session.expired` (once in test mode and once in live mode). Then payments are ticked off even if the payer closes the page before coming back.
6. Payers come back to `https://register.maltacaninefederation.com/payments.html?...` (Cloudflare drops `.html` and keeps the query). Set the optional `SITE_URL` secret only if the site moves again.
