# MNCF Show Desk

Website: https://samkiller222.github.io/Show/

A small show-management system for MNCF dog shows. The Google Sheet "MNCF November 2026 Show Results" is the database; the website reads from and writes to it through a Google Apps Script web app (`apps-script.gs`). Everyone using the site types the team password from the sheet's Settings tab once per phone.

## Pages
- `index.html`: all shows, and a form to add a new one.
- `register.html?show=…`: enter dogs into a show. Dogs are remembered by name and breed, so a dog registered once fills in its details at later shows. Ring numbers are typed by hand. Mark absent, edit or remove entries.
- `awards.html?show=…`: the awards checklist, built from the show's entries: class placings, breed awards, group awards with runner-up, Best Veteran per group, AV Locally Bred (1st only), and Best in Show finals whose competitors are the group winners. Results save on the phone, go to the Results tab, and export to Excel.
- `nov-2026.html` and the pages it links: the first version used at the November 2026 show.

## The sheet
Tabs: Start here, Shows, Dogs, Entries, Results, Breeds, Settings. Grey columns fill in by themselves. After changing `apps-script.gs`, paste it into the Apps Script project, run `setupSheet` once, and deploy a new version of the existing web app deployment so the URL stays the same.
