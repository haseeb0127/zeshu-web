-- Zeshu Green: one funded tree slot per eligible *future delivered* order.
-- IMPORTANT: programme begins in PLANNING; historical/test orders are excluded.
-- There is no payment, donation, planting operation, or automatic activation.
create table if not exists public.zeshu_green_program (
  singleton_id smallint primary key default 1 check (singleton_id=1),
  mode text not null default 'PLANNING'
    check (mode in ('PLANNING','ACTIVE','PAUSED')),
  activated_at timestamptz,
  planting_partner text,
  partner_public_website text,
  verified_partner_agreement boolean not null default false,
  live_order_payments_verified boolean not null default false,
  tree_unit_budget_paise integer,
  funded_tree_quota integer not null default 0 check (funded_tree_quota >= 0),
  updated_at timestamptz not null default now(),
  constraint zeshu_green_activation_guard check (
    mode <> 'ACTIVE'
    or (
      activated_at is not null
      and verified_partner_agreement
      and live_order_payments_verified
      and length(trim(coalesce(planting_partner,'')))>=3
      and partner_public_website ~ '^https://[^[:space:]]+$'
      and tree_unit_budget_paise between 100 and 100000
      and funded_tree_quota > 0
    )
  )
);
insert into public.zeshu_green_program(singleton_id) values (1)
  on conflict (singleton_id) do nothing;

create table if not exists public.zeshu_green_tree_commitments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete restrict,
  status text not null default 'PLEDGED'
    check (status in ('PLEDGED','PLANTED','VERIFIED','VOID')),
  created_at timestamptz not null default now(),
  planted_at timestamptz,
  verified_at timestamptz,
  proof_url text,
  native_species text,
  planting_area text,
  partner_reference text,
  updated_at timestamptz not null default now(),
  constraint green_verified_tree_evidence check (
    status <> 'VERIFIED'
    or (
      planted_at is not null and verified_at is not null
      and proof_url ~ '^https://[^[:space:]]+$'
      and length(trim(coalesce(native_species,'')))>=2
      and length(trim(coalesce(planting_area,'')))>=3
      and length(trim(coalesce(partner_reference,'')))>=3
    )
  )
);
create index if not exists green_commitments_status_idx
  on public.zeshu_green_tree_commitments(status);
create index if not exists green_commitments_created_at_idx
  on public.zeshu_green_tree_commitments(created_at);

-- RLS and REVOKE are defense in depth: only server-side service_role may read,
-- verify, or edit order-linked records and partner information.
alter table public.zeshu_green_program enable row level security;
alter table public.zeshu_green_tree_commitments enable row level security;
revoke all on table public.zeshu_green_program from public,anon,authenticated;
revoke all on table public.zeshu_green_tree_commitments from public,anon,authenticated;
grant select,insert,update,delete on table public.zeshu_green_program to service_role;
grant select,insert,update,delete on table public.zeshu_green_tree_commitments to service_role;

create or replace function public.record_zeshu_green_delivery()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  cfg public.zeshu_green_program%rowtype;
  reserved integer;
begin
  -- Cancelled after delivery? Void only an unplanted pledge. Trees already
  -- planted need manual review rather than erasing real planting evidence.
  if new.status='CANCELLED' and old.status='DELIVERED' then
    update public.zeshu_green_tree_commitments
      set status='VOID',updated_at=now()
      where order_id=new.id and status='PLEDGED';
    return new;
  end if;
  -- Only a new transition to DELIVERED, never checkout, order creation,
  -- canceled/pending orders or re-saving an already delivered order.
  if new.status <> 'DELIVERED' or old.status = 'DELIVERED' then
    return new;
  end if;
  -- The row lock atomically protects the prepaid campaign quota.
  select * into cfg from public.zeshu_green_program
     where singleton_id=1 for update;
  if not found or cfg.mode <> 'ACTIVE'
     or cfg.activated_at is null or new.created_at < cfg.activated_at then
    return new;
  end if;
  if exists(select 1 from public.zeshu_green_tree_commitments where order_id=new.id) then
    return new;
  end if;
  select count(*) into reserved from public.zeshu_green_tree_commitments
   where status <> 'VOID';
  if reserved >= cfg.funded_tree_quota then
    update public.zeshu_green_program set mode='PAUSED',updated_at=now()
    where singleton_id=1;
    return new;
  end if;
  insert into public.zeshu_green_tree_commitments(order_id,status)
    values(new.id,'PLEDGED') on conflict(order_id) do nothing;
  if reserved+1>=cfg.funded_tree_quota then
    update public.zeshu_green_program set mode='PAUSED',updated_at=now()
    where singleton_id=1;
  end if;
  return new;
end;
$$;

revoke all on function public.record_zeshu_green_delivery() from public,anon,authenticated;
grant execute on function public.record_zeshu_green_delivery() to service_role;
drop trigger if exists zeshu_green_on_delivered on public.orders;
create trigger zeshu_green_on_delivered
after update of status on public.orders
for each row execute function public.record_zeshu_green_delivery();

comment on table public.zeshu_green_tree_commitments is
 'Future funded-tree commitments only; VERIFIED requires evidence. Never derive planted trees from order count.';
comment on table public.zeshu_green_program is
 'Disabled by default. ACTIVE requires vetted partner, confirmed live payment operations and preapproved prepaid tree quota. No retroactive order inclusion.';
