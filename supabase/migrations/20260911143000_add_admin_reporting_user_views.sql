create schema if not exists admin_reporting;

revoke all on schema admin_reporting from public;
revoke all on schema admin_reporting from anon;
revoke all on schema admin_reporting from authenticated;

create or replace view admin_reporting.registered_app_users
with (security_invoker = true)
as
with
request_stats as (
  select
    owner_id as user_id,
    count(*)::integer as requests_posted,
    max(created_at) as latest_request_at
  from public.care_requests
  group by owner_id
),
offer_stats as (
  select
    gardener_id as user_id,
    count(*)::integer as offers_sent,
    max(created_at) as latest_offer_at
  from public.offers
  group by gardener_id
),
owner_booking_stats as (
  select
    owner_id as user_id,
    count(*)::integer as bookings_as_owner,
    max(created_at) as latest_owner_booking_at
  from public.bookings
  group by owner_id
),
gardener_booking_stats as (
  select
    gardener_id as user_id,
    count(*)::integer as bookings_as_gardener,
    max(created_at) as latest_gardener_booking_at
  from public.bookings
  group by gardener_id
)
select
  u.id as user_id,
  u.email,
  u.created_at as registered_at,
  u.last_sign_in_at,
  u.email_confirmed_at is not null as email_confirmed,
  coalesce(nullif(trim(p.full_name), ''), nullif(trim(p.display_name), '')) as name,
  coalesce(nullif(trim(p.location), ''), nullif(trim(p.postcode), '')) as location_or_postcode,
  coalesce(p.role::text, 'missing_profile') as profile_role,
  case
    when u.raw_user_meta_data ->> 'signup_intent' = 'gardener' then 'gardener'
    else 'owner'
  end as signup_intent,
  coalesce(u.raw_user_meta_data ->> 'signup_intent' = 'gardener', false) as signed_up_via_gardener_journey,
  coalesce(
    u.raw_user_meta_data ->> 'signup_intent' = 'gardener'
    or p.role in ('gardener'::public.user_role, 'both'::public.user_role)
    or p.stripe_account_id is not null
    or os.offers_sent > 0
    or gbs.bookings_as_gardener > 0,
    false
  ) as is_gardener,
  coalesce(
    nullif(trim(p.full_name), '') is not null
    or nullif(trim(p.display_name), '') is not null,
    false
  ) as has_profile_name,
  coalesce(nullif(trim(p.bio), '') is not null, false) as has_bio,
  coalesce(
    p.skill_watering
    or p.skill_harvesting
    or p.skill_greenhouse
    or p.skill_veg_beds
    or p.skill_pots
    or p.skill_seedlings
    or cardinality(coalesce(p.skills, '{}')) > 0,
    false
  ) as has_gardening_skills,
  coalesce(p.stripe_account_id is not null, false) as stripe_started,
  coalesce(p.stripe_onboarding_complete, false) as stripe_connected,
  coalesce(rs.requests_posted, 0) as requests_posted,
  coalesce(os.offers_sent, 0) as offers_sent,
  coalesce(obs.bookings_as_owner, 0) as bookings_as_owner,
  coalesce(gbs.bookings_as_gardener, 0) as bookings_as_gardener,
  greatest(
    u.created_at,
    u.last_sign_in_at,
    p.updated_at,
    rs.latest_request_at,
    os.latest_offer_at,
    obs.latest_owner_booking_at,
    gbs.latest_gardener_booking_at
  ) as latest_activity_at
from auth.users u
left join public.profiles p on p.id = u.id
left join request_stats rs on rs.user_id = u.id
left join offer_stats os on os.user_id = u.id
left join owner_booking_stats obs on obs.user_id = u.id
left join gardener_booking_stats gbs on gbs.user_id = u.id
where u.deleted_at is null;

create or replace view admin_reporting.gardener_signups
with (security_invoker = true)
as
select
  user_id,
  email,
  registered_at,
  case
    when signed_up_via_gardener_journey then 'signed up through gardener journey'
    when offers_sent > 0 then 'sent a gardener offer'
    when stripe_started then 'started Stripe payouts'
    when bookings_as_gardener > 0 then 'booked as gardener'
    when profile_role in ('gardener', 'both') then 'profile role'
    else 'gardener signal'
  end as gardener_status_source,
  name,
  location_or_postcode,
  profile_role,
  signup_intent,
  signed_up_via_gardener_journey,
  has_profile_name,
  has_bio,
  has_gardening_skills,
  stripe_started,
  stripe_connected,
  offers_sent,
  bookings_as_gardener,
  last_sign_in_at,
  latest_activity_at
from admin_reporting.registered_app_users
where is_gardener;

revoke all on table admin_reporting.registered_app_users from public;
revoke all on table admin_reporting.registered_app_users from anon;
revoke all on table admin_reporting.registered_app_users from authenticated;
revoke all on table admin_reporting.gardener_signups from public;
revoke all on table admin_reporting.gardener_signups from anon;
revoke all on table admin_reporting.gardener_signups from authenticated;
