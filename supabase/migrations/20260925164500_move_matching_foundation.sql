create table if not exists public.move_dispatch_settings (
  service_code text primary key,
  request_enabled boolean not null default false,
  matching_enabled boolean not null default false,
  max_search_seconds integer not null default 90 check (max_search_seconds between 15 and 300),
  offer_seconds integer not null default 20 check (offer_seconds between 5 and 60),
  max_radius_km numeric(6,2) not null default 15 check (max_radius_km > 0 and max_radius_km <= 50),
  candidates_per_wave integer not null default 3 check (candidates_per_wave between 1 and 10),
  updated_at timestamptz not null default now(),
  constraint move_dispatch_settings_service_check check (service_code in ('BIKE_COURIER','GOODS_DRIVER','AUTO_DRIVER','CAB_DRIVER'))
);

insert into public.move_dispatch_settings (service_code)
values ('BIKE_COURIER'),('GOODS_DRIVER'),('AUTO_DRIVER'),('CAB_DRIVER')
on conflict (service_code) do nothing;

create table if not exists public.move_dispatch_requests (
  id uuid primary key default gen_random_uuid(),
  customer_user_id uuid not null references auth.users(id) on delete restrict,
  service_code text not null,
  status text not null default 'SEARCHING',
  pickup_address text not null,
  pickup_latitude numeric(10,7) not null,
  pickup_longitude numeric(10,7) not null,
  dropoff_address text not null,
  dropoff_latitude numeric(10,7) not null,
  dropoff_longitude numeric(10,7) not null,
  scheduled_at timestamptz,
  details text,
  distance_km numeric(8,2),
  duration_minutes integer,
  quoted_fare numeric(10,2),
  driver_payout numeric(10,2),
  platform_fee numeric(10,2),
  assigned_rider_id uuid references public.riders(id) on delete set null,
  start_otp_hash text,
  search_wave integer not null default 0,
  search_started_at timestamptz not null default now(),
  search_expires_at timestamptz not null,
  accepted_at timestamptz,
  arrived_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint move_dispatch_requests_service_check check (service_code in ('BIKE_COURIER','GOODS_DRIVER','AUTO_DRIVER','CAB_DRIVER')),
  constraint move_dispatch_requests_status_check check (status in ('SEARCHING','OFFERED','DRIVER_ASSIGNED','DRIVER_ARRIVING','ARRIVED','IN_PROGRESS','COMPLETED','CANCELLED','NO_DRIVER')),
  constraint move_dispatch_pickup_lat_check check (pickup_latitude between -90 and 90),
  constraint move_dispatch_pickup_lng_check check (pickup_longitude between -180 and 180),
  constraint move_dispatch_drop_lat_check check (dropoff_latitude between -90 and 90),
  constraint move_dispatch_drop_lng_check check (dropoff_longitude between -180 and 180)
);

create table if not exists public.move_dispatch_offers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.move_dispatch_requests(id) on delete cascade,
  rider_id uuid not null references public.riders(id) on delete cascade,
  status text not null default 'OFFERED',
  distance_to_pickup_km numeric(8,2),
  offered_at timestamptz not null default now(),
  expires_at timestamptz not null,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  unique(request_id, rider_id),
  constraint move_dispatch_offers_status_check check (status in ('OFFERED','ACCEPTED','DECLINED','EXPIRED','CANCELLED'))
);

create table if not exists public.move_dispatch_events (
  id bigserial primary key,
  request_id uuid not null references public.move_dispatch_requests(id) on delete cascade,
  actor_type text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint move_dispatch_events_actor_check check (actor_type in ('CUSTOMER','RIDER','SYSTEM','ADMIN'))
);

create index if not exists move_dispatch_requests_customer_idx on public.move_dispatch_requests(customer_user_id, created_at desc);
create index if not exists move_dispatch_requests_rider_idx on public.move_dispatch_requests(assigned_rider_id, status);
create index if not exists move_dispatch_requests_status_idx on public.move_dispatch_requests(status, search_expires_at);
create index if not exists move_dispatch_offers_rider_idx on public.move_dispatch_offers(rider_id, status, expires_at);
create index if not exists move_dispatch_offers_request_idx on public.move_dispatch_offers(request_id, status);
create index if not exists move_dispatch_events_request_idx on public.move_dispatch_events(request_id, created_at);

alter table public.move_dispatch_settings enable row level security;
alter table public.move_dispatch_requests enable row level security;
alter table public.move_dispatch_offers enable row level security;
alter table public.move_dispatch_events enable row level security;

revoke all on public.move_dispatch_settings from anon, authenticated;
revoke all on public.move_dispatch_requests from anon, authenticated;
revoke all on public.move_dispatch_offers from anon, authenticated;
revoke all on public.move_dispatch_events from anon, authenticated;

create or replace function public.accept_move_dispatch_offer(
  p_offer_id uuid,
  p_rider_id uuid
)
returns public.move_dispatch_requests
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_offer public.move_dispatch_offers%rowtype;
  v_request public.move_dispatch_requests%rowtype;
begin
  select * into v_offer
  from public.move_dispatch_offers
  where id = p_offer_id
  for update;

  if not found then raise exception 'offer not found'; end if;
  if v_offer.rider_id <> p_rider_id then raise exception 'offer does not belong to rider'; end if;
  if v_offer.status <> 'OFFERED' or v_offer.expires_at <= now() then raise exception 'offer is no longer available'; end if;

  select * into v_request
  from public.move_dispatch_requests
  where id = v_offer.request_id
  for update;

  if not found then raise exception 'request not found'; end if;
  if v_request.status not in ('SEARCHING','OFFERED') or v_request.assigned_rider_id is not null then
    raise exception 'request already matched';
  end if;

  if exists (
    select 1 from public.move_dispatch_requests active
    where active.assigned_rider_id = p_rider_id
      and active.status in ('DRIVER_ASSIGNED','DRIVER_ARRIVING','ARRIVED','IN_PROGRESS')
  ) then
    raise exception 'rider already has an active trip';
  end if;

  update public.move_dispatch_offers
  set status = case when id = p_offer_id then 'ACCEPTED' else 'CANCELLED' end,
      responded_at = case when id = p_offer_id then now() else responded_at end
  where request_id = v_request.id
    and status = 'OFFERED';

  update public.move_dispatch_requests
  set status = 'DRIVER_ASSIGNED',
      assigned_rider_id = p_rider_id,
      accepted_at = now(),
      updated_at = now()
  where id = v_request.id
  returning * into v_request;

  insert into public.move_dispatch_events(request_id,actor_type,event_type,event_data)
  values (v_request.id,'SYSTEM','DRIVER_ASSIGNED',jsonb_build_object('rider_id',p_rider_id));

  return v_request;
end;
$$;

revoke all on function public.accept_move_dispatch_offer(uuid,uuid) from public, anon, authenticated;
grant execute on function public.accept_move_dispatch_offer(uuid,uuid) to service_role;
