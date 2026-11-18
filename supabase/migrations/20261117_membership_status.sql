-- Owner membership status (17 Nov 2026).
-- Every owner login has a club membership status that admins and organisers keep up to date
-- on memberships.html, and that the owner sees in their menu.
--   active  : paid-up member (until membership_expires, if set; after that date it reads as expired)
--   pending : waiting to join or renew (new owners start here)
--   expired : membership lapsed
-- The status is information only: it does not stop owners entering dogs or paying.
-- Needs 20261106_remove_handler_role.sql. No edge function redeploy needed.

alter table public.team_members add column if not exists membership text not null default 'active';
alter table public.team_members add column if not exists membership_expires date;
alter table public.team_members add column if not exists membership_note text not null default '';
alter table public.team_members add column if not exists membership_updated_at timestamptz;
alter table public.team_members add column if not exists membership_updated_by text;
alter table public.team_members drop constraint if exists team_members_membership_check;
alter table public.team_members add constraint team_members_membership_check
  check (membership in ('active','pending','expired'));
-- Owners already on the site stay active; anyone added from now on starts as pending.
alter table public.team_members alter column membership set default 'pending';

-- active past its end date counts as expired
create or replace function private.membership_now(p_status text, p_expires date) returns text
language sql stable set search_path = '' as $$
  select case when p_status = 'active' and p_expires is not null and p_expires < (now() at time zone 'Europe/Malta')::date
              then 'expired' else p_status end;
$$;
grant execute on function private.membership_now(text, date) to authenticated;

-- ---- the signed-in owner's own membership ----
create or replace function public.my_membership() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('status', private.membership_now(t.membership, t.membership_expires),
                            'saved', t.membership, 'expires', t.membership_expires)
  from public.team_members t
  where t.email = lower(coalesce(auth.jwt()->>'email','')) and t.role = 'owner';
$$;

-- ---- admins and organisers: every owner with their membership ----
create or replace function public.owner_memberships()
returns table(email text, name text, dogs int, has_login boolean, status text, saved text, expires date, note text,
              updated_at timestamptz, updated_by text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.can_edit() then raise exception 'Only admins and organisers can see memberships.'; end if;
  return query
    select t.email, coalesce(t.name,''), (select count(*)::int from public.dogs d where t.email = any(d.owner_emails)),
           exists (select 1 from auth.users u where lower(u.email) = t.email),
           private.membership_now(t.membership, t.membership_expires), t.membership, t.membership_expires,
           t.membership_note, t.membership_updated_at, t.membership_updated_by
    from public.team_members t where t.role = 'owner'
    order by lower(coalesce(nullif(t.name,''), t.email));
end $$;

create or replace function public.set_membership(p_email text, p_status text, p_expires date default null, p_note text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_email text := lower(trim(coalesce(p_email,'')));
begin
  if not private.can_edit() then raise exception 'Only admins and organisers can change memberships.'; end if;
  if p_status not in ('active','pending','expired') then raise exception 'Pick active, pending or expired.'; end if;
  update public.team_members
     set membership = p_status, membership_expires = p_expires,
         membership_note = coalesce(left(trim(p_note), 300), membership_note),
         membership_updated_at = now(), membership_updated_by = lower(coalesce(auth.jwt()->>'email',''))
   where email = v_email and role = 'owner';
  if not found then raise exception '% isn''t an owner login.', v_email; end if;
end $$;

revoke execute on function public.my_membership(), public.owner_memberships(), public.set_membership(text,text,date,text) from public, anon;
grant execute on function public.my_membership(), public.owner_memberships(), public.set_membership(text,text,date,text) to authenticated;

-- ---- Users and roles list: show each owner's membership too ----
drop function if exists public.team_list();
create function public.team_list()
returns table(email text, name text, role text, added_at timestamptz, last_sign_in timestamptz, has_login boolean, dogs int,
              membership text, membership_expires date)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'Only admins can see the user list.'; end if;
  return query
    select x.email, x.name, x.role, x.added_at, x.last_sign_in, x.has_login,
           (select count(*)::int from public.dogs d where x.email = any(d.owner_emails)),
           x.membership, x.membership_expires
    from (select coalesce(t.email, lower(u.email)::text) email, coalesce(t.name,'') name, t.role, t.added_at, u.last_sign_in_at last_sign_in, u.id is not null has_login,
                 case when t.role = 'owner' then private.membership_now(t.membership, t.membership_expires) end membership,
                 case when t.role = 'owner' then t.membership_expires end membership_expires
          from public.team_members t full join auth.users u on lower(u.email) = t.email
          where coalesce(t.email, u.email) is not null) x
    order by x.role is null, case x.role when 'admin' then 0 when 'organiser' then 1 when 'steward' then 2 when 'owner' then 3 else 4 end, 1;
end $$;
revoke execute on function public.team_list() from public, anon;
grant execute on function public.team_list() to authenticated;
