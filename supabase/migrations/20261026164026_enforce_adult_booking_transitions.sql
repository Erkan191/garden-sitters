create or replace function public.require_adults_for_accepted_request()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if new.status = 'accepted'::public.request_status
     and old.status is distinct from new.status then
    if not exists (
      select 1
      from public.profiles p
      where p.id = new.owner_id
        and p.age_confirmed_at is not null
    ) then
      raise exception 'The owner must confirm they are 18 or over';
    end if;

    if not exists (
      select 1
      from public.offers o
      join public.profiles p on p.id = o.gardener_id
      where o.request_id = new.id
        and o.status = 'accepted'::public.offer_status
        and p.age_confirmed_at is not null
    ) then
      raise exception 'The gardener must confirm they are 18 or over';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists care_requests_require_adults_before_acceptance
on public.care_requests;
create trigger care_requests_require_adults_before_acceptance
before update of status on public.care_requests
for each row execute function public.require_adults_for_accepted_request();

create or replace function public.require_adults_for_booking()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = new.owner_id
      and p.age_confirmed_at is not null
  ) then
    raise exception 'The owner must confirm they are 18 or over';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = new.gardener_id
      and p.age_confirmed_at is not null
  ) then
    raise exception 'The gardener must confirm they are 18 or over';
  end if;

  return new;
end;
$$;

drop trigger if exists bookings_require_adults on public.bookings;
create trigger bookings_require_adults
before insert or update of owner_id, gardener_id on public.bookings
for each row execute function public.require_adults_for_booking();

revoke all on function public.require_adults_for_accepted_request()
from public, anon, authenticated;
revoke all on function public.require_adults_for_booking()
from public, anon, authenticated;

alter function public.set_updated_at()
set search_path = pg_catalog, public;
