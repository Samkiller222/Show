-- Judging days and times for a show (schedule.html). One jsonb list per show:
-- [{id, date "YYYY-MM-DD", start "HH:MM", title, groups[], breeds[], specials[], finals}]
alter table public.shows add column if not exists schedule jsonb not null default '[]'::jsonb;

-- The November 2026 show, as it was run (from the first version's day pages)
update public.shows set schedule = '[
  {"id":"sat","date":"2026-10-31","start":"15:00","title":"Saturday","groups":["Utility","Hound"],"breeds":[],"specials":["Junior Handler"],"finals":false},
  {"id":"sunam","date":"2026-11-01","start":"09:00","title":"Sunday morning","groups":["Gundog","Toy"],"breeds":[],"specials":["Childrens Class"],"finals":false},
  {"id":"sunpm","date":"2026-11-01","start":"14:00","title":"Sunday afternoon","groups":["Working","Terrier"],"breeds":[],"specials":[],"finals":true}
]'::jsonb
where name = 'MNCF Championship Show November 2026' and schedule = '[]'::jsonb;
