create table if not exists public.partner_leads (
  id uuid primary key default gen_random_uuid(),
  partner_type text not null check (partner_type in ('LOCAL_VENDOR','LICENSED_PHARMACY','MEDICINE_DISTRIBUTOR','RECHARGE_BILLS','TRAVEL','SPONSOR','OTHER')),
  business_name text not null check (char_length(btrim(business_name)) between 1 and 160),
  contact_person text not null check (char_length(btrim(contact_person)) between 1 and 120),
  contact_phone text,
  contact_email text,
  city text,
  website text,
  licence_or_gst text,
  proposal text,
  status text not null default 'NEW' check (status in ('NEW','CONTACTED','QUALIFIED','ONBOARDED','REJECTED')),
  source text not null default 'WEBSITE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (contact_phone is not null or contact_email is not null),
  check (contact_phone is null or char_length(btrim(contact_phone)) between 7 and 40),
  check (contact_email is null or char_length(btrim(contact_email)) between 5 and 180),
  check (city is null or char_length(btrim(city)) <= 120),
  check (website is null or char_length(btrim(website)) <= 500),
  check (licence_or_gst is null or char_length(btrim(licence_or_gst)) <= 240),
  check (proposal is null or char_length(btrim(proposal)) <= 2400)
);

alter table public.partner_leads enable row level security;

create index if not exists partner_leads_status_created_idx
  on public.partner_leads (status, created_at desc);

comment on table public.partner_leads is
  'Public business partnership applications. Access is server/admin only; no public select policy.';
