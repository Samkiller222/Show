-- Audit fixes (5 Nov 2026). Needs 20261105_handler_owner_roles.sql.
-- Owners and handlers can't withdraw an entry that has been paid, or swap a paid entry
-- over to a different dog: the money would no longer match an entry. Organisers still can.

create or replace function private.handler_entry_rules() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_show uuid := case when tg_op = 'DELETE' then old.show_id else new.show_id end;
begin
  if not private.is_handler() then return coalesce(new, old); end if;
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
