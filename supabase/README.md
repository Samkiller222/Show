# Supabase backend (project "Dog Show")

- Tables: `breeds`, `shows`, `dogs`, `entries`, `live_results`, `team_members`; view `entries_view`.
- Only emails in `team_members` can read anything (row level security through `private.is_team()`). What they can change depends on `team_members.role`: admin, organiser, steward (awards only), viewer or handler (only their own dogs, linked by `dogs.handler_emails`). See `migrations/20261103_team_roles.sql` and `migrations/20261103_handler_role.sql`.
- Functions called by the site: `save_entry`, `import_entries`, `sync_state`.
- Edge function `extract` (this folder) reads uploaded catalogues with Claude Sonnet 5.5. It needs the secret `ANTHROPIC_API_KEY`.

To add a team member: create their user in Authentication > Users, then give them a role on the site's Users and roles page (admins only).
