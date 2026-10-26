alter table public.bookings
  add column if not exists terms_version text,
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists cancellation_policy_version text,
  add column if not exists cancellation_policy_accepted_at timestamptz,
  add column if not exists early_performance_requested_at timestamptz,
  add column if not exists confirmation_email_sent_at timestamptz;

comment on column public.bookings.terms_version is
  'Version of the Watch My Plot terms accepted immediately before Checkout.';
comment on column public.bookings.cancellation_policy_version is
  'Version of the cancellation policy shown immediately before Checkout.';
comment on column public.bookings.early_performance_requested_at is
  'Records the owner request for agreed work to begin within a statutory cancellation period where applicable.';
comment on column public.bookings.confirmation_email_sent_at is
  'When the durable booking and cancellation confirmation was sent to both participants.';
