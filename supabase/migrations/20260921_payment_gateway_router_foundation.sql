-- Multi-gateway payment routing foundation.
-- Additive only: current Razorpay checkout remains the production payment path.
-- Cashfree, PhonePe and Paytm stay disabled until merchant onboarding, credentials,
-- sandbox verification and explicit routing activation are complete.

alter table public.inventory_reservations
  add column if not exists payment_provider text,
  add column if not exists provider_order_id text;

alter table public.orders
  add column if not exists payment_provider text,
  add column if not exists provider_order_id text;

alter table public.payment_provider_events
  add column if not exists provider_order_id text,
  add column if not exists provider_payment_id text;

update public.payment_provider_events
set
  provider_order_id = coalesce(provider_order_id, razorpay_order_id),
  provider_payment_id = coalesce(provider_payment_id, razorpay_payment_id)
where lower(provider) = 'razorpay';

alter table public.payment_reconciliation_refunds
  add column if not exists provider text,
  add column if not exists provider_order_id text,
  add column if not exists provider_refund_id text;

alter table public.payment_reconciliation_refunds
  alter column razorpay_order_id drop not null;

update public.payment_reconciliation_refunds
set
  provider = coalesce(provider, 'razorpay'),
  provider_order_id = coalesce(provider_order_id, razorpay_order_id),
  provider_refund_id = coalesce(provider_refund_id, refund_id)
where provider is null or provider = 'razorpay';

create table if not exists public.payment_gateway_profiles (
  provider text primary key check (provider in ('razorpay','cashfree','phonepe','paytm')),
  display_name text not null,
  routing_enabled boolean not null default false,
  health_status text not null default 'ONBOARDING'
    check (health_status in ('ONBOARDING','ACTIVE','DEGRADED','DOWN','PAUSED')),
  priority integer not null default 100 check (priority between 1 and 1000),
  supported_rails text[] not null default array['UPI','RUPAY_DEBIT','DEBIT_CARD','CREDIT_CARD','NET_BANKING','WALLET']::text[],
  upi_fee_bps integer check (upi_fee_bps is null or upi_fee_bps between 0 and 10000),
  rupay_debit_fee_bps integer check (rupay_debit_fee_bps is null or rupay_debit_fee_bps between 0 and 10000),
  debit_card_fee_bps integer check (debit_card_fee_bps is null or debit_card_fee_bps between 0 and 10000),
  credit_card_fee_bps integer check (credit_card_fee_bps is null or credit_card_fee_bps between 0 and 10000),
  net_banking_fee_bps integer check (net_banking_fee_bps is null or net_banking_fee_bps between 0 and 10000),
  wallet_fee_bps integer check (wallet_fee_bps is null or wallet_fee_bps between 0 and 10000),
  fixed_fee_paise integer not null default 0 check (fixed_fee_paise >= 0),
  rolling_success_rate_bps integer check (rolling_success_rate_bps is null or rolling_success_rate_bps between 0 and 10000),
  rolling_latency_ms integer check (rolling_latency_ms is null or rolling_latency_ms >= 0),
  last_metrics_at timestamptz,
  commercial_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payment_gateway_profiles enable row level security;
revoke all on table public.payment_gateway_profiles from anon, authenticated;
grant select, insert, update, delete on table public.payment_gateway_profiles to service_role;

insert into public.payment_gateway_profiles (
  provider, display_name, routing_enabled, health_status, priority
)
values
  ('razorpay', 'Razorpay', false, 'ACTIVE', 10),
  ('cashfree', 'Cashfree Payments', false, 'ONBOARDING', 20),
  ('phonepe', 'PhonePe Payment Gateway', false, 'ONBOARDING', 30),
  ('paytm', 'Paytm Payment Gateway', false, 'ONBOARDING', 40)
on conflict (provider) do nothing;

create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.inventory_reservations(id) on delete cascade,
  provider text not null check (provider in ('razorpay','cashfree','phonepe','paytm')),
  provider_order_id text,
  provider_payment_id text,
  amount_paise bigint not null check (amount_paise >= 0),
  currency text not null default 'INR' check (currency = 'INR'),
  status text not null default 'NOT_STARTED'
    check (status in (
      'NOT_STARTED','CREATED','CHECKOUT_OPENED','PENDING','SUCCEEDED',
      'FAILED','CANCELLED','REVERSED','REFUND_PENDING','REFUNDED','MANUAL_REVIEW'
    )),
  payment_rail text,
  idempotency_key text not null unique,
  selected_reason text,
  failure_code text,
  failure_message text,
  supersedes_attempt_id uuid references public.payment_attempts(id) on delete set null,
  checkout_started_at timestamptz,
  succeeded_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payment_attempts enable row level security;
revoke all on table public.payment_attempts from anon, authenticated;
grant select, insert, update, delete on table public.payment_attempts to service_role;

create unique index if not exists payment_attempts_provider_order_unique
  on public.payment_attempts (provider, provider_order_id)
  where provider_order_id is not null;

create unique index if not exists payment_attempts_provider_payment_unique
  on public.payment_attempts (provider, provider_payment_id)
  where provider_payment_id is not null;

create index if not exists payment_attempts_reservation_created_idx
  on public.payment_attempts (reservation_id, created_at desc);

comment on table public.payment_gateway_profiles is
  'Server-only merchant-specific routing configuration. Store approved commercial rates here; never expose them to customers.';
comment on table public.payment_attempts is
  'Server-only payment attempt ledger used to prevent duplicate charging and make gateway failover auditable.';
