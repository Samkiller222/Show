# Supabase backend (project "Dog Show")

- Tables: `breeds`, `shows`, `dogs`, `entries`, `live_results`, `team_members`; view `entries_view`.
- Only emails in `team_members` can read or change anything (row level security through `private.is_team()`).
- Functions called by the site: `save_entry`, `import_entries`, `sync_state`.
- Edge function `extract` (this folder) reads uploaded catalogues with Claude Sonnet 5.5. It needs the secret `ANTHROPIC_API_KEY`.

To add a team member: create their user in Authentication > Users, then add their email (lower case) to the `team_members` table.
