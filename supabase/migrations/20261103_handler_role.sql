-- Handler role: a handler sees only the dogs linked to their login, and the
-- entries of those dogs, and can enter those dogs into shows that are Open.
-- A dog is linked to one or more handler logins by email (dogs.handler_emails),
-- set by admins and organisers on the dog's page. Needs 20261103_team_roles.sql.

-- ---- the role ----
alter table public.team_members drop constraint if exists team_members_role_check;
alter table public.team_members add constraint team_members_role_check
  check (role in ('admin','organiser','steward','viewer','handler'));

-- ---- which logins handle which dog ----
alter table public.dogs add column if not exists handler_emails text[] not null default '{}';
create index if not exists dogs_handler_emails_idx on public.dogs using gin (handler_emails);

create or replace function private.my_email() returns text
language sql stable set search_path = '' as $$ select lower(coalesce(auth.jwt()->>'email','')); $$;
-- every role except handler sees the whole club
create or replace function private.sees_all() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(private.my_role() in ('admin','organiser','steward','viewer'), false);
$$;
create or replace function private.is_handler() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(private.my_role() = 'handler', false);
$$;
-- is this dog name one of my dogs? (entries link to dogs by name)
create or replace function private.my_dog(p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.dogs d
                 where lower(d.name) = lower(trim(coalesce(p_name,''))) and private.my_email() = any(d.handler_emails));
$$;
create or replace function private.show_open(p_show uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.shows where id = p_show and status = 'Open');
$$;
grant execute on function private.my_email(), private.sees_all(), private.is_handler(), private.my_dog(text), private.show_open(uuid) to authenticated;

-- ---- reading ----
-- Shows and breeds: every role (handlers need them to enter dogs). Unchanged: private.is_team().
-- Dogs: the whole register, or only my dogs for a handler.
alter policy "Team reads dogs" on public.dogs
  using (private.sees_all() or (private.is_handler() and private.my_email() = any(handler_emails)));
-- Entries: all, or only my dogs' entries for a handler.
alter policy "Team reads entries" on public.entries
  using (private.sees_all() or (private.is_handler() and private.my_dog(dog_name)));
-- Results and the team list: not for handlers.
alter policy "Team reads results" on public.live_results using (private.sees_all());
alter policy "Team can see the team list" on public.team_members using (private.sees_all());
-- Card payments (20261105_payments.sql): a handler sees only payments that include one of their dogs' entries.
do $$ begin
  if to_regclass('public.payments') is not null then
    alter policy "Team reads payments" on public.payments
      using (private.sees_all() or (private.is_handler() and exists (
        select 1 from public.entries e where e.id = any(entry_ids) and private.my_dog(e.dog_name))));
  end if;
end $$;

-- ---- writing ----
-- Dogs: handlers add dogs (linked to themselves) and change their own dogs' details.
alter policy "Team adds dogs" on public.dogs
  with check (private.can_edit() or (private.is_handler() and private.my_email() = any(handler_emails)));
alter policy "Team changes dogs" on public.dogs
  using (private.can_edit() or (private.is_handler() and private.my_email() = any(handler_emails)))
  with check (private.can_edit() or (private.is_handler() and private.my_email() = any(handler_emails)));
-- Entries: handlers enter, change and withdraw their own dogs while the show is Open.
alter policy "Team adds entries" on public.entries
  with check (private.can_edit() or (private.is_handler() and private.my_dog(dog_name) and private.show_open(show_id) and ring_no = ''));
alter policy "Team changes entries" on public.entries
  using (private.can_edit() or (private.is_handler() and private.my_dog(dog_name) and private.show_open(show_id)))
  with check (private.can_edit() or (private.is_handler() and private.my_dog(dog_name) and private.show_open(show_id)));
alter policy "Team removes entries" on public.entries
  using (private.can_edit() or (private.is_handler() and private.my_dog(dog_name) and private.show_open(show_id)));

-- Clear messages for handlers, and the rules a policy can't express.
create or replace function private.handler_dog_rules() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_handler() then return new; end if;
  if tg_op = 'INSERT' then
    new.handler_emails := array[private.my_email()];
  elsif new.handler_emails is distinct from old.handler_emails then
    raise exception 'Only organisers can change who handles a dog.';
  elsif lower(new.name) <> lower(old.name) then
    raise exception 'Only organisers can rename a dog, because its show entries follow the name.';
  end if;
  return new;
end $$;
drop trigger if exists handler_dog_rules on public.dogs;
create trigger handler_dog_rules before insert or update on public.dogs
  for each row execute function private.handler_dog_rules();

create or replace function private.handler_entry_rules() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_show uuid := case when tg_op = 'DELETE' then old.show_id else new.show_id end;
begin
  if not private.is_handler() then return coalesce(new, old); end if;
  if not private.show_open(v_show) then
    raise exception 'Entries for this show are closed. Ask an organiser.'; end if;
  if tg_op <> 'INSERT' and not private.my_dog(old.dog_name) then
    raise exception 'You can only change your own dogs'' entries.'; end if;
  if tg_op = 'DELETE' then return old; end if;
  if new.class in ('Junior Handler','Childrens Class') then
    raise exception 'Junior Handler and Childrens Class are entered by the organisers.'; end if;
  if not private.my_dog(new.dog_name) then
    raise exception '% isn''t one of your dogs. Ask an organiser to link it to your login.', new.dog_name; end if;
  if new.ring_no <> coalesce(case when tg_op = 'UPDATE' then old.ring_no end, '') then
    raise exception 'Ring numbers are given by the organisers.'; end if;
  -- payment columns (20261105_payments.sql) are set by the payments function and organisers only
  if (to_jsonb(new)->>'paid_at') is distinct from (case when tg_op = 'UPDATE' then to_jsonb(old)->>'paid_at' end)
     or (to_jsonb(new)->>'paid_via') is distinct from (case when tg_op = 'UPDATE' then to_jsonb(old)->>'paid_via' end)
     or (to_jsonb(new)->>'payment_id') is distinct from (case when tg_op = 'UPDATE' then to_jsonb(old)->>'payment_id' end) then
    raise exception 'Payments are recorded by the organisers.'; end if;
  return new;
end $$;
drop trigger if exists handler_entry_rules on public.entries;
create trigger handler_entry_rules before insert or update or delete on public.entries
  for each row execute function private.handler_entry_rules();

-- Entering a dog that is already registered to someone else: say so (a handler can't see that dog).
create or replace function private.handler_dog_check(p_name text) returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if private.is_handler() and not private.my_dog(p_name)
     and exists (select 1 from public.dogs where lower(name) = lower(trim(coalesce(p_name,'')))) then
    raise exception 'A dog called % is already in the club register but isn''t linked to your login. Ask an organiser to link it.', trim(p_name);
  end if;
end $$;
grant execute on function private.handler_dog_check(text) to authenticated;
do $$ begin
  if position('private.handler_dog_check' in pg_get_functiondef('public.upsert_dog_(text,jsonb)'::regprocedure)) = 0 then
    execute regexp_replace(pg_get_functiondef('public.upsert_dog_(text,jsonb)'::regprocedure), '\nbegin\n', E'\nbegin\n  perform private.handler_dog_check(p_name);\n');
  end if;
end $$;

-- save_entry / import_entries start with need_edit(): let handlers through, the rules above apply.
create or replace function private.need_edit() returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not (private.can_edit() or private.is_handler()) then
    raise exception 'Your login is a %, so it can''t change shows, entries or dogs. Ask an admin to change your role.', coalesce(private.my_role(),'guest');
  end if;
end $$;

-- sync_state: name the role in the message
create or replace function public.sync_state(p_show text, p_changes jsonb, p_since bigint)
 returns jsonb language plpgsql set search_path to '' as $function$
declare v_show uuid := public.show_id_for(p_show);
        v_now bigint := (extract(epoch from clock_timestamp()) * 1000)::bigint;
        c jsonb;
begin
  if jsonb_array_length(coalesce(p_changes,'[]'::jsonb)) > 0 and not private.can_award() then
    raise exception 'Your login is a %, so it can''t record awards. Ask an admin to change your role.', coalesce(private.my_role(),'guest');
  end if;
  for c in select * from jsonb_array_elements(coalesce(p_changes,'[]'::jsonb)) loop
    insert into public.live_results as r (show_id, key, value, changed_at, updated_at)
    values (v_show, c->>0, case when jsonb_typeof(c->1) = 'null' then null else c->1 end, coalesce((c->>2)::bigint, v_now), v_now)
    on conflict (show_id, key) do update set value = excluded.value, changed_at = excluded.changed_at, updated_at = excluded.updated_at
    where excluded.changed_at >= r.changed_at;
  end loop;
  return jsonb_build_object('now', v_now, 'rows', coalesce((
    select jsonb_agg(jsonb_build_array(key, value, changed_at)) from public.live_results
    where show_id = v_show and updated_at > coalesce(p_since, 0)), '[]'::jsonb));
end $function$;

-- ---- the admin view: handler is a role, and handlers show how many dogs they have ----
drop function if exists public.team_list();
create function public.team_list()
returns table(email text, name text, role text, added_at timestamptz, last_sign_in timestamptz, has_login boolean, dogs int)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'Only admins can see the user list.'; end if;
  return query
    select x.email, x.name, x.role, x.added_at, x.last_sign_in, x.has_login,
           (select count(*)::int from public.dogs d where x.email = any(d.handler_emails))
    from (select coalesce(t.email, lower(u.email)::text) email, coalesce(t.name,'') name, t.role, t.added_at, u.last_sign_in_at last_sign_in, u.id is not null has_login
          from public.team_members t full join auth.users u on lower(u.email) = t.email
          where coalesce(t.email, u.email) is not null) x
    order by x.role is null, case x.role when 'admin' then 0 when 'organiser' then 1 when 'steward' then 2 when 'handler' then 3 else 4 end, 1;
end $$;
revoke execute on function public.team_list() from public, anon;
grant execute on function public.team_list() to authenticated;

create or replace function public.set_team_member(p_email text, p_role text, p_name text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_email text := lower(trim(coalesce(p_email,''))); v_old text;
begin
  if not private.is_admin() then raise exception 'Only admins can change roles.'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Type a valid email.'; end if;
  if p_role not in ('admin','organiser','steward','viewer','handler') then raise exception 'Pick a role.'; end if;
  select role into v_old from public.team_members where email = v_email for update;
  if v_email = lower(auth.jwt()->>'email') and p_role <> 'admin' then
    raise exception 'You can''t take admin away from yourself. Ask another admin to do it.'; end if;
  insert into public.team_members(email, name, role) values (v_email, coalesce(trim(p_name),''), p_role)
  on conflict (email) do update set role = excluded.role, name = coalesce(nullif(trim(p_name),''), public.team_members.name);
  if not exists (select 1 from public.team_members where role = 'admin') then
    raise exception 'The club needs at least one admin.'; end if;
end $$;
