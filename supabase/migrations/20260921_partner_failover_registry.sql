create table if not exists public.service_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 160),
  category text not null check (category in ('GROCERY','FRESH','PHARMACY','MEDICINE_DISTRIBUTOR','RECHARGE_BILLS','TRAVEL','DELIVERY')),
  partner_kind text not null check (partner_kind in ('LOCAL_VENDOR','PHARMACY','DISTRIBUTOR','API_PROVIDER','AFFILIATE','RIDER_POOL','OTHER')),
  vendor_id uuid null references public.vendors(id) on delete set null,
  priority integer not null default 100 check (priority between 1 and 1000),
  status text not null default 'ONBOARDING' check (status in ('ONBOARDING','ACTIVE','DEGRADED','DOWN','PAUSED')),
  service_area text,
  target_prep_minutes integer null check (target_prep_minutes is null or target_prep_minutes between 1 and 240),
  auto_failover_enabled boolean not null default false,
  commercial_notes text,
  last_health_at timestamptz,
  last_failure_at timestamptz,
  consecutive_failures integer not null default 0 check (consecutive_failures >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.service_partners enable row level security;

create index if not exists service_partners_category_priority_idx
  on public.service_partners (category, status, priority);

create table if not exists public.partner_failover_events (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  order_id uuid null references public.orders(id) on delete set null,
  external_reference text,
  from_partner_id uuid null references public.service_partners(id) on delete set null,
  to_partner_id uuid null references public.service_partners(id) on delete set null,
  reason text not null check (char_length(btrim(reason)) between 1 and 500),
  financial_transaction_started boolean not null default false,
  original_transaction_status text,
  outcome text not null default 'ROUTED' check (outcome in ('ROUTED','BLOCKED','MANUAL_REVIEW','COMPLETED','FAILED')),
  created_at timestamptz not null default now()
);

alter table public.partner_failover_events enable row level security;

create index if not exists partner_failover_events_created_idx
  on public.partner_failover_events (created_at desc);

comment on table public.service_partners is
  'Internal routing registry for primary and backup fulfillment/payment/travel partners. Server/admin access only.';
comment on table public.partner_failover_events is
  'Audit log for partner routing and failover decisions. Financial retries are blocked unless original transaction state is safe.';
