-- Remove the handler role (6 Nov 2026). Owners stay: they see their own dogs (dogs.owner_emails),
-- enter them into Open shows and pay their entry fees.
-- Needs 20261105_handler_owner_roles.sql, 20261105_payments.sql and 20261105_audit_fixes.sql.
-- Redeploy the payments function from this PR BEFORE running this file: the old one still reads
-- dogs.handler_emails, which is dropped at the end.

-- ---- existing data: any handler becomes an owner, handler emails become owner emails ----
update public.team_members set role = 'owner' where role = 'handler';
update public.dogs
   set owner_emails = (select coalesce(array_agg(distinct e), '{}') from unnest(owner_emails || handler_emails) e)
 where cardinality(handler_emails) > 0;

-- ---- the role ----
alter table public.team_members drop constraint if exists team_members_role_check;
alter table public.team_members add constraint team_members_role_check
  check (role in ('admin','organiser','steward','viewer','owner'));

-- owner: a login that only sees its own dogs
create or replace function private.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(private.my_role() = 'owner', false);
$$;
create or replace function private.my_dog(p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.dogs d
                 where lower(d.name) = lower(trim(coalesce(p_name,''))) and private.my_email() = any(d.owner_emails));
$$;
grant execute on function private.is_owner() to authenticated;

-- ---- policies ----
alter policy "Team reads dogs" on public.dogs
  using (private.sees_all() or (private.is_owner() and private.my_email() = any(owner_emails)));
alter policy "Team reads entries" on public.entries
  using (private.sees_all() or (private.is_owner() and private.my_dog(dog_name)));
alter policy "Team reads payments" on public.payments
  using (private.sees_all() or (private.is_owner() and exists (
    select 1 from public.entries e where e.id = any(entry_ids) and private.my_dog(e.dog_name))));
alter policy "Team adds dogs" on public.dogs
  with check (private.can_edit() or (private.is_owner() and private.my_email() = any(owner_emails)));
alter policy "Team changes dogs" on public.dogs
  using (private.can_edit() or (private.is_owner() and private.my_email() = any(owner_emails)))
  with check (private.can_edit() or (private.is_owner() and private.my_email() = any(owner_emails)));
alter policy "Team adds entries" on public.entries
  with check (private.can_edit() or (private.is_owner() and private.my_dog(dog_name) and private.show_open(show_id) and ring_no = ''));
alter policy "Team changes entries" on public.entries
  using (private.can_edit() or (private.is_owner() and private.my_dog(dog_name) and private.show_open(show_id)))
  with check (private.can_edit() or (private.is_owner() and private.my_dog(dog_name) and private.show_open(show_id)));
alter policy "Team removes entries" on public.entries
  using (private.can_edit() or (private.is_owner() and private.my_dog(dog_name) and private.show_open(show_id)));

-- ---- rules a policy can't express (were handler_dog_rules / handler_entry_rules) ----
create or replace function private.owner_dog_rules() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_owner() then return new; end if;
  if tg_op = 'INSERT' then
    new.owner_emails := array[private.my_email()];
  elsif new.owner_emails is distinct from old.owner_emails then
    raise exception 'Only organisers can change who owns a dog.';
  elsif lower(new.name) <> lower(old.name) then
    raise exception 'Only organisers can rename a dog, because its show entries follow the name.';
  end if;
  return new;
end $$;
drop trigger if exists handler_dog_rules on public.dogs;
drop trigger if exists owner_dog_rules on public.dogs;
create trigger owner_dog_rules before insert or update on public.dogs
  for each row execute function private.owner_dog_rules();

create or replace function private.owner_entry_rules() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_show uuid := case when tg_op = 'DELETE' then old.show_id else new.show_id end;
begin
  if not private.is_owner() then return coalesce(new, old); end if;
  if not private.show_open(v_show) then
    raise exception 'Entries for this show are closed. Ask an organiser.'; end if;
  if tg_op <> 'INSERT' and not private.my_dog(old.dog_name) then
    raise exception 'You can only change your own dogs'' entries.'; end if;
  if tg_op = 'DELETE' then
    if old.paid_at is not null then
      raise exception 'This entry is already paid. Ask an organiser to withdraw it.'; end if;
    return old;
  end if;
  if tg_op = 'UPDATE' and old.paid_at is not null and lower(new.dog_name) <> lower(old.dog_name) then
    raise exception 'This entry is already paid, so it can''t be moved to another dog. Ask an organiser.'; end if;
  if new.class in ('Junior Handler','Childrens Class') then
    raise exception 'Junior Handler and Childrens Class are entered by the organisers.'; end if;
  if not private.my_dog(new.dog_name) then
    raise exception '% isn''t one of your dogs. Ask an organiser to link it to your login.', new.dog_name; end if;
  if new.ring_no <> coalesce(case when tg_op = 'UPDATE' then old.ring_no end, '') then
    raise exception 'Ring numbers are given by the organisers.'; end if;
  if new.paid_at is distinct from (case when tg_op = 'UPDATE' then old.paid_at end)
     or new.paid_via is distinct from (case when tg_op = 'UPDATE' then old.paid_via end)
     or new.payment_id is distinct from (case when tg_op = 'UPDATE' then old.payment_id end) then
    raise exception 'Payments are recorded by the organisers.'; end if;
  return new;
end $$;
drop trigger if exists handler_entry_rules on public.entries;
drop trigger if exists owner_entry_rules on public.entries;
create trigger owner_entry_rules before insert or update or delete on public.entries
  for each row execute function private.owner_entry_rules();

-- Entering a dog that is already registered to someone else: say so (an owner can't see that dog).
create or replace function private.owner_dog_check(p_name text) returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if private.is_owner() and not private.my_dog(p_name)
     and exists (select 1 from public.dogs where lower(name) = lower(trim(coalesce(p_name,'')))) then
    raise exception 'A dog called % is already in the club register but isn''t linked to your login. Ask an organiser to link it.', trim(p_name);
  end if;
end $$;
grant execute on function private.owner_dog_check(text) to authenticated;
do $$ begin
  execute replace(pg_get_functiondef('public.upsert_dog_(text,jsonb)'::regprocedure), 'private.handler_dog_check(', 'private.owner_dog_check(');
end $$;

-- save_entry / import_entries start with need_edit(): owners get through, the rules above apply.
create or replace function private.need_edit() returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not (private.can_edit() or private.is_owner()) then
    raise exception 'Your login is a %, so it can''t change shows, entries or dogs. Ask an admin to change your role.', coalesce(private.my_role(),'guest');
  end if;
end $$;

-- ---- the admin view ----
create or replace function public.team_list()
returns table(email text, name text, role text, added_at timestamptz, last_sign_in timestamptz, has_login boolean, dogs int)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'Only admins can see the user list.'; end if;
  return query
    select x.email, x.name, x.role, x.added_at, x.last_sign_in, x.has_login,
           (select count(*)::int from public.dogs d where x.email = any(d.owner_emails))
    from (select coalesce(t.email, lower(u.email)::text) email, coalesce(t.name,'') name, t.role, t.added_at, u.last_sign_in_at last_sign_in, u.id is not null has_login
          from public.team_members t full join auth.users u on lower(u.email) = t.email
          where coalesce(t.email, u.email) is not null) x
    order by x.role is null, case x.role when 'admin' then 0 when 'organiser' then 1 when 'steward' then 2 when 'owner' then 3 else 4 end, 1;
end $$;

create or replace function public.set_team_member(p_email text, p_role text, p_name text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_email text := lower(trim(coalesce(p_email,''))); v_old text;
begin
  if not private.is_admin() then raise exception 'Only admins can change roles.'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Type a valid email.'; end if;
  if p_role not in ('admin','organiser','steward','viewer','owner') then raise exception 'Pick a role.'; end if;
  select role into v_old from public.team_members where email = v_email for update;
  if v_email = lower(auth.jwt()->>'email') and p_role <> 'admin' then
    raise exception 'You can''t take admin away from yourself. Ask another admin to do it.'; end if;
  insert into public.team_members(email, name, role) values (v_email, coalesce(trim(p_name),''), p_role)
  on conflict (email) do update set role = excluded.role, name = coalesce(nullif(trim(p_name),''), public.team_members.name);
  if not exists (select 1 from public.team_members where role = 'admin') then
    raise exception 'The club needs at least one admin.'; end if;
end $$;

-- ---- clean up what only handlers used ----
drop function if exists private.handler_dog_rules();
drop function if exists private.handler_entry_rules();
drop function if exists private.handler_dog_check(text);
drop function if exists private.is_handler();
drop index if exists public.dogs_handler_emails_idx;
alter table public.dogs drop column if exists handler_emails;
