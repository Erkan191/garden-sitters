-- Existing role choices are settled. Only new accounts with no signup intent
-- (for example OAuth accounts) may consume a late onboarding intent once.
alter table public.profiles add column signup_role_applied boolean not null default true;
grant select (signup_role_applied) on public.profiles to authenticated;

-- Request insertion calls this pure text formatter from an invoker trigger.
-- Without EXECUTE, authenticated owners (including both-role users) cannot post.
grant execute on function public.normalise_public_area(text, text) to authenticated;

create or replace function public.handle_new_user_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_country text := upper(coalesce(new.raw_user_meta_data ->> 'country', 'GB'));
  v_intent text := new.raw_user_meta_data ->> 'signup_intent';
begin
  if v_country not in ('GB', 'AU', 'NZ') then v_country := 'GB'; end if;
  insert into public.profiles (id, role, country, currency, age_confirmed_at, signup_role_applied)
  values (
    new.id,
    case when v_intent in ('gardener', 'both') then v_intent::public.user_role else 'owner'::public.user_role end,
    v_country,
    case v_country when 'AU' then 'AUD' when 'NZ' then 'NZD' else 'GBP' end,
    case when new.raw_user_meta_data ->> 'age_confirmed' = 'true' then now() else null end,
    coalesce(v_intent in ('owner', 'gardener', 'both'), false)
  ) on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.handle_new_user_profile() from public, anon, authenticated;

-- A role explicitly saved by the user always wins over stale signup metadata.
create function public.mark_profile_role_applied()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.signup_role_applied := true;
  return new;
end;
$$;
revoke all on function public.mark_profile_role_applied() from public, anon, authenticated;
create trigger profiles_mark_role_applied before update of role on public.profiles
for each row execute function public.mark_profile_role_applied();

-- Provider-created accounts can receive intent after the OAuth redirect.
-- This is a self-selected marketplace preference, never an admin/RLS claim.
create function public.apply_pending_signup_role()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_intent text := new.raw_user_meta_data ->> 'signup_intent';
begin
  if v_intent in ('owner', 'gardener', 'both') then
    update public.profiles
      set role = v_intent::public.user_role, signup_role_applied = true
      where id = new.id and not signup_role_applied;
  end if;
  return new;
end;
$$;
revoke all on function public.apply_pending_signup_role() from public, anon, authenticated;
create trigger on_auth_user_signup_intent_updated
after update of raw_user_meta_data on auth.users
for each row execute function public.apply_pending_signup_role();

-- User-authorized one-time repair. Fixed cutoff prevents later owner signups
-- from being swept into the repair when replaying this migration elsewhere.
-- Retain owner capability, bookings, Stripe fields and original signup metadata.
insert into public.profiles (id, role, country, currency, signup_role_applied)
select u.id, 'both'::public.user_role,
  case when upper(u.raw_user_meta_data ->> 'country') in ('AU', 'NZ')
    then upper(u.raw_user_meta_data ->> 'country') else 'GB' end,
  case upper(u.raw_user_meta_data ->> 'country') when 'AU' then 'AUD' when 'NZ' then 'NZD' else 'GBP' end,
  true
from auth.users u where u.created_at <= timestamptz '2026-11-03 18:27:27+00'
on conflict (id) do nothing;

update public.profiles p set role = 'both'::public.user_role
from auth.users u
where p.id = u.id and u.created_at <= timestamptz '2026-11-03 18:27:27+00'
  and p.role = 'owner'::public.user_role;
