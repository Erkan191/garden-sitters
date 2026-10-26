-- The international-market migration added country/currency-aware columns,
-- while the existing browser roles still only had privileges for the legacy
-- GBP columns. Keep the existing RLS ownership/status policies and grant only
-- the additional columns used by the current forms.

grant insert (role, country, currency)
on table public.profiles
to authenticated;

grant update (role, country, currency)
on table public.profiles
to authenticated;

grant insert (
  price_offered,
  country,
  currency,
  invited_gardener_id,
  invitation_status
)
on table public.care_requests
to authenticated;

grant update (price_offered)
on table public.care_requests
to authenticated;

grant insert (proposed_price, country, currency, status)
on table public.offers
to authenticated;
