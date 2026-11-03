# MNCF Show Desk

Website: https://samkiller222.github.io/Show/

A small show-management system for MNCF dog shows. The database is the Supabase project "Dog Show" (see `supabase/README.md`). Team members sign in once per phone; only emails on the team list can see or change anything. Results are shared live between phones.

The Google Sheet and `apps-script.gs` were the first database and are no longer used by the site.

## Pages
Every page has a burger menu (shows search, Breeds and groups, the awards view setting, older pages, sign out). An open show has bottom tabs: Entries, Awards, Results.
- `index.html`: all shows with search, status filters and "+ New show".
- `register.html?show=…` (Entries tab): add, edit, mark absent or remove entries. Dogs are remembered by name and breed. Ring numbers and classes are set by hand.
- `awards.html?show=…` (Awards tab): the awards checklist built from the show's entries, including group rounds and Best in Show finals. Each phone chooses "One round at a time" (Previous / Next) or "Full list" in the menu. Results are shared live between phones.
- `awards.html?show=…&view=results` (Results tab): totals, Best of Breed certificates, copy and Excel export.
- `breeds.html`: breeds and their groups, set by hand.
- `import.html` (not linked; kept for later): read a catalogue with Claude.
- `nov-2026.html` and the pages it links: the first version used at the November 2026 show.

## The old Google Sheet (no longer used)
Tabs: Start here, Shows, Dogs, Entries, Results, Breeds, Settings. Grey columns fill in by themselves. After changing `apps-script.gs`, paste it into the Apps Script project, run `setupSheet` once, and deploy a new version of the existing web app deployment so the URL stays the same.
