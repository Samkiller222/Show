-- Team roles (admin view, users.html).
--   admin     : everything, plus see users and change roles
--   organiser : everything except users (what every team login could do before roles)
--   steward   : read everything, record awards only (live_results)
--   viewer    : read only
-- Enforced in the database: row level security on every table, and the role
-- functions below are the only way to change team_members.

alter table public.team_members add column if not exists role text not null default 'organiser';
alter table public.team_members drop constraint if exists team_members_role_check;
alter table public.team_members add constraint team_members_role_check
  check (role in ('admin','organiser','steward','viewer'));

-- Sam owns the club's setup.
update public.team_members set role = 'admin' where email = 'sammicallef12@gmail.com';

-- ---- who am I ----
create or replace function private.my_role() returns text
language sql stable security definer set search_path = '' as $$
  select role from public.team_members where email = lower(coalesce(auth.jwt()->>'email',''));
$$;
create or replace function private.can_edit() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(private.my_role() in ('admin','organiser'), false);
$$;
create or replace function private.can_award() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(private.my_role() in ('admin','organiser','steward'), false);
$$;
create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(private.my_role() = 'admin', false);
$$;
grant usage on schema private to authenticated;
grant execute on function private.my_role(), private.can_edit(), private.can_award(), private.is_admin() to authenticated;

-- ---- write policies: organisers and admins change shows, entries, dogs, breeds ----
alter policy "Team adds breeds"     on public.breeds  with check (private.can_edit());
alter policy "Team changes breeds"  on public.breeds  using (private.can_edit()) with check (private.can_edit());
alter policy "Team adds dogs"       on public.dogs    with check (private.can_edit());
alter policy "Team changes dogs"    on public.dogs    using (private.can_edit()) with check (private.can_edit());
alter policy "Team adds entries"    on public.entries with check (private.can_edit());
alter policy "Team changes entries" on public.entries using (private.can_edit()) with check (private.can_edit());
alter policy "Team removes entries" on public.entries using (private.can_edit());
alter policy "Team adds shows"      on public.shows   with check (private.can_edit());
alter policy "Team changes shows"   on public.shows   using (private.can_edit()) with check (private.can_edit());
-- stewards can also record awards
alter policy "Team adds results"    on public.live_results with check (private.can_award());
alter policy "Team changes results" on public.live_results using (private.can_award()) with check (private.can_award());
-- reading stays open to every role (private.is_team()).

-- Clear messages instead of a bare row level security error.
create or replace function public.sync_state(p_show text, p_changes jsonb, p_since bigint)
 returns jsonb language plpgsql set search_path to '' as $function$
declare v_show uuid := public.show_id_for(p_show);
        v_now bigint := (extract(epoch from clock_timestamp()) * 1000)::bigint;
        c jsonb;
begin
  if jsonb_array_length(coalesce(p_changes,'[]'::jsonb)) > 0 and not private.can_award() then
    raise exception 'Your login is a viewer, so it can''t record awards. Ask an admin to change your role.';
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

create or replace function private.need_edit() returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.can_edit() then
    raise exception 'Your login is a %, so it can''t change shows, entries or dogs. Ask an admin to change your role.', coalesce(private.my_role(),'guest');
  end if;
end $$;
grant execute on function private.need_edit() to authenticated;

do $$ declare f text; begin
  -- prepend the check to save_entry and import_entries without retyping them
  foreach f in array array['public.save_entry(text,jsonb,jsonb)','public.import_entries(text,jsonb)'] loop
    if position('private.need_edit()' in pg_get_functiondef(f::regprocedure)) = 0 then
      execute regexp_replace(pg_get_functiondef(f::regprocedure), '\nbegin\n', E'\nbegin\n  perform private.need_edit();\n');
    end if;
  end loop;
end $$;

-- ---- the admin view ----
-- My own role (every page uses it to hide what the login can't do).
create or replace function public.my_role() returns text
language sql stable security definer set search_path = '' as $$ select private.my_role(); $$;

-- Every team member, plus logins that exist but aren't on the team yet.
create or replace function public.team_list()
returns table(email text, name text, role text, added_at timestamptz, last_sign_in timestamptz, has_login boolean)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'Only admins can see the user list.'; end if;
  return query
    select coalesce(t.email, lower(u.email)::text), coalesce(t.name,''), t.role, t.added_at, u.last_sign_in_at, u.id is not null
    from public.team_members t
    full join auth.users u on lower(u.email) = t.email
    where coalesce(t.email, u.email) is not null
    order by t.role is null, case t.role when 'admin' then 0 when 'organiser' then 1 when 'steward' then 2 else 3 end, 1;
end $$;

-- Add someone to the team, or change their role and name. Refuses to leave the club without an admin.
create or replace function public.set_team_member(p_email text, p_role text, p_name text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_email text := lower(trim(coalesce(p_email,''))); v_old text;
begin
  if not private.is_admin() then raise exception 'Only admins can change roles.'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Type a valid email.'; end if;
  if p_role not in ('admin','organiser','steward','viewer') then raise exception 'Pick a role.'; end if;
  select role into v_old from public.team_members where email = v_email for update;
  if v_email = lower(auth.jwt()->>'email') and p_role <> 'admin' then
    raise exception 'You can''t take admin away from yourself. Ask another admin to do it.'; end if;
  insert into public.team_members(email, name, role) values (v_email, coalesce(trim(p_name),''), p_role)
  on conflict (email) do update set role = excluded.role, name = coalesce(nullif(trim(p_name),''), public.team_members.name);
  if not exists (select 1 from public.team_members where role = 'admin') then
    raise exception 'The club needs at least one admin.'; end if;
end $$;

-- Take someone off the team (their login stays but can't see anything).
create or replace function public.remove_team_member(p_email text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_email text := lower(trim(coalesce(p_email,'')));
begin
  if not private.is_admin() then raise exception 'Only admins can remove people.'; end if;
  if v_email = lower(auth.jwt()->>'email') then raise exception 'You can''t remove yourself.'; end if;
  delete from public.team_members where email = v_email;
  if not exists (select 1 from public.team_members where role = 'admin') then
    raise exception 'The club needs at least one admin.'; end if;
end $$;

revoke execute on function public.team_list(), public.set_team_member(text,text,text), public.remove_team_member(text), public.my_role() from public, anon;
grant execute on function public.team_list(), public.set_team_member(text,text,text), public.remove_team_member(text), public.my_role() to authenticated;
