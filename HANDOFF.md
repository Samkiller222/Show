# Handoff: MNCF dog show awards organiser

Notes for picking this project up in a new chat. Last updated 5 November 2026 (handler and owner roles; entry fee payments by card through Stripe, paid out to Revolut).

## What it is

The site helps the MNCF (Malta) team at dog shows:
- set up shows
- enter dogs into classes
- tick off every award round by round
- record winners live on several phones at once
- export the results to Excel

- **Live site:** https://samkiller222.github.io/Show/ (GitHub Pages, branch `main`, repo `Samkiller222/Show`). Moving to Sam's own domain on Cloudflare (Nov 2026): a Worker named `show` connected to the repo serves the repo root as static files (`wrangler.jsonc`, `.assetsignore`) and redeploys on every push to `main`. See `docs/cloudflare.md`.
- **Owner:** Sam Micallef (sammicallef12@gmail.com)
- **Stack:** plain HTML, CSS and JavaScript with no build step, plus a Supabase database. Vendored libraries in `vendor/`: `supabase.min.js` (supabase-js 2.49.4 UMD) with its chunk `591.supabase.js` (keep the two side by side), and `xlsx.full.min.js` (SheetJS).

## Decisions already made (don't undo these)

- **Database:** Supabase replaced Google Sheets, because Sheets syncing was unreliable.
- **Supabase project:** "Dog Show", ref `cyikakfookjygycziqfg`, region eu-west-1.
  - URL: `https://cyikakfookjygycziqfg.supabase.co`
  - Publishable key: `sb_publishable_aYoBUyS09IpSzcz_7flzbA_WMeUUK38` (it is in `api.js`)
  - **Never touch** the other Supabase project `dhpxlmksyctpafcfdpit`. It holds Sam's personal apps.
- **Access:** team sign-in with email and password. Only emails listed in the `team_members` table can read anything, and each has a role (see "User roles" below).
- **Dog registration:** dog name, breed, sex, owner, phone and address, plus optional date of birth, breeder, sire and dam (added 3 Nov 2026 for the catalogue; the `dogs` table and `upsert_dog_` always had these columns).
- **Classes and breed groups are set by hand:** classes on the Entries form, groups on the Breeds page. There is no hard-coded group list on the awards page.
- **Claude API import (`import.html`, edge function `extract`):** dropped. The code stays in the repo in case it's wanted again, but the page is hidden from menus. The function would need the `ANTHROPIC_API_KEY` secret, which has not been added.
- **Navigation:** burger menu (drawer) on every page, plus bottom tabs inside a show: Entries, Add entry, Awards, Results. The design should scale to many future shows.
- **Add entry is its own screen** (`entry.html`), separate from the Entries list (Sam, 3 Nov 2026).
- **The open show can be edited at any time:** "Edit show" button in the top bar (and "Edit show details" in the drawer) on every show screen.
- **Awards view:** each user can switch, from the drawer, between one round at a time (the default) and the full list. The choice is saved per phone.
- **Old Google Sheet, `apps-script.gs`, `sync.js` and `data.js` (all in `legacy/`):** no longer used by the new pages. They are kept for reference.

## Folders (3 Nov 2026)

Sam asked to organise the repo instead of one long list of files. The live pages stay at the top level so their links and bookmarks keep working; everything else lives in folders:

| Folder | What's in it |
|---|---|
| (top level) | The pages people open: `index`, `register`, `entry`, `awards`, `breeds`, `catalogue`, `schedule`, `import` (hidden), plus `404.html`, `version.json`, `README.md`, this file |
| `css/` | `style.css` |
| `js/` | Shared scripts: `api.js`, `shell.js`, `focus.js`, `nav.js`, `schedule.js` |
| `vendor/` | Third-party libraries (Supabase, SheetJS); don't edit |
| `legacy/` | The first version (`nov-2026.html` and its pages), `data.js`, `sync.js`, and the old Google Sheets `apps-script.gs` |
| `supabase/` | Database migrations and the edge function source |
| `docs/screenshots/` | Old screenshots |

`404.html` sends old bookmarks of the first-version pages (for example `/Show/saturday.html`) to `legacy/`. New pages go at the top level and load `css/style.css`, `js/…` and `vendor/…`; `shell.js` fetches `version.json` relative to the page, so pages must stay at the top level.

## Pages

| File | What it does |
|---|---|
| `index.html` | Shows home: search, status filter, "+ New show" form, and a card per show with Entries and Awards buttons |
| `register.html` | **Entries** tab for one show (`?show=<name>`). The entries list by breed with Puppy/Junior/Open lanes (drag to change class, Absent, Edit, Remove) and a "+ Add entry" button. |
| `entry.html` | **Add entry** tab (`?show=`). The entry form, with a "Just added" list. `&edit=<entry id>` opens an entry for editing and returns to the list after saving. |
| `awards.html` | **Awards** tab (`?show=`) and **Results** tab (`?show=&view=results`). This is the awards engine. |
| `catalogue.html` | **Show catalogue** (`?show=`): a print-ready booklet for visitors. Opened from the "Catalogue" button on Entries or "Show catalogue to print" in the drawer. Print or save as PDF. |
| `schedule.html` | **Judging days and times** (`?show=`): split a show into sessions, each with a date, start time, optional name, the groups judged, single breeds moved in, Junior Handler / Childrens Class, and which session has the Best in Show finals. Opened from the drawer ("Judging days and times"), the "Edit days" chip, or "days" on a show card. |
| `dogs.html` | **Club dogs** (Manage section of the drawer): every dog in the `dogs` table, A to Z, with search and a breed filter, and "+ Add dog". `?dog=<id>` opens one dog: breed, sex, date of birth, breeder, sire, dam, owner, phone, address, then every show it was entered in with its classes and the results recorded for it. "Edit details" changes any field. `&add=1` on the list opens the add form. |
| `payments.html` | **Entry fees and payments** (`?show=`, drawer "Entry fees and payments", or "Payments" on Entries): fee per entry, totals, entries grouped by owner with Pay by card (Stripe Checkout), Paid in cash, and the list of card payments. |
| `users.html` | **Users and roles** (Manage section of the drawer, admins only): the team with a role picker per person, Remove, an "Add someone to the team" form, and logins that signed up but aren't on the team yet. |
| `breeds.html` | Add breeds (a group is required) and change a breed's group |
| `import.html` | Hidden. Claude API file import. |
| `legacy/` `saturday.html`, `sunday-morning.html`, `sunday-evening.html`, `absent.html`, `best-in-show.html`, `nov-2026.html` | The first version, hard-coded for the November 2026 show. Kept as a fallback. |

Shared scripts (in `js/`; styles in `css/`):
- `api.js`: Supabase client, sign-in overlay and `mncfApi(action, data)`. Actions:
  - `bootstrap`, `show`, `addShow`, `updateShow` (by id, so renaming keeps entries and results)
  - `saveEntry`, `deleteEntry`, `setAbsent`
  - `addBreed`, `setBreedGroup`
  - `dogs`, `saveDog` (by id; renaming a dog also renames its entries), `dogHistory` (entries plus `live_results` of those shows)
  - `importEntries`, `syncState`, `extract`

  It also maps database rows to the shapes the pages use, for example an entry is `{_row, Show, "Ring No", "Dog name", Class, Absent, Breed, Group, Sex, Owner}`. Helpers: `mncfEsc`, `mncfToast`, `mncfQuery`, `mncfCache`, `mncfSignOut`, `mncfAccounts` (saved logins: `list`, `current`, `switchTo`, `add`, `remove`).
- `shell.js`: `mncfShell({page,title,kicker})` builds the top bar (with the "Edit show" dialog when a show is open), the burger drawer and the bottom tabs. Renaming a show moves this phone's `…::<show>` localStorage keys to the new name and reloads with the new `?show=`. The drawer holds:
  - show search
  - all shows, new show, breeds and groups
  - the awards-view toggle (`mncfAwardsView`, localStorage key `mncf-awards-view`)
  - sign out
- `focus.js`: `mncfFocus` handles one-round-at-a-time mode and its pager. The current round is saved in `mncf-round::<show>`.
- `schedule.js`: `mncfSchedule` helpers for judging days: `list(show)`, `find(list,{breed,group}|{special}|{finals:true})` (a moved breed wins over its group; returns the session index or -1), `ordered`, `rank`, `heading(s)` ("Sunday 1st November 2026 – judging starts at 9.00AM"), `short(s)`, `summary(s)`, and `bar(...)`, the day chip bar. The picked day is saved per phone under `mncf-day::<show>`.
- `nav.js`: `mncfJumpNav` is the jump bar with group chips, round picker, "Next to do" and "Hide done".
- `style.css`: shared styles.

## Database (Supabase)

**Tables:**
- `breeds(name pk, grp)`
- `shows`
- `dogs`
- `entries`
- `live_results`
- `team_members`

**View:** `entries_view` (security_invoker).

**Security:** row-level security on every table, through `private.is_team()` (security definer, in the `private` schema).

**RPCs:**
- `show_id_for`
- `upsert_dog_`
- `save_entry(p_show, p_entry, p_dog)`
- `import_entries(p_show, p_entries)`
- `sync_state(p_show, p_changes, p_since)`, which returns `{now, rows}`

**Realtime:** publication on `live_results`.

**Security advisors:** clean at last check.

Backend notes and the edge function source are in `supabase/`.

## How awards and live sync work (`awards.html`)

**Result keys:**
- Class placings: `Breed|Class|place`
- Breed awards: `Breed|*|BD/BB/BP/BJ/BV/BOB`
- Group awards: `GROUP|<section>|BIG/BJG/BPG/BVG`, with `|R` for the runner-up. Veterans have no runner-up.
- Finals: `SHOW|BIS/BPIS/BJIS/BVIS/AVLB`, with `|R` for the runner-up.

**Value flags:**
- `g|key` marks an award as given.
- The value `__W` means withheld.
- `auto-off|key` records that an auto-filled value was cleared.

**Rules:**
- AV Locally Bred and veteran groups award first place only.
- Best in Show finals take their competitors from the group winners of the matching age class.

**Sync:**
- Each change is timestamped per key and the newest change wins.
- Local copies are kept under `mncf-show-results::<show>` and `mncf-live2::<show>`.
- The page pushes and pulls through `sync_state`. A realtime ping triggers a pull, and polling every 30 seconds is the fallback.

The "Bring in results saved on this phone" button (shows named "November 2026") imports results that the first version saved in localStorage.

## Latest work (3 Nov 2026)

On the Entries form, the dog-name suggestions are now filtered by the chosen breed:
- The breed field comes before the dog name.
- `fillDogList()` builds the list and a hint line.
- After saving, the class and breed stay selected, so several dogs of one breed go in quickly.
- Junior Handler and Childrens Class show no dog list.

## Entries lanes and drag between classes (3 Nov 2026, PR #1, branch `entries-drag-lanes`)

Sam asked: *"have the breeds grouped up and the names of the dogs be dragable between the junior, puppy and open classes"*. Done in `register.html`:
- Each breed card (still ordered by group, group named in the card header) shows a **Dogs** block and a **Bitches** block, each with Puppy, Junior and Open lanes. Empty lanes say "Drop a dog here". Veteran entries sit in a fixed lane below and can't be dragged. AV Locally Bred and the handler classes stay as plain lists.
- Drag a dog with the mouse by grabbing its card anywhere except its buttons (drag starts after a 6px move, so clicks still work); by touch, hold the ⠿ handle (`touch-action:none` on the handle only, so the page still scrolls).
- Class lanes are colour-coded (Puppy amber, Junior teal, Open purple, Veteran grey) with solid header bars, and the Dogs / Bitches blocks have ♂ / ♀ marks and blue / red side bars. Only lanes of the same breed and sex accept the drop; the page auto-scrolls near the screen edges.
- Tap fallback: a class menu on each movable card.
- `moveEntry(row, cls)` updates the list at once, then saves with `mncfApi("saveEntry",{entry:{...,Class,_row},dog:null})`. If saving fails the dog jumps back and a toast shows the error. `save_entry` with a null dog leaves the dog record alone.
- Styles are at the end of `style.css` (`.lanes`, `.lane`, `.grip`, `.mvsel`, `.ghost`).

## Separate Add entry screen and Edit show (3 Nov 2026, same PR)

Sam: *"the add entry screen and the awards tracker screen should be seperate and i need to be able to edit the show I'm on at any given moment"*. Read as: the add-entry form moves off the Entries list into its own tab, and every show screen gets an "Edit show" button. Other phones still keep unsynced local copies under the old name after a rename; the server data is fine because everything is linked by show id.

## Awards that only one dog can win (3 Nov 2026)

Sam asked that awards which can only go to one dog (Best Puppy, Best Junior, a sex, a one-dog class) be more obvious, so ring stewards can prepare ribbons and cards. In `awards.html`, `row(..., only)` marks such rows green with an "Only 1 dog" tag, and each breed and group card opens with a "Prepare now · only one dog can win" list (award → ring number · dog), built by `prepBox()`. An award counts as one-dog when its candidate pool has exactly one dog. Given awards are struck through in the list.

## Animations and quality of life (3 Nov 2026)

Sam: *"now lets add a few animations and QoL improvments"*. All motion uses transform/opacity only and is switched off under `prefers-reduced-motion`.
- **Toasts** (`mncfToast(text,{action,onAction,ms})` in `api.js`, styles in `shell.js`): slide up, sit above the bottom tabs and the round pager (they used to hide behind them), and can carry an Undo button. The awards page's own `toast()` now calls `mncfToast`. The back-to-top button was lifted above the tabs too.
- **Entries:** a dropped dog glides from the drop point into its new lane and flashes (`landed()` in `register.html`). Moving class offers Undo. Remove now waits 5 seconds with Undo before deleting (`PENDING`, `removeEntry`, `commitRemove`); pending removals are sent at once when the page is hidden, a link is followed, or Edit is tapped. After editing an entry, the list returns with `&edited=<id>` and scrolls to and flashes that dog.
- **Lane resize:** when a dog moves, is removed or comes back, the class lanes grow and shrink smoothly (`smoothDraw()` in `register.html`, 260ms height animation, skipped under reduced motion).
- **Add entry:** the newest "Just added" row slides in; "updated" after an edit shows on the list via `sessionStorage` `mncf-flash`.
- **Awards:** choosing a dog flashes the row, ticking Given pops the box, and a breed or group card glows when its last award is given (`cheer()`).
- **Sticky breed headers** (`.breed > .bhead`) on every page, held just under the header via the `--hdr` CSS variable that `shell.js` keeps up to date.
- **Keyboard shortcuts** (computer only, ignored while typing; listed in the drawer on wide screens): `/` search, `N` Add entry, `←`/`→` previous or next round (`mncfFocus.step`).

## Show catalogue (3 Nov 2026)

Sam: *"a button somewhere that can make a document like this booklet after the show has been populated so that visitors have a book to follow"* (photos of the MNCF November 2026 Championship Show catalogue). `catalogue.html` builds it from `mncfApi("show")` (entries joined to `dogs` by name):
- Cover with show name, date, venue, judge and a contents list of breeds by group.
- Per breed, in group order then A to Z: black breed banner with the group label, exhibitor blocks (owner. address. phone., then each dog in bold with sex, date of birth, `br` breeder, sire - dam, `Cl:` class codes PD/PB/JD/JB/OD/OB/VD/VB/AVLB), then the classes (bitches first, as in `awards.html`) with ring numbers, and blank lines: Best Bitch / Best Dog (only when both sexes are entered), Best of Breed, and Best Puppy / Junior / Veteran in Breed when both sexes have one.
- After each group: a group judging table (V where the breed has veterans, dashes where it has no juniors or puppies), Best in Group / Junior / Puppy lines with Reserve, Best Veteran in the group, and Any Variety Locally Bred for that group.
- Then Best in Show finals, Junior Handler and Childrens Class.
- Options (saved per phone under `mncf-catalogue::<show>`): the running header line, A5 or A4, and leaving out absent dogs. The header and page numbers use CSS `@page` margin boxes, which print in Chrome and Edge only.
- Not done: sponsor adverts, filling in results after the show, and judging days or start times (shows have no such field).

## Judging days (3 Nov 2026)

Sam: *"i need a way to seperate the schedule over multiple days / time periods like the one already in the database"*. The November show was run as Sat 31 Oct from 3:00pm (Utility & Hound, Junior Handler), Sun 1 Nov from 9:00am (Gundog & Toy, Childrens Class) and Sun 1 Nov from 2:00pm (Working & Terrier, then Best in Show); that was only hard-coded in the first-version pages, so it is now data.
- **Database:** `shows.schedule jsonb` (default `[]`), list of `{id,date "YYYY-MM-DD",start "HH:MM",title,groups[],breeds[],specials[],finals}`. Migration and the seed for the November show: `supabase/migrations/20261103_shows_schedule.sql` (applied to the live database 3 Nov 2026). `api.js` maps it to `show.Schedule` and saves it with `mncfApi("setSchedule",{id,schedule})`.
- **Awards:** with a schedule, rounds run in session order and a day chip bar sits in the header (Whole show, each session, and "Not on a day" when something is unassigned). Only the picked day's rounds are drawn; awards are still worked out over the whole show, so finals see every group winner. Round mode remembers its place per day (`mncf-round@<day>::<show>`). Group judging of a group shows on that group's day.
- **Entries:** same day bar; in Whole show view breed cards sit under day headings, and AV Locally Bred gets one card per session.
- **Catalogue:** a "Judging times" list on the cover, and each session starts a new page with its heading, then its special classes, moved breeds, groups (breeds, group judging, AVLB) and the finals.
- A show with no schedule behaves exactly as before.

## Club dog register (3 Nov 2026)

Sam: *"under the manage tab add a way i can see all dog that are registered with the club and add more and see all details tied to all the dogs"*. The `dogs` table was already a club-wide register (one row per dog, unique by lower(name), not tied to a show), so no database change was needed. New page `dogs.html`, linked as "Club dogs" in the drawer's Manage section.
- Entries link to dogs by name (`entries.dog_name`), so `saveDog` renames the dog's entries when the name changes (after a confirm).
- Results history: `live_results` values are ring numbers (or the dog name when an entry has no ring number); group and show awards are `Breed::ring`, and AV Locally Bred uses the breed name `Any Variety Locally Bred <group>`. `winsFor()` in `dogs.html` matches these per entry. Withheld and `g|`/`auto-off|` keys are ignored, so a recorded winner shows even before Given is ticked.
- Not done: removing a dog (the `dogs` table has no delete policy), and a breed must already exist on Breeds and groups.

## User roles (3 Nov 2026)

Sam: *"add an admin view where an admin can see and change the roles of certain users"*. Sam picked four roles:

| Role | Can do |
|---|---|
| `admin` | Everything, plus `users.html` (see users, change roles, add or remove team members) |
| `organiser` | Everything except users. Existing team members became organisers. |
| `steward` | Read everything, record awards (`live_results`) only |
| `viewer` | Read only |

- **Database** (`supabase/migrations/20261103_team_roles.sql`): `team_members.role` (check constraint, default `organiser`), Sam set to admin. `private.my_role()`, `can_edit()`, `can_award()`, `is_admin()`, `need_edit()`. Write policies on shows, entries, dogs and breeds use `can_edit()`; on `live_results` `can_award()`; reads still use `is_team()`. `save_entry` and `import_entries` start with `perform private.need_edit()` and `sync_state` refuses changes from viewers, so the errors read clearly. `team_members` has no write policies: it only changes through `set_team_member(p_email,p_role,p_name)` and `remove_team_member(p_email)` (security definer, admins only). An admin can't change their own role or remove themselves, and the club must always keep one admin. `team_list()` (admins only) returns team members joined to `auth.users` plus logins not on the team. `my_role()` is callable by any signed-in user.
- **Site:** `api.js` has `mncfRole()` (cached per page, last value in localStorage `mncf-role`), `mncfRoleName()`, actions `team`, `setMember`, `removeMember`, and refuses writes the role can't make with a plain message (no more sign-out on a permission error while signed in). `shell.js` sets `body[data-role]` and the classes `ro-edit` (steward, viewer, not on team) and `ro-award` (viewer), which hide Edit show, the Add entry tab, + New show, + Add dog, Edit details, entry buttons and drag, the breed form, the save bar on judging days, and lock award pickers; a note under the header says what the login can do. The drawer shows the role badge and, for admins, "Users and roles". If `my_role` is missing (migration not applied) the site behaves exactly as before.
- Creating the login itself still happens in Supabase (Authentication → Users). Adding the email on `users.html` gives it a role.

## Handler and owner roles (3 and 5 Nov 2026)

Sam: *"add another user type called handler where those users can see dogs registered to them and write them up for shows"*. Sam chose to link dogs to handlers by email, set on each dog.

- **Owner role** (5 Nov, Sam: *"add an owner preview for admins"*, then chose owner logins): works like a handler but linked through `dogs.owner_emails`, and on My dogs owners also see each show's fee per entry, what they owe and what is paid (`PaidAt`/`PaidVia` on entries). In the database `private.is_handler()` means handler **or** owner, and `my_dog()` checks both email lists; a new dog added by an owner is linked through `owner_emails`. Owners and handlers pay their own entry fees by card from My dogs (see the audit section below).
- **Database** (`supabase/migrations/20261105_handler_owner_roles.sql`, after the team roles and payments migrations): role `handler`; `dogs.handler_emails text[]` (GIN index). `private.sees_all()` (every role but handler), `is_handler()`, `my_email()`, `my_dog(name)`, `show_open(show_id)`, `handler_dog_check(name)`.
  - Handlers read shows and breeds, only their own dogs (`my_email() = any(handler_emails)`) and those dogs' entries; no results (`live_results`) and no team list.
  - They add dogs (linked to them by the `handler_dog_rules` trigger), edit their own dogs but can't rename them or change `handler_emails`, and enter, change or withdraw their own dogs while the show's status is Open. They can't set ring numbers, enter Junior Handler or Childrens Class, add breeds, or mark absent. `handler_entry_rules` gives the plain error messages and stops them changing the payment columns. They read only payments that include their own dogs' entries.
  - `upsert_dog_` starts with `perform private.handler_dog_check(p_name)` so entering a dog registered to someone else says so. `need_edit()` lets handlers through; RLS and the triggers decide. `team_list()` gains a `dogs` count.
- **Handlers' home page** `mydogs.html` (Sam: *"make it a previewable page for admins"*): open shows with an "Enter a dog" button and the handler's entries in each (Change links back to the entry form), their dogs (+ Add a dog), and earlier/closed shows. Handlers are sent there from `index.html` and have "My dogs" in the drawer. An admin opening it (drawer: "Handlers' home page") gets a list of handlers and picks one to preview the page as them; Preview on Users and roles also lands here. Data comes from `mncfApi("myDogs")` (dogs, shows, entries; RLS limits a handler to their own).
- **Site:** Club dogs has "Owner logins" and "Handler logins" fields (organisers and admins) and shows the logins on the dog page. `body.ro-handler` hides show setup, awards and results, judging days, catalogue, breeds, Absent, the ring number field, handler classes and "Add a new breed". Users and roles lists Handler, shows each handler's dog count and has a Preview button per handler (`mncf-preview-role` = `handler:<email>`). In a handler preview `api.js` (`previewFilter`) narrows dogs and entries to that email's dogs, since the database still answers as the admin. Saved lists (`mncf-cache-*`) are cleared on sign-in, sign-out and preview changes so one login never sees another's.

## Entry fee payments by card (5 Nov 2026)

Sam: *"see how i can make a payment system in the website i need it to send the money to my revolute account"*. First built on Revolut's Merchant API (PR #16), then switched to **Stripe Checkout** because opening a Revolut Business account was too hard (Revolut Pro has no merchant API). Stripe pays out to Sam's Revolut IBAN. Assumed: one fixed fee per entry, set per show.
- **Database** (`supabase/migrations/20261105_payments.sql`): `shows.entry_fee_cents`, `entries.paid_at / paid_via ('card'|'cash') / payment_id`, table `payments` (one row per Stripe Checkout Session in `order_ref`; the team can read it, only the edge function writes), and `entries_view` gains the paid columns.
- **Edge function `payments`** (`supabase/functions/payments/`, deploy with JWT verification off): `checkout` (organisers and admins) creates a Stripe Checkout Session for the picked unpaid entries and returns its URL; `refresh` asks Stripe for the session and marks the entries paid when `payment_status` is `paid`. Stripe's webhook posts to the same function; the body is only a hint, the session is always fetched back from Stripe with the secret key before anything is marked paid. Secrets: `STRIPE_SECRET_KEY` (test or live is read from the key), optional `SITE_URL` (default `https://register.maltacaninefederation.com/`). The key is never in the repo.
- **Site:** `payments.html`; `api.js` actions `setFee`, `payments`, `checkout`, `refreshPayment`, `markPaid` (cash, by hand). Stripe sends the payer back to `payments.html?show=…&payment=<id>`, which checks the payment straight away. Test-mode payments are tagged "Test".
- Not done: refunds (do them in the Stripe dashboard), a Paid tag on the Entries list.

## Audit and owner payments (5 Nov 2026)

Sam: *"when in handler/owner mode i cant pay for registrations and while your checking look for other bugs"*.
- **Owners and handlers pay from My dogs** (`mydogs.html`): each show with a fee shows what's due and a "Pay €X by card" button for that login's unpaid entries (not Junior Handler or Childrens Class). It starts a Stripe Checkout and Stripe sends them back to `mydogs.html?payment=<id>`, which checks it at once. In an admin's owner/handler preview the button works too (the function sees an admin).
- **Edge function `payments`**: `checkout` now takes owners and handlers, but only for entries of dogs linked to their email (checked server-side with the service key); their checkout email is pre-filled and `back:"mydogs"` picks the return page. `refresh` by an owner or handler only works on their own payments. Before a new checkout, older still-open checkouts covering the same entries are checked with Stripe and expired, so one entry can't be paid twice.
- **Migration `20261105_audit_fixes.sql`**: owners and handlers can't withdraw a paid entry or move it to another dog.
- **Site fixes**: Add entry treated owners like organisers (offered Junior Handler, Childrens Class and "Add a new breed", which the database then refused); now owners get the handler form, and saving an edit sends owners and handlers back to My dogs. `nav.js` escapes group and breed names in the jump bar.

## Account quick switcher (6 Nov 2026)

Sam asked for an account quick switcher. Every page now has a round button with the login's first letter at the top right of the top bar (and "Switch account" in the drawer). It opens an Accounts panel: who is signed in and their role, other logins saved on this phone (tap to switch, × to remove), "+ Add another account" and "Sign out".
- `api.js` keeps each login that signs in here under localStorage `mncf-accounts` (email, role, latest tokens). Supabase rotates the refresh token, so the saved copy is updated on every auth event for the login in use; idle logins aren't refreshed, so their token stays valid.
- Switching checks the saved login with a throwaway client first, so an expired one only drops itself from the list and never signs out the current login. Switching clears the role, admin preview and cached lists, then reloads; other open tabs reload too (`mncf-active-account`).
- After "Sign out" the sign-in screen lists the remaining saved logins for one-tap sign-in. Add account has a Cancel that keeps the current login.
- This is different from the admin "Preview the site as" (which only changes what an admin's screens show): switching is a real sign-in as the other person, so the database answers as them.

## Clearer payment screens (6 Nov 2026)

Sam asked to make the site friendlier and highlight what matters on the payment screens. Colours: green = paid, amber = due or waiting, red = problem (shared `.callout` and `.pill-s` classes and `--due` colours in `css/style.css`).
- `payments.html`: a big "Still to collect" total with a paid progress bar; each owner card shows "€x due" or "Paid"; a card checkout that was started but not finished shows on the owner card with Show link and Check; card payments say what to do next (waiting, expired, failed); the pay sheet lists the dogs being paid for and the three next steps. "How card payments work" is folded away.
- `mydogs.html`: per dog Paid / Not paid pills, a highlighted "Entry fees to pay" box with the amount, the dogs and the Pay button, and a banner (not just a toast) after coming back from Stripe.
- Sign in: Show/Hide password button and "Forgot your password? Ask a club admin."

## Next request

None yet.

## Things Sam still has to do in Supabase

1. In Authentication → Users → Add user, create a login for each team member with auto-confirm on, then give them a role on the Users and roles page (or let them appear under "Waiting for a role").
2. Optionally, turn off new sign-ups in Authentication settings.
3. Payments: redeploy the `payments` function after the audit PR, and run `20261105_audit_fixes.sql`.
4. Payments: Stripe account with the Revolut IBAN for payouts, apply `20261105_payments.sql`, deploy the `payments` function, add `STRIPE_SECRET_KEY` and the webhook (steps in `supabase/README.md`).

## How to work on it

- **Bump the version on every change.** Browsers keep old copies of pages and files for a while, which mixed old and new screens (unstyled lanes, the old entry form still showing). Each new-system page (`index`, `register`, `entry`, `awards`, `breeds`) has `<meta name="mncf-version">` and loads `css/style.css` and `js/api.js`, `js/shell.js`, `js/nav.js`, `js/focus.js`, `js/schedule.js` with `?v=<version>`. `shell.js` fetches `version.json` without cache and, if it differs from the page's meta, reloads once with `&_v=<version>`. When you change anything, replace the old version string everywhere: `grep -rl OLD --include=*.html --include=version.json . | xargs sed -i s/OLD/NEW/g`.

- Clone the repo, edit the files and push to `main`. GitHub Pages and Cloudflare Pages both redeploy in about a minute. Keep links relative (no leading `/`), because GitHub Pages serves the site under `/Show/` and Cloudflare at the root. Cloudflare also drops `.html` from URLs (`awards.html` → `/awards`), which relative links and query strings survive.
- **Commit identity:** `Sam Micallef <sammicallef12@gmail.com>`.
- **Testing:** use Playwright at phone size (390×844) and replace `api.js` with a fake that returns sample entries, so no sign-in is needed. Test SQL inside a transaction that is rolled back, using `set local role authenticated` and the JWT claims.
- **Styling:** keep the existing look. Touch targets are at least 46px, and `style.css` uses CSS variables.
