-- Run inside BEGIN/ROLLBACK against the migrated schema. Never commits fixtures.
do $$
declare
  gardener_id uuid := gen_random_uuid();
  owner_id uuid := gen_random_uuid();
  oauth_id uuid := gen_random_uuid();
  choice_id uuid := gen_random_uuid();
  both_id uuid := gen_random_uuid();
begin
  insert into auth.users (id, raw_user_meta_data, raw_app_meta_data, created_at)
  values
    (gardener_id, '{"signup_intent":"gardener","country":"AU","age_confirmed":true}', '{"provider":"email"}', now()),
    (owner_id, '{"signup_intent":"owner","country":"GB"}', '{"provider":"email"}', now()),
    (oauth_id, '{}', '{"provider":"google"}', now()),
    (choice_id, '{}', '{"provider":"google"}', now()),
    (both_id, '{"signup_intent":"both","country":"NZ"}', '{"provider":"google"}', now());

  assert (select role = 'gardener' and country = 'AU' and currency = 'AUD'
    and age_confirmed_at is not null and signup_role_applied from public.profiles where id = gardener_id),
    'Email gardener signup must be correct before any profile save';
  assert (select role = 'owner' and signup_role_applied from public.profiles where id = owner_id),
    'Future owners must stay owners';
  assert (select role = 'both' and country = 'NZ' and currency = 'NZD' from public.profiles where id = both_id),
    'Provider signup with intent must preserve both capabilities';
  assert (select not signup_role_applied from public.profiles where id = oauth_id),
    'Provider signup without intent must await onboarding';

  update auth.users set raw_user_meta_data = '{"signup_intent":"gardener"}' where id = oauth_id;
  assert (select role = 'gardener' and signup_role_applied from public.profiles where id = oauth_id),
    'Delayed OAuth intent must apply';
  update public.profiles set role = 'both' where id = oauth_id;
  update auth.users set raw_user_meta_data = '{"signup_intent":"owner","name":"Provider refresh"}' where id = oauth_id;
  assert (select role = 'both' from public.profiles where id = oauth_id),
    'Provider refresh must not overwrite an established choice';

  -- Explicitly choosing even the same default role settles the choice.
  update public.profiles set role = 'owner' where id = choice_id;
  update auth.users set raw_user_meta_data = '{"signup_intent":"gardener"}' where id = choice_id;
  assert (select role = 'owner' and signup_role_applied from public.profiles where id = choice_id),
    'An explicit owner choice must beat later onboarding metadata';

  update public.profiles set full_name = 'Regression gardener' where id = gardener_id;
  update auth.users set raw_user_meta_data = '{"signup_intent":"owner"}' where id = gardener_id;
  assert (select role = 'gardener' from public.profiles where id = gardener_id),
    'Ordinary saves and repeated metadata updates must preserve settled roles';

  perform set_config('request.jwt.claim.sub', gardener_id::text, true);
  set local role authenticated;
  update public.profiles set role = 'both' where id = gardener_id;
  assert found, 'Authenticated users must be able to choose their own role';
  insert into public.care_requests (owner_id, title, start_date, end_date, country, currency)
  values (gardener_id, 'Rolled-back role regression request', current_date + 1, current_date + 2, 'AU', 'AUD');
  assert found, 'Both-role gardeners must retain owner request functionality';
  update public.profiles set role = 'gardener' where id = owner_id;
  assert not found, 'RLS must prevent changing another user role';
  begin
    update public.profiles set signup_role_applied = false where id = gardener_id;
    raise exception 'Authenticated users must not reset internal onboarding state';
  exception when insufficient_privilege then null;
  end;
  reset role;
  assert (select role = 'owner' from public.profiles where id = owner_id), 'Cross-user role must remain unchanged';
end;
$$;

select 'Signup, delayed OAuth intent, idempotence, explicit choices and RLS passed' as result;
