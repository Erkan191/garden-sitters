alter table public.profiles
  add column if not exists country text not null default 'GB',
  add column if not exists currency text not null default 'GBP',
  add column if not exists price_per_visit numeric;

alter table public.care_requests
  add column if not exists country text not null default 'GB',
  add column if not exists currency text not null default 'GBP',
  add column if not exists price_offered numeric;

alter table public.offers
  add column if not exists country text not null default 'GB',
  add column if not exists currency text not null default 'GBP',
  add column if not exists proposed_price numeric;

alter table public.bookings
  add column if not exists country text not null default 'GB',
  add column if not exists currency text not null default 'GBP',
  add column if not exists amount numeric,
  add column if not exists platform_fee numeric;

update public.profiles
set price_per_visit = price_per_visit_gbp
where price_per_visit is null and price_per_visit_gbp is not null;

update public.care_requests
set price_offered = price_offered_gbp
where price_offered is null and price_offered_gbp is not null;

update public.offers
set proposed_price = proposed_price_gbp
where proposed_price is null and proposed_price_gbp is not null;

update public.bookings
set amount = amount_gbp,
    platform_fee = platform_fee_gbp
where amount is null or platform_fee is null;

alter table public.profiles
  add constraint profiles_country_check check (country in ('GB', 'AU', 'NZ')),
  add constraint profiles_currency_check check (currency in ('GBP', 'AUD', 'NZD')),
  add constraint profiles_country_currency_check check (
    (country = 'GB' and currency = 'GBP') or
    (country = 'AU' and currency = 'AUD') or
    (country = 'NZ' and currency = 'NZD')
  );

alter table public.care_requests
  add constraint care_requests_country_check check (country in ('GB', 'AU', 'NZ')),
  add constraint care_requests_currency_check check (currency in ('GBP', 'AUD', 'NZD')),
  add constraint care_requests_country_currency_check check (
    (country = 'GB' and currency = 'GBP') or
    (country = 'AU' and currency = 'AUD') or
    (country = 'NZ' and currency = 'NZD')
  );

alter table public.offers
  add constraint offers_country_check check (country in ('GB', 'AU', 'NZ')),
  add constraint offers_currency_check check (currency in ('GBP', 'AUD', 'NZD')),
  add constraint offers_country_currency_check check (
    (country = 'GB' and currency = 'GBP') or
    (country = 'AU' and currency = 'AUD') or
    (country = 'NZ' and currency = 'NZD')
  );

alter table public.bookings
  add constraint bookings_country_check check (country in ('GB', 'AU', 'NZ')),
  add constraint bookings_currency_check check (currency in ('GBP', 'AUD', 'NZD')),
  add constraint bookings_country_currency_check check (
    (country = 'GB' and currency = 'GBP') or
    (country = 'AU' and currency = 'AUD') or
    (country = 'NZ' and currency = 'NZD')
  );

create or replace function public.sync_and_validate_market_fields()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  expected_currency text;
  owner_country text;
  request_country text;
  request_currency text;
  request_owner_id uuid;
  invited_country text;
  gardener_country text;
  offer_request_id uuid;
  offer_gardener_id uuid;
begin
  expected_currency := case new.country
    when 'GB' then 'GBP'
    when 'AU' then 'AUD'
    when 'NZ' then 'NZD'
    else null
  end;

  if expected_currency is null or new.currency <> expected_currency then
    raise exception 'Country and currency do not describe a supported Watch My Plot market';
  end if;

  if tg_table_name = 'profiles' then
    if tg_op = 'INSERT' then
      new.price_per_visit := coalesce(new.price_per_visit, new.price_per_visit_gbp);
    elsif new.price_per_visit is distinct from old.price_per_visit then
      null;
    elsif new.price_per_visit_gbp is distinct from old.price_per_visit_gbp then
      new.price_per_visit := new.price_per_visit_gbp;
    end if;
    new.price_per_visit_gbp := new.price_per_visit;
    return new;
  end if;

  if tg_table_name = 'care_requests' then
    select p.country into owner_country
    from public.profiles p
    where p.id = new.owner_id;

    if owner_country is null or owner_country <> new.country then
      raise exception 'Request country must match the owner profile country';
    end if;

    if new.invited_gardener_id is not null then
      select p.country into invited_country
      from public.profiles p
      where p.id = new.invited_gardener_id;

      if invited_country is null or invited_country <> new.country then
        raise exception 'Direct requests can only be sent to gardeners in the same country';
      end if;
    end if;

    if tg_op = 'INSERT' then
      new.price_offered := coalesce(new.price_offered, new.price_offered_gbp);
    elsif new.price_offered is distinct from old.price_offered then
      null;
    elsif new.price_offered_gbp is distinct from old.price_offered_gbp then
      new.price_offered := new.price_offered_gbp;
    end if;
    new.price_offered_gbp := new.price_offered;
    return new;
  end if;

  if tg_table_name = 'offers' then
    select r.country, r.currency into request_country, request_currency
    from public.care_requests r
    where r.id = new.request_id;

    select p.country into gardener_country
    from public.profiles p
    where p.id = new.gardener_id;

    if request_country is null or request_country <> new.country or request_currency <> new.currency then
      raise exception 'Offer market must match the request market';
    end if;
    if gardener_country is null or gardener_country <> new.country then
      raise exception 'Gardeners can only offer on requests in their country';
    end if;

    if tg_op = 'INSERT' then
      new.proposed_price := coalesce(new.proposed_price, new.proposed_price_gbp);
    elsif new.proposed_price is distinct from old.proposed_price then
      null;
    elsif new.proposed_price_gbp is distinct from old.proposed_price_gbp then
      new.proposed_price := new.proposed_price_gbp;
    end if;
    new.proposed_price_gbp := new.proposed_price;
    return new;
  end if;

  if tg_table_name = 'bookings' then
    select r.country, r.currency, r.owner_id
      into request_country, request_currency, request_owner_id
    from public.care_requests r
    where r.id = new.request_id;

    select o.request_id, o.gardener_id
      into offer_request_id, offer_gardener_id
    from public.offers o
    where o.id = new.offer_id;

    select p.country into gardener_country
    from public.profiles p
    where p.id = new.gardener_id;

    if request_country is null or request_country <> new.country or request_currency <> new.currency then
      raise exception 'Booking market must match the request market';
    end if;
    if request_owner_id <> new.owner_id then
      raise exception 'Booking owner must match the request owner';
    end if;
    if offer_request_id <> new.request_id or offer_gardener_id <> new.gardener_id then
      raise exception 'Booking offer must belong to the request and gardener';
    end if;
    if gardener_country is null or gardener_country <> new.country then
      raise exception 'Cross-country bookings are not allowed';
    end if;

    if tg_op = 'INSERT' then
      new.amount := coalesce(new.amount, new.amount_gbp);
      new.platform_fee := coalesce(new.platform_fee, new.platform_fee_gbp);
    else
      if new.amount is not distinct from old.amount and new.amount_gbp is distinct from old.amount_gbp then
        new.amount := new.amount_gbp;
      end if;
      if new.platform_fee is not distinct from old.platform_fee and new.platform_fee_gbp is distinct from old.platform_fee_gbp then
        new.platform_fee := new.platform_fee_gbp;
      end if;
    end if;
    new.amount_gbp := new.amount;
    new.platform_fee_gbp := new.platform_fee;
    return new;
  end if;

  return new;
end;
$$;

create trigger profiles_sync_market_fields
before insert or update on public.profiles
for each row execute function public.sync_and_validate_market_fields();

create trigger care_requests_sync_market_fields
before insert or update on public.care_requests
for each row execute function public.sync_and_validate_market_fields();

create trigger offers_sync_market_fields
before insert or update on public.offers
for each row execute function public.sync_and_validate_market_fields();

create trigger bookings_sync_market_fields
before insert or update on public.bookings
for each row execute function public.sync_and_validate_market_fields();

create index if not exists profiles_country_role_idx
  on public.profiles (country, role);

create index if not exists care_requests_country_status_created_idx
  on public.care_requests (country, status, created_at desc);

comment on column public.profiles.country is 'ISO 3166-1 alpha-2 market: GB, AU, or NZ.';
comment on column public.profiles.currency is 'ISO 4217 currency derived from country.';
comment on column public.care_requests.country is 'Market copied from the owner profile when the request is created.';
comment on column public.bookings.currency is 'Currency used for the connected-account direct charge.';
