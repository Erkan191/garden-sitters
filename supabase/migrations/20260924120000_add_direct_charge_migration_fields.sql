alter table public.profiles
  add column if not exists stripe_legacy_account_id text,
  add column if not exists stripe_direct_charges_ready boolean not null default false;

alter table public.bookings
  add column if not exists stripe_charge_model text not null default 'separate_charges_transfers';

alter table public.bookings
  drop constraint if exists bookings_stripe_charge_model_check;

alter table public.bookings
  add constraint bookings_stripe_charge_model_check
  check (stripe_charge_model in ('separate_charges_transfers', 'direct'));

comment on column public.profiles.stripe_legacy_account_id is
  'Previous Stripe connected account retained for historical bookings during fee-model migration.';

comment on column public.profiles.stripe_direct_charges_ready is
  'True only after Stripe confirms the current connected account can take direct charges with Stripe collecting its fees.';

comment on column public.bookings.stripe_charge_model is
  'Stripe funds flow used for this booking. Existing bookings remain separate charges and transfers.';
