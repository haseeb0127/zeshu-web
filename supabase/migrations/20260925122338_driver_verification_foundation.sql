create table if not exists public.driver_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  phone_number text not null,
  city text not null,
  requested_services text[] not null default '{}',
  vehicle_type text,
  registration_type text not null default 'NO_VEHICLE',
  status text not null default 'PENDING_DOCUMENTS',
  identity_verified boolean not null default false,
  background_verified boolean not null default false,
  medical_verified boolean not null default false,
  psychological_verified boolean not null default false,
  bank_verified boolean not null default false,
  safety_training_completed boolean not null default false,
  admin_notes text,
  rejection_reason text,
  verified_at timestamptz,
  verified_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id),
  constraint driver_applications_status_check check (status in ('PENDING_DOCUMENTS','UNDER_REVIEW','ACTION_REQUIRED','VERIFIED','REJECTED','SUSPENDED','EXPIRED')),
  constraint driver_applications_registration_check check (registration_type in ('TRANSPORT','NON_TRANSPORT','NO_VEHICLE')),
  constraint driver_applications_services_check check (
    requested_services <@ array['DELIVERY_RIDER','BIKE_COURIER','AUTO_DRIVER','CAB_DRIVER','GOODS_DRIVER']::text[]
    and cardinality(requested_services) > 0
  )
);

create table if not exists public.driver_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.driver_applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null,
  storage_path text not null,
  status text not null default 'UPLOADED',
  expiry_date date,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(application_id, document_type),
  constraint driver_documents_type_check check (document_type in ('IDENTITY','DRIVING_LICENCE','RC','INSURANCE','FITNESS','PERMIT','PUC','BANK_PROOF')),
  constraint driver_documents_status_check check (status in ('UPLOADED','UNDER_REVIEW','APPROVED','REJECTED','EXPIRED'))
);

create table if not exists public.driver_service_eligibility (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.driver_applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  service_code text not null,
  status text not null default 'PENDING_VERIFICATION',
  reason text,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(application_id, service_code),
  constraint driver_service_eligibility_service_check check (service_code in ('DELIVERY_RIDER','BIKE_COURIER','AUTO_DRIVER','CAB_DRIVER','GOODS_DRIVER','BIKE_TAXI')),
  constraint driver_service_eligibility_status_check check (status in ('PENDING_VERIFICATION','VERIFIED','ACTIVE','REGULATORY_HOLD','SUSPENDED','EXPIRED'))
);

create index if not exists driver_applications_status_idx on public.driver_applications(status, updated_at desc);
create index if not exists driver_documents_application_idx on public.driver_documents(application_id, document_type);
create index if not exists driver_documents_expiry_idx on public.driver_documents(expiry_date) where expiry_date is not null;
create index if not exists driver_service_eligibility_status_idx on public.driver_service_eligibility(service_code, status);

alter table public.driver_applications enable row level security;
alter table public.driver_documents enable row level security;
alter table public.driver_service_eligibility enable row level security;

revoke all on public.driver_applications from anon, authenticated;
revoke all on public.driver_documents from anon, authenticated;
revoke all on public.driver_service_eligibility from anon, authenticated;
grant select on public.driver_applications to authenticated;
grant select on public.driver_documents to authenticated;
grant select on public.driver_service_eligibility to authenticated;

drop policy if exists "driver applicant reads own application" on public.driver_applications;
create policy "driver applicant reads own application"
on public.driver_applications for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "driver applicant reads own documents" on public.driver_documents;
create policy "driver applicant reads own documents"
on public.driver_documents for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "driver applicant reads own eligibility" on public.driver_service_eligibility;
create policy "driver applicant reads own eligibility"
on public.driver_service_eligibility for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('driver-verification','driver-verification',false,8388608,array['image/jpeg','image/png','application/pdf'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "driver applicant uploads own verification files" on storage.objects;
create policy "driver applicant uploads own verification files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'driver-verification'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

alter table public.riders
  add column if not exists driver_application_id uuid references public.driver_applications(id) on delete set null,
  add column if not exists verification_grandfathered boolean not null default false;

update public.riders
set verification_grandfathered = true
where driver_application_id is null
  and verification_grandfathered = false;

create or replace function public.driver_user_has_current_activation(p_user_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.driver_applications da
    where da.user_id = p_user_id
      and da.status = 'VERIFIED'
      and exists (
        select 1
        from public.driver_service_eligibility dse
        where dse.application_id = da.id
          and dse.status = 'ACTIVE'
          and dse.service_code in ('DELIVERY_RIDER','BIKE_COURIER','GOODS_DRIVER')
      )
      and not exists (
        select 1
        from public.driver_documents dd
        where dd.application_id = da.id
          and dd.status = 'APPROVED'
          and dd.expiry_date is not null
          and dd.expiry_date < current_date
      )
  );
$$;

create or replace function public.admin_create_rider(
  p_user_id uuid,
  p_full_name text,
  p_phone_number text,
  p_vehicle_number text default null::text,
  p_is_active boolean default true
)
returns public.riders
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_rider public.riders%rowtype;
  v_application_id uuid;
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'admin access required'; end if;
  if p_user_id is null or p_is_active is null or p_full_name is null or length(btrim(p_full_name)) = 0 or p_phone_number is null or length(btrim(p_phone_number)) = 0 then raise exception 'invalid rider details'; end if;
  if not exists (select 1 from auth.users where id = p_user_id) then raise exception 'rider user not found'; end if;
  if exists (select 1 from public.riders where user_id = p_user_id) then raise exception 'rider already exists for user'; end if;

  select da.id into v_application_id
  from public.driver_applications da
  where da.user_id = p_user_id
    and da.status = 'VERIFIED'
    and exists (
      select 1 from public.driver_service_eligibility dse
      where dse.application_id = da.id
        and dse.status = 'ACTIVE'
        and dse.service_code in ('DELIVERY_RIDER','BIKE_COURIER','GOODS_DRIVER')
    )
    and not exists (
      select 1 from public.driver_documents dd
      where dd.application_id = da.id
        and dd.status = 'APPROVED'
        and dd.expiry_date is not null
        and dd.expiry_date < current_date
    )
  limit 1;

  if v_application_id is null then raise exception 'verified driver application required'; end if;

  insert into public.riders (
    user_id, full_name, phone_number, vehicle_number, is_active,
    admin_suspended, driver_application_id, verification_grandfathered
  ) values (
    p_user_id, btrim(p_full_name), btrim(p_phone_number),
    nullif(btrim(p_vehicle_number), ''), p_is_active,
    false, v_application_id, false
  )
  returning * into v_rider;

  return v_rider;
exception
  when unique_violation then raise exception 'rider already exists for user';
end;
$$;

create or replace function public.rider_set_availability(p_is_active boolean)
returns public.riders
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_rider public.riders%rowtype;
begin
  if auth.uid() is null then raise exception 'rider authentication required'; end if;
  if p_is_active is null then raise exception 'invalid rider availability'; end if;
  select * into v_rider from public.riders where user_id = auth.uid() for update;
  if not found then raise exception 'rider profile not found'; end if;
  if p_is_active and v_rider.admin_suspended then raise exception 'rider is administratively suspended'; end if;
  if p_is_active and not v_rider.verification_grandfathered and not public.driver_user_has_current_activation(auth.uid()) then
    raise exception 'driver verification is incomplete or expired';
  end if;
  update public.riders set is_active = p_is_active where id = v_rider.id returning * into v_rider;
  return v_rider;
end;
$$;

create or replace function public.admin_assign_rider(p_order_id uuid, p_rider_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders%rowtype;
  v_rider public.riders%rowtype;
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'admin access required'; end if;
  if p_order_id is null or p_rider_id is null then raise exception 'invalid rider assignment request'; end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'order not found'; end if;
  if v_order.status <> 'READY_FOR_PICKUP' then raise exception 'order is not ready for rider assignment'; end if;

  select * into v_rider from public.riders where id = p_rider_id for update;
  if not found then raise exception 'rider not found'; end if;

  if v_rider.user_id is null
     or v_rider.is_active is distinct from true
     or v_rider.admin_suspended is distinct from false
     or (not v_rider.verification_grandfathered and not public.driver_user_has_current_activation(v_rider.user_id)) then
    raise exception 'rider is not available for assignment';
  end if;

  update public.orders
  set rider_id = v_rider.id, assigned_rider_id = v_rider.user_id
  where id = v_order.id and status = 'READY_FOR_PICKUP'
  returning * into v_order;

  if not found then raise exception 'order is no longer ready for rider assignment'; end if;
  return v_order;
end;
$$;
