-- Scheduled district transport enquiries: NOT ride dispatch or confirmed bookings.
-- Sensitive lead records are service-role only; no public or seller-facing access.
create table if not exists public.move_quote_enquiries (
  id uuid primary key default gen_random_uuid(),
  service_code text not null check (service_code in (
    'OUTSTATION_CAB','RETURN_CAB','MINI_TRUCK','LARGE_TRUCK','CHARTER_BUS'
  )),
  pickup_town text not null check (pickup_town in (
    'Jagtial','Dharmaram','Korutla','Metpally','Dharmapuri'
  )),
  pickup_landmark text not null default '' check (char_length(pickup_landmark) <= 160),
  destination text not null check (char_length(destination) between 3 and 200),
  travel_date date not null,
  travel_time text null check (travel_time is null or travel_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  contact_name text not null check (char_length(contact_name) between 2 and 100),
  contact_phone text not null check (contact_phone ~ '^[6-9][0-9]{9}$'),
  passengers integer null check (passengers between 1 and 70),
  load_description text not null default '' check (char_length(load_description) <= 500),
  notes text not null default '' check (char_length(notes) <= 900),
  status text not null default 'NEW' check (status in ('NEW','REVIEWING','SOURCING','QUOTED','CLOSED','CANCELLED')),
  consented_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists move_quote_enquiries_status_created_idx
  on public.move_quote_enquiries (status, created_at desc);
create index if not exists move_quote_enquiries_phone_created_idx
  on public.move_quote_enquiries (contact_phone, created_at desc);

alter table public.move_quote_enquiries enable row level security;
revoke all on table public.move_quote_enquiries from public, anon, authenticated;
grant select, insert, update, delete on table public.move_quote_enquiries to service_role;

comment on table public.move_quote_enquiries is
  'Private opt-in scheduled transport quotation enquiries in Jagtial district. Not dispatch, operator quote, payment, confirmed passenger booking or vehicle-hire contract. All reads/updates require server-verified admin authorization.';
comment on column public.move_quote_enquiries.contact_phone is
  'Customer mobile for enquiry follow-up only with consent; no public data API access.';
