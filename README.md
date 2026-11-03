# MNCF Show Desk

Website: https://samkiller222.github.io/Show/

A small show-management system for MNCF dog shows. The database is the Supabase project "Dog Show" (see `supabase/README.md`). Team members sign in once per phone; only emails on the team list can see or change anything. Results are shared live between phones.

The Google Sheet and `apps-script.gs` were the first database and are no longer used by the site.

## Pages
- `index.html`: all shows, and a form to add a new one.
- `register.html?show=…`: enter dogs into a show. Dogs are remembered by name and breed, so a dog registered once fills in its breed and owner at later shows. Ring numbers and classes are set by hand. Mark absent, edit or remove entries.
- `import.html?show=…` (not linked from the menus; kept for later): upload an Excel/CSV file, the catalogue PDF or photos; Claude (Sonnet 5.5, through the Apps Script so the API key stays private) reads them, you check the list, and the entries are saved. Needs the script property `ANTHROPIC_API_KEY`.
- `awards.html?show=…`: the awards checklist, built from the show's entries: class placings, breed awards, group awards with runner-up, Best Veteran per group, AV Locally Bred (1st only), and Best in Show finals whose competitors are the group winners. Results save on the phone, go to the Results tab, and export to Excel.
- `nov-2026.html` and the pages it links: the first version used at the November 2026 show.

## The old Google Sheet (no longer used)
Tabs: Start here, Shows, Dogs, Entries, Results, Breeds, Settings. Grey columns fill in by themselves. After changing `apps-script.gs`, paste it into the Apps Script project, run `setupSheet` once, and deploy a new version of the existing web app deployment so the URL stays the same.
