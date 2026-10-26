alter table public.profiles
  add column if not exists age_confirmed_at timestamptz;

grant insert (age_confirmed_at)
on table public.profiles
to authenticated;

grant update (age_confirmed_at)
on table public.profiles
to authenticated;

alter type public.booking_status add value if not exists 'refunded' after 'paid';

alter table public.bookings
  add column if not exists refund_status text not null default 'none',
  add column if not exists refund_amount numeric not null default 0,
  add column if not exists refunded_at timestamptz,
  add column if not exists stripe_refund_id text,
  add column if not exists dispute_status text not null default 'none',
  add column if not exists stripe_dispute_id text,
  add column if not exists dispute_reason text,
  add column if not exists disputed_at timestamptz,
  add column if not exists payment_failure_reason text;

alter table public.bookings
  add constraint bookings_refund_status_check
    check (refund_status in ('none', 'pending', 'partial', 'full', 'failed')),
  add constraint bookings_refund_amount_check
    check (refund_amount >= 0),
  add constraint bookings_dispute_status_check
    check (dispute_status in ('none', 'needs_response', 'under_review', 'won', 'lost', 'warning_closed'));

create or replace function public.normalise_public_area(
  p_country text,
  p_area text
)
returns text
language plpgsql
immutable
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_area text := nullif(regexp_replace(trim(p_area), '\s+', ' ', 'g'), '');
begin
  if v_area is null then
    return null;
  end if;

  v_area := left(v_area, 80);

  if upper(coalesce(p_country, '')) = 'GB' then
    v_area := upper(v_area);

    if v_area ~ '^[A-Z]{1,2}[0-9][A-Z0-9]?\s*[0-9][A-Z]{2}$' then
      v_area := regexp_replace(v_area, '\s*[0-9][A-Z]{2}$', '');
    end if;
  end if;

  return v_area;
end;
$$;

create or replace function public.keep_request_location_broad()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  new.postcode := public.normalise_public_area(new.country, new.postcode);
  return new;
end;
$$;

drop trigger if exists care_requests_keep_location_broad on public.care_requests;
create trigger care_requests_keep_location_broad
before insert or update of postcode, country on public.care_requests
for each row execute function public.keep_request_location_broad();

update public.care_requests
set postcode = public.normalise_public_area(country, postcode)
where postcode is distinct from public.normalise_public_area(country, postcode);

create or replace function public.current_user_is_adult()
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.age_confirmed_at is not null
  );
$$;

revoke all on function public.normalise_public_area(text, text) from public, anon, authenticated;
revoke all on function public.keep_request_location_broad() from public, anon, authenticated;
revoke all on function public.current_user_is_adult() from public, anon;
grant execute on function public.current_user_is_adult() to authenticated;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_country text := upper(coalesce(new.raw_user_meta_data ->> 'country', 'GB'));
  v_role public.user_role := case
    when new.raw_user_meta_data ->> 'signup_intent' = 'gardener'
      then 'gardener'::public.user_role
    else 'owner'::public.user_role
  end;
begin
  if v_country not in ('GB', 'AU', 'NZ') then
    v_country := 'GB';
  end if;

  insert into public.profiles (id, role, country, currency, age_confirmed_at)
  values (
    new.id,
    v_role,
    v_country,
    case v_country when 'AU' then 'AUD' when 'NZ' then 'NZD' else 'GBP' end,
    case
      when coalesce(new.raw_user_meta_data ->> 'age_confirmed', 'false') = 'true'
        then now()
      else null
    end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user_profile() from public, anon, authenticated;

drop policy if exists "Owners can create open requests" on public.care_requests;
create policy "Owners can create open requests"
on public.care_requests
for insert
to authenticated
with check (
  (select auth.uid()) = owner_id
  and public.current_user_is_adult()
  and status = 'open'::public.request_status
  and (invited_gardener_id is null or invited_gardener_id <> (select auth.uid()))
);

drop policy if exists "Gardeners can create pending offers on open requests" on public.offers;
create policy "Gardeners can create pending offers on open requests"
on public.offers
for insert
to authenticated
with check (
  (select auth.uid()) = gardener_id
  and public.current_user_is_adult()
  and status = 'pending'::public.offer_status
  and exists (
    select 1
    from public.care_requests r
    where r.id = offers.request_id
      and r.status = 'open'::public.request_status
      and r.owner_id <> (select auth.uid())
      and (
        r.invited_gardener_id is null
        or (
          r.invited_gardener_id = (select auth.uid())
          and r.invitation_status = 'pending'
        )
      )
  )
);

drop policy if exists "Participants can send messages" on public.messages;
create policy "Participants can send messages"
on public.messages
for insert
to authenticated
with check (
  (select auth.uid()) = sender_id
  and public.current_user_is_adult()
  and public.user_can_access_request_chat(request_id, (select auth.uid()))
);

drop policy if exists "Owner can create booking" on public.bookings;
create policy "Owner can create booking"
on public.bookings
for insert
to authenticated
with check (
  (select auth.uid()) = owner_id
  and public.current_user_is_adult()
);

drop policy if exists "Completed booking participants can insert reviews" on public.reviews;
drop policy if exists "Insert review (participants only)" on public.reviews;
create policy "Completed booking participants can insert reviews"
on public.reviews
for insert
to authenticated
with check (
  reviewer_id = (select auth.uid())
  and public.current_user_is_adult()
  and exists (
    select 1
    from public.bookings b
    where b.id = reviews.booking_id
      and b.status = 'completed'::public.booking_status
      and (
        (b.owner_id = (select auth.uid()) and reviews.reviewee_id = b.gardener_id)
        or
        (b.gardener_id = (select auth.uid()) and reviews.reviewee_id = b.owner_id)
      )
  )
);

revoke all on function public.accept_offer_safely(uuid, uuid) from public, anon;
grant execute on function public.accept_offer_safely(uuid, uuid) to authenticated;

revoke all on function public.mark_request_chat_read(uuid) from public, anon;
grant execute on function public.mark_request_chat_read(uuid) to authenticated;
