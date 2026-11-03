# Handoff: MNCF dog show awards organiser

Notes for picking this project up in a new chat. Last updated 3 November 2026 (drag lanes).

## What it is

The site helps the MNCF (Malta) team at dog shows:
- set up shows
- enter dogs into classes
- tick off every award round by round
- record winners live on several phones at once
- export the results to Excel

- **Live site:** https://samkiller222.github.io/Show/ (GitHub Pages, branch `main`, repo `Samkiller222/Show`)
- **Owner:** Sam Micallef (sammicallef12@gmail.com)
- **Stack:** plain HTML, CSS and JavaScript with no build step, plus a Supabase database. Vendored libraries: `supabase.min.js` (supabase-js 2.49.4 UMD) and `591.supabase.js`, and `xlsx.full.min.js` (SheetJS).

## Decisions already made (don't undo these)

- **Database:** Supabase replaced Google Sheets, because Sheets syncing was unreliable.
- **Supabase project:** "Dog Show", ref `cyikakfookjygycziqfg`, region eu-west-1.
  - URL: `https://cyikakfookjygycziqfg.supabase.co`
  - Publishable key: `sb_publishable_aYoBUyS09IpSzcz_7flzbA_WMeUUK38` (it is in `api.js`)
  - **Never touch** the other Supabase project `dhpxlmksyctpafcfdpit`. It holds Sam's personal apps.
- **Access:** team sign-in with email and password. Only emails listed in the `team_members` table can read or write.
- **Dog registration:** dog name, breed, sex, owner, phone and address only. There is **no pedigree and no date of birth**.
- **Classes and breed groups are set by hand:** classes on the Entries form, groups on the Breeds page. There is no hard-coded group list on the awards page.
- **Claude API import (`import.html`, edge function `extract`):** dropped. The code stays in the repo in case it's wanted again, but the page is hidden from menus. The function would need the `ANTHROPIC_API_KEY` secret, which has not been added.
- **Navigation:** burger menu (drawer) on every page, plus bottom tabs inside a show: Entries, Awards, Results. The design should scale to many future shows.
- **Awards view:** each user can switch, from the drawer, between one round at a time (the default) and the full list. The choice is saved per phone.
- **Old Google Sheet, `apps-script.gs`, `sync.js` and `data.js`:** no longer used by the new pages. They are kept for reference.

## Pages

| File | What it does |
|---|---|
| `index.html` | Shows home: search, status filter, "+ New show" form, and a card per show with Entries and Awards buttons |
| `register.html` | **Entries** tab for one show (`?show=<name>`). Has the entry form and the entries list (Absent, Edit, Remove). |
| `awards.html` | **Awards** tab (`?show=`) and **Results** tab (`?show=&view=results`). This is the awards engine. |
| `breeds.html` | Add breeds (a group is required) and change a breed's group |
| `import.html` | Hidden. Claude API file import. |
| `saturday.html`, `sunday-morning.html`, `sunday-evening.html`, `absent.html`, `best-in-show.html`, `nov-2026.html` | The first version, hard-coded for the November 2026 show. Kept as a fallback. |

Shared scripts:
- `api.js`: Supabase client, sign-in overlay and `mncfApi(action, data)`. Actions:
  - `bootstrap`, `show`, `addShow`
  - `saveEntry`, `deleteEntry`, `setAbsent`
  - `addBreed`, `setBreedGroup`
  - `importEntries`, `syncState`, `extract`

  It also maps database rows to the shapes the pages use, for example an entry is `{_row, Show, "Ring No", "Dog name", Class, Absent, Breed, Group, Sex, Owner}`. Helpers: `mncfEsc`, `mncfToast`, `mncfQuery`, `mncfCache`, `mncfSignOut`.
- `shell.js`: `mncfShell({page,title,kicker})` builds the top bar, the burger drawer and the bottom tabs. The drawer holds:
  - show search
  - all shows, new show, breeds and groups
  - the awards-view toggle (`mncfAwardsView`, localStorage key `mncf-awards-view`)
  - sign out
- `focus.js`: `mncfFocus` handles one-round-at-a-time mode and its pager. The current round is saved in `mncf-round::<show>`.
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

## Entries lanes and drag between classes (3 Nov 2026, PR on branch `entries-drag-lanes`)

Sam asked: *"have the breeds grouped up and the names of the dogs be dragable between the junior, puppy and open classes"*. Done in `register.html`:
- Each breed card (still ordered by group, group named in the card header) shows a **Dogs** block and a **Bitches** block, each with Puppy, Junior and Open lanes. Empty lanes say "Drop a dog here". Veteran entries sit in a fixed lane below and can't be dragged. AV Locally Bred and the handler classes stay as plain lists.
- Drag a dog by its ⠿ handle (pointer events with `touch-action:none` on the handle only, so the page still scrolls by touch). Only lanes of the same breed and sex accept the drop; the page auto-scrolls near the screen edges.
- Tap fallback: a class menu on each movable card.
- `moveEntry(row, cls)` updates the list at once, then saves with `mncfApi("saveEntry",{entry:{...,Class,_row},dog:null})`. If saving fails the dog jumps back and a toast shows the error. `save_entry` with a null dog leaves the dog record alone.
- Styles are at the end of `style.css` (`.lanes`, `.lane`, `.grip`, `.mvsel`, `.ghost`).

## Next request

None yet.

## Things Sam still has to do in Supabase

1. In Authentication → Users → Add user, create a login for sammicallef12@gmail.com with auto-confirm on. Do the same for each team member, and add each person's email to the `team_members` table.
2. Optionally, turn off new sign-ups in Authentication settings.

## How to work on it

- Clone the repo, edit the files and push to `main`. GitHub Pages redeploys in about a minute.
- **Commit identity:** `Sam Micallef <sammicallef12@gmail.com>`.
- **Testing:** use Playwright at phone size (390×844) and replace `api.js` with a fake that returns sample entries, so no sign-in is needed. Test SQL inside a transaction that is rolled back, using `set local role authenticated` and the JWT claims.
- **Styling:** keep the existing look. Touch targets are at least 46px, and `style.css` uses CSS variables.
