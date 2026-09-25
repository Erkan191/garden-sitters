alter table public.care_requests
  add column if not exists invited_gardener_id uuid references public.profiles(id) on delete set null,
  add column if not exists invitation_status text;

alter table public.care_requests
  drop constraint if exists care_requests_invitation_status_check;

alter table public.care_requests
  add constraint care_requests_invitation_status_check
  check (
    (invited_gardener_id is null and invitation_status is null)
    or
    (
      invited_gardener_id is not null
      and invitation_status in ('pending', 'declined')
    )
  );

create index if not exists care_requests_invited_gardener_idx
  on public.care_requests (invited_gardener_id, status, created_at desc)
  where invited_gardener_id is not null;

create or replace function public.user_can_access_request_chat(
  p_request_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    p_user_id is not null
    and p_user_id = auth.uid()
    and exists (
      select 1
      from public.care_requests cr
      where cr.id = p_request_id
        and (
          cr.owner_id = p_user_id
          or cr.invited_gardener_id = p_user_id
          or exists (
            select 1
            from public.offers o
            where o.request_id = cr.id
              and o.gardener_id = p_user_id
              and o.status = 'accepted'::public.offer_status
          )
        )
    );
$$;

revoke all on function public.user_can_access_request_chat(uuid, uuid) from public, anon;
grant execute on function public.user_can_access_request_chat(uuid, uuid) to authenticated;

drop policy if exists "Public can read open requests" on public.care_requests;
create policy "Public can read open public requests"
on public.care_requests
for select
to anon, authenticated
using (
  status = 'open'::public.request_status
  and invited_gardener_id is null
);

drop policy if exists "Owners and accepted gardeners can read related requests"
  on public.care_requests;
create policy "Owners and participants can read related requests"
on public.care_requests
for select
to authenticated
using (public.user_can_access_request_chat(id, auth.uid()));

drop policy if exists "Owners can create open requests" on public.care_requests;
create policy "Owners can create open requests"
on public.care_requests
for insert
to authenticated
with check (
  auth.uid() = owner_id
  and status = 'open'::public.request_status
  and (invited_gardener_id is null or invited_gardener_id <> auth.uid())
);

drop policy if exists "Gardeners can create pending offers on open requests"
  on public.offers;
create policy "Gardeners can create pending offers on open requests"
on public.offers
for insert
to authenticated
with check (
  auth.uid() = gardener_id
  and status = 'pending'::public.offer_status
  and exists (
    select 1
    from public.care_requests r
    where r.id = offers.request_id
      and r.status = 'open'::public.request_status
      and r.owner_id <> auth.uid()
      and (
        r.invited_gardener_id is null
        or (
          r.invited_gardener_id = auth.uid()
          and r.invitation_status = 'pending'
        )
      )
  )
);

drop policy if exists "Participants can read messages" on public.messages;
create policy "Participants can read messages"
on public.messages
for select
to authenticated
using (public.user_can_access_request_chat(request_id, auth.uid()));

drop policy if exists "Participants can send messages" on public.messages;
create policy "Participants can send messages"
on public.messages
for insert
to authenticated
with check (
  auth.uid() = sender_id
  and public.user_can_access_request_chat(request_id, auth.uid())
);

create or replace function public.decline_gardener_invitation(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  update public.care_requests
  set invitation_status = 'declined', updated_at = now()
  where id = p_request_id
    and invited_gardener_id = v_uid
    and invitation_status = 'pending'
    and status = 'open'::public.request_status
    and not exists (
      select 1
      from public.offers o
      where o.request_id = p_request_id
        and o.gardener_id = v_uid
    );

  if not found then
    raise exception 'This invitation cannot be declined';
  end if;
end;
$$;

revoke all on function public.decline_gardener_invitation(uuid) from public, anon;
grant execute on function public.decline_gardener_invitation(uuid) to authenticated;

create or replace function public.get_my_unread_request_counts()
returns table(request_id uuid, unread_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  with my_requests as (
    select cr.id
    from public.care_requests cr
    where cr.owner_id = auth.uid()
       or cr.invited_gardener_id = auth.uid()

    union

    select o.request_id
    from public.offers o
    where o.gardener_id = auth.uid()
      and o.status = 'accepted'::public.offer_status
  ),
  my_reads as (
    select mr.request_id, mr.last_read_at
    from public.message_reads mr
    where mr.user_id = auth.uid()
  )
  select
    m.request_id,
    count(*)::bigint as unread_count
  from public.messages m
  join my_requests r on r.id = m.request_id
  left join my_reads mr on mr.request_id = m.request_id
  where auth.uid() is not null
    and m.sender_id <> auth.uid()
    and m.created_at > coalesce(mr.last_read_at, '1970-01-01'::timestamptz)
  group by m.request_id;
$$;

revoke all on function public.get_my_unread_request_counts() from public, anon;
grant execute on function public.get_my_unread_request_counts() to authenticated;
