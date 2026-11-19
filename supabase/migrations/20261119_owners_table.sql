-- Owners register + dog title and microchip (19 Nov 2026). Sam: "this is to populate the database for the dogs
-- and owners" (FEBRUARY_2027_ENTRIES_MCS.xlsx, LIST sheet). The sheet has one row per dog with the owner's
-- surname, first name, three address lines, phone and email, and the dog's title and microchip.
--
-- 1. public.owners: one row per owner (deduplicated by surname + first name), with contact details.
-- 2. dogs.title (Ch., Sh.Ch. ...), dogs.microchip, dogs.owner_id (link to owners).
--    dogs.owner / phone / address stay filled in too, so the catalogue and entry screens keep working.
-- 3. Only organisers and admins change owners or a dog's owner link; an owner login reads its own owner row.
--
-- Safe before or after 20261106_remove_handler_role.sql (uses only sees_all, can_edit and my_email).
-- Run once; re-running is harmless.

create table if not exists public.owners (
  id         uuid primary key default gen_random_uuid(),
  surname    text not null default '',
  first_name text not null default '',
  address1   text not null default '',
  address2   text not null default '',
  address3   text not null default '',
  phone      text not null default '',
  email      text not null default '',
  created_at timestamptz not null default now()
);
create unique index if not exists owners_name_key on public.owners (lower(surname), lower(first_name));
create index if not exists owners_email_idx on public.owners (lower(email));

alter table public.owners enable row level security;
drop policy if exists "Team reads owners" on public.owners;
create policy "Team reads owners" on public.owners for select to authenticated
  using (private.sees_all() or (email <> '' and lower(email) = private.my_email()));
drop policy if exists "Team adds owners" on public.owners;
create policy "Team adds owners" on public.owners for insert to authenticated with check (private.can_edit());
drop policy if exists "Team changes owners" on public.owners;
create policy "Team changes owners" on public.owners for update to authenticated
  using (private.can_edit()) with check (private.can_edit());
grant select, insert, update on public.owners to authenticated;

alter table public.dogs add column if not exists title     text not null default '';
alter table public.dogs add column if not exists microchip text not null default '';
alter table public.dogs add column if not exists owner_id  uuid references public.owners(id) on delete set null;
create index if not exists dogs_owner_id_idx on public.dogs (owner_id);

-- Owner logins may edit their own dogs' details, but not which owner record the dog belongs to.
-- (No signed-in user means the SQL editor or the service key, which may.)
create or replace function private.dog_owner_link_rules() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.owner_id is distinct from (case when tg_op = 'UPDATE' then old.owner_id else null end)
     and auth.uid() is not null and not private.can_edit() then
    raise exception 'Only organisers can change which owner a dog belongs to.';
  end if;
  return new;
end $$;
drop trigger if exists dog_owner_link_rules on public.dogs;
create trigger dog_owner_link_rules before insert or update on public.dogs
  for each row execute function private.dog_owner_link_rules();
