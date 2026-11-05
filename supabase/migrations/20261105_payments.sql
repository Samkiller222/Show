-- Entry fee payments through Revolut checkout (payments.html, edge function "payments").
--   shows.entry_fee_cents : fee per entry in euro cents (null = this show doesn't take payments)
--   entries.paid_at / paid_via / payment_id : when and how an entry was paid ('revolut' or 'cash')
--   payments : one row per Revolut checkout. Only the edge function writes here (service role);
--              the team can read it.

alter table public.shows add column if not exists entry_fee_cents integer;
alter table public.shows drop constraint if exists shows_entry_fee_cents_check;
alter table public.shows add constraint shows_entry_fee_cents_check check (entry_fee_cents is null or entry_fee_cents >= 0);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references public.shows(id) on delete cascade,
  entry_ids uuid[] not null default '{}',
  payer text not null default '',
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'EUR',
  state text not null default 'creating',   -- creating, pending, processing, authorised, completed, cancelled, failed
  mode text not null default 'sandbox',      -- sandbox (test money) or live
  revolut_order_id text unique,
  checkout_url text,
  created_by text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists payments_show_idx on public.payments(show_id);
alter table public.payments enable row level security;
drop policy if exists "Team reads payments" on public.payments;
create policy "Team reads payments" on public.payments for select to authenticated using (private.is_team());
-- No insert/update/delete policies: only the payments edge function changes this table.

alter table public.entries add column if not exists paid_at timestamptz;
alter table public.entries add column if not exists paid_via text;
alter table public.entries add column if not exists payment_id uuid references public.payments(id) on delete set null;
alter table public.entries drop constraint if exists entries_paid_via_check;
alter table public.entries add constraint entries_paid_via_check check (paid_via is null or paid_via in ('revolut','cash'));

-- Same view as before, with the payment columns added at the end.
create or replace view public.entries_view with (security_invoker = true) as
 select e.id, e.show_id, s.name as show_name, e.ring_no, e.dog_name, e.class, e.absent, e.created_at,
    coalesce(d.breed, ''::text) as breed,
    coalesce(b.grp, ''::text) as grp,
    coalesce(d.sex, ''::text) as sex,
    coalesce(d.owner, ''::text) as owner,
    e.paid_at, e.paid_via, e.payment_id
   from public.entries e
     join public.shows s on s.id = e.show_id
     left join public.dogs d on lower(d.name) = lower(e.dog_name) and (e.class <> all (array['Junior Handler'::text, 'Childrens Class'::text]))
     left join public.breeds b on b.name = d.breed;
