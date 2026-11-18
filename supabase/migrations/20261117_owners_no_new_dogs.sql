-- Owners can't register new dogs (17 Nov 2026). Sam: "owners can't register new dogs, only register already
-- assigned dogs to shows". Only organisers and admins add dogs to the club register and link them to owners
-- (Club dogs, "Owner logins"). Owners still enter their own linked dogs into Open shows and can fill in
-- details (sex, date of birth, pedigree, contact) of those dogs, but can't add a dog or a breed.
--
-- Safe to run before or after 20261106_remove_handler_role.sql: it only uses can_edit(), my_dog() and
-- my_email(), which exist in both, and that file has been changed to keep the same rule.

-- 1. The table: only organisers and admins insert dogs.
alter policy "Team adds dogs" on public.dogs
  with check (private.can_edit());

-- 2. upsert_dog_ (called by save_entry and import_entries): an owner only ever updates one of their own dogs.
create or replace function public.upsert_dog_(p_name text, p_dog jsonb)
returns void language plpgsql set search_path = '' as $$
declare v_name text := trim(coalesce(p_name,''));
        v_breed text := trim(coalesce(p_dog->>'Breed','')); v_group text := trim(coalesce(p_dog->>'Group',''));
        v_known text;
begin
  if v_name = '' then return; end if;
  select name into v_known from public.breeds where lower(name) = lower(v_breed);

  if not private.can_edit() then
    if not private.my_dog(v_name) then
      if exists (select 1 from public.dogs where lower(name) = lower(v_name)) then
        raise exception 'A dog called % is already in the club register but isn''t linked to your login. Ask an organiser to link it.', v_name;
      end if;
      raise exception 'Owners can''t register new dogs. Ask an organiser to add % to the club register and link it to your login.', v_name;
    end if;
    if v_breed <> '' and v_known is null then
      raise exception 'Only organisers can add a new breed.'; end if;
    update public.dogs d set
      breed   = coalesce(v_known, d.breed),
      sex     = coalesce(nullif(p_dog->>'Sex',''), d.sex),
      dob     = coalesce(nullif(p_dog->>'Date of birth',''), d.dob),
      owner   = coalesce(nullif(p_dog->>'Owner',''), d.owner),
      phone   = coalesce(nullif(p_dog->>'Phone',''), d.phone),
      address = coalesce(nullif(p_dog->>'Address',''), d.address),
      breeder = coalesce(nullif(p_dog->>'Breeder',''), d.breeder),
      sire    = coalesce(nullif(p_dog->>'Sire',''), d.sire),
      dam     = coalesce(nullif(p_dog->>'Dam',''), d.dam)
    where lower(d.name) = lower(v_name);
    return;
  end if;

  -- organisers and admins: add or update, as before
  if v_breed = '' then return; end if;
  if v_known is null then
    if v_group = '' then raise exception 'Pick a group for the new breed %.', v_breed; end if;
    insert into public.breeds(name, grp) values (v_breed, v_group);
    v_known := v_breed;
  end if;
  insert into public.dogs as d (name, breed, sex, dob, owner, phone, address, breeder, sire, dam)
  values (v_name, v_known, coalesce(nullif(p_dog->>'Sex',''),''), coalesce(p_dog->>'Date of birth',''), coalesce(p_dog->>'Owner',''),
          coalesce(p_dog->>'Phone',''), coalesce(p_dog->>'Address',''), coalesce(p_dog->>'Breeder',''), coalesce(p_dog->>'Sire',''), coalesce(p_dog->>'Dam',''))
  on conflict (lower(name)) do update set
    breed   = excluded.breed,
    sex     = coalesce(nullif(excluded.sex,''), d.sex),
    dob     = coalesce(nullif(excluded.dob,''), d.dob),
    owner   = coalesce(nullif(excluded.owner,''), d.owner),
    phone   = coalesce(nullif(excluded.phone,''), d.phone),
    address = coalesce(nullif(excluded.address,''), d.address),
    breeder = coalesce(nullif(excluded.breeder,''), d.breeder),
    sire    = coalesce(nullif(excluded.sire,''), d.sire),
    dam     = coalesce(nullif(excluded.dam,''), d.dam);
end $$;
