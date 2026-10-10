-- Zeshu Dine: real partner-gated reservations, optional pre-orders, no payments or auto-confirmation.
create table if not exists public.dine_restaurants(
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(name) between 2 and 120),
 city text not null check(length(city) between 2 and 80),
 area text not null default '',
 address text not null check(length(address) between 8 and 400),
 fssai_registration text not null check(fssai_registration ~ '^[0-9]{14}$'),
 fssai_verified boolean not null default false,
 booking_enabled boolean not null default false,
 preorder_enabled boolean not null default false,
 opens_at time not null default '11:00',
 closes_at time not null default '22:00',
 min_notice_minutes integer not null default 60 check(min_notice_minutes between 30 and 1440),
 table_duration_minutes integer not null default 90 check(table_duration_minutes between 30 and 240),
 prep_buffer_minutes integer not null default 10 check(prep_buffer_minutes between 0 and 40),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint dine_open_before_close check(opens_at<closes_at),
 constraint dine_booking_verified check(not booking_enabled or fssai_verified),
 constraint dine_preorder_requires_booking check(not preorder_enabled or booking_enabled)
);
create table if not exists public.dine_tables(
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null references public.dine_restaurants(id) on delete cascade,
 label text not null check(length(label) between 1 and 40),
 seats integer not null check(seats between 1 and 24),
 enabled boolean not null default true,
 unique(restaurant_id,label),
 unique(id,restaurant_id)
);
create table if not exists public.dine_menu_items(
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null references public.dine_restaurants(id) on delete cascade,
 name text not null check(length(name) between 2 and 120),
 category text not null default 'Meals',
 price_paise integer not null check(price_paise between 100 and 1000000),
 prep_minutes integer not null default 20 check(prep_minutes between 5 and 180),
 available boolean not null default true,
 created_at timestamptz not null default now(),
 unique(id,restaurant_id)
);
create table if not exists public.dine_bookings(
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null references public.dine_restaurants(id),
 customer_id uuid not null references auth.users(id),
 contact_name text not null check(length(contact_name) between 2 and 100),
 contact_phone text not null check(contact_phone ~ '^\+?[0-9]{10,15}$'),
 party_size integer not null check(party_size between 1 and 24),
 arrival_at timestamptz not null,
 requested_serve_at timestamptz not null,
 confirmed_serve_at timestamptz,
 prep_start_at timestamptz,
 prep_minutes integer not null default 0 check(prep_minutes between 0 and 240),
 dining_minutes integer not null check(dining_minutes between 30 and 240),
 status text not null default 'REQUESTED' check(status in ('REQUESTED','CONFIRMED','DECLINED','CANCELLED','COMPLETED','NO_SHOW')),
 kitchen_status text not null default 'NOT_STARTED' check(kitchen_status in ('NOT_STARTED','PREPARING','READY','SERVED')),
 table_id uuid,
 preordered_items jsonb not null default '[]'::jsonb check(jsonb_typeof(preordered_items)='array'),
 estimated_total_paise integer not null default 0 check(estimated_total_paise between 0 and 10000000),
 notes text not null default '' check(length(notes)<=500),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 foreign key(table_id,restaurant_id) references public.dine_tables(id,restaurant_id),
 constraint dine_confirmed_has_table check(status not in ('CONFIRMED','COMPLETED','NO_SHOW') or table_id is not null),
 constraint dine_confirmed_has_time check(status not in ('CONFIRMED','COMPLETED','NO_SHOW') or confirmed_serve_at is not null)
);
create index if not exists dine_booking_customer on public.dine_bookings(customer_id,created_at desc);
-- Retries must not create two active reservations for the same customer, venue and arrival.
create unique index if not exists dine_active_request_unique on public.dine_bookings(customer_id,restaurant_id,arrival_at)
 where status in ('REQUESTED','CONFIRMED');
create index if not exists dine_booking_restaurant on public.dine_bookings(restaurant_id,arrival_at,status);
create table if not exists public.dine_partner_leads(
 id uuid primary key default gen_random_uuid(),
 restaurant_name text not null check(length(restaurant_name) between 2 and 120),
 city text not null check(length(city) between 2 and 80),
 contact_name text not null check(length(contact_name) between 2 and 100),
 contact_phone text not null check(contact_phone ~ '^\+?[0-9]{10,15}$'),
 fssai_registration text not null check(fssai_registration ~ '^[0-9]{14}$'),
 enquiry_notes text not null default '' check(length(enquiry_notes)<=500),
 status text not null default 'NEW' check(status in ('NEW','CONTACTED','VERIFIED','CLOSED')),
 created_at timestamptz not null default now()
);
do $priv$
declare t text;
begin
 foreach t in array array['dine_restaurants','dine_tables','dine_menu_items','dine_bookings','dine_partner_leads'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on table public.%I from public,anon,authenticated',t);
  execute format('grant select,insert,update,delete on table public.%I to service_role',t);
 end loop;
end $priv$;
-- Lock the restaurant row to serialize all confirmations and prevent table collisions.
create or replace function public.confirm_dine_booking(p_booking_id uuid,p_serve_at timestamptz)
returns boolean language plpgsql security definer set search_path = '' as $confirm$
declare b public.dine_bookings%rowtype;
declare r public.dine_restaurants%rowtype;
declare v_table uuid;
begin
 select * into b from public.dine_bookings where id=p_booking_id;
 if not found or b.status<>'REQUESTED' then return false; end if;
 select * into r from public.dine_restaurants where id=b.restaurant_id for update;
 select * into b from public.dine_bookings where id=p_booking_id for update;
 if not found or b.status<>'REQUESTED' or not r.booking_enabled or not r.fssai_verified then return false; end if;
 if b.arrival_at<=now()+interval '5 minutes' then return false; end if;
 if p_serve_at is null or p_serve_at<b.arrival_at or p_serve_at>b.arrival_at+interval '45 minutes' then return false; end if;
 if b.prep_minutes>0 and p_serve_at-make_interval(mins=>b.prep_minutes+r.prep_buffer_minutes)<now() then return false; end if;
 select t.id into v_table from public.dine_tables t
 where t.restaurant_id=b.restaurant_id and t.enabled and t.seats>=b.party_size
 and not exists(
  select 1 from public.dine_bookings other
   where other.table_id=t.id and other.status='CONFIRMED'
   and tstzrange(other.arrival_at,other.arrival_at+make_interval(mins=>other.dining_minutes),'[)')
       && tstzrange(b.arrival_at,b.arrival_at+make_interval(mins=>b.dining_minutes),'[)')
 )
 order by t.seats,t.label limit 1;
 if v_table is null then return false; end if;
 update public.dine_bookings set status='CONFIRMED',table_id=v_table,confirmed_serve_at=p_serve_at,
 prep_start_at=case when b.prep_minutes>0 then p_serve_at-make_interval(mins=>b.prep_minutes+r.prep_buffer_minutes) else null end,
 updated_at=now() where id=p_booking_id;
 return true;
end $confirm$;
revoke all on function public.confirm_dine_booking(uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.confirm_dine_booking(uuid,timestamptz) to service_role;
