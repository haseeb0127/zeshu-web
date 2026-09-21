-- Hybrid fulfillment foundation: 30-minute Fresh + profitable India-wide delivery.
-- Additive only. Nationwide checkout stays OFF until a real courier-rate integration is configured.

alter table public.products
  add column if not exists delivery_mode text not null default 'LOCAL_STANDARD',
  add column if not exists fresh_eligible boolean not null default false,
  add column if not exists nationwide_shipping_enabled boolean not null default false,
  add column if not exists requires_cold_chain boolean not null default false,
  add column if not exists packed_weight_grams integer,
  add column if not exists package_length_cm numeric,
  add column if not exists package_width_cm numeric,
  add column if not exists package_height_cm numeric,
  add column if not exists shipping_class text not null default 'STANDARD',
  add column if not exists min_nationwide_quantity integer not null default 1,
  add column if not exists min_nationwide_order_value numeric not null default 0,
  add column if not exists handling_minutes integer not null default 15;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_delivery_mode_check') then
    alter table public.products add constraint products_delivery_mode_check
      check (delivery_mode in ('LOCAL_30_MIN','LOCAL_STANDARD','INDIA_STANDARD'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_packed_weight_check') then
    alter table public.products add constraint products_packed_weight_check
      check (packed_weight_grams is null or packed_weight_grams > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_package_length_check') then
    alter table public.products add constraint products_package_length_check
      check (package_length_cm is null or package_length_cm > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_package_width_check') then
    alter table public.products add constraint products_package_width_check
      check (package_width_cm is null or package_width_cm > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_package_height_check') then
    alter table public.products add constraint products_package_height_check
      check (package_height_cm is null or package_height_cm > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_shipping_class_check') then
    alter table public.products add constraint products_shipping_class_check
      check (shipping_class in ('STANDARD','FRAGILE','HEAVY','COLD_CHAIN','LOCAL_ONLY'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_min_nationwide_quantity_check') then
    alter table public.products add constraint products_min_nationwide_quantity_check
      check (min_nationwide_quantity >= 1);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_min_nationwide_order_value_check') then
    alter table public.products add constraint products_min_nationwide_order_value_check
      check (min_nationwide_order_value >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_handling_minutes_check') then
    alter table public.products add constraint products_handling_minutes_check
      check (handling_minutes >= 0 and handling_minutes <= 10080);
  end if;
end $$;

alter table public.vendors
  add column if not exists local_30_min_enabled boolean not null default false,
  add column if not exists local_standard_enabled boolean not null default true;

create table if not exists public.product_fulfillment_profiles (
  product_id uuid primary key references public.products(id) on delete cascade,
  cost_price numeric,
  packaging_cost numeric not null default 0,
  handling_cost numeric not null default 0,
  return_risk_percent numeric not null default 0,
  min_contribution_rupees numeric,
  min_margin_percent numeric,
  updated_at timestamptz not null default now(),
  constraint product_fulfillment_cost_price_check check (cost_price is null or cost_price >= 0),
  constraint product_fulfillment_packaging_cost_check check (packaging_cost >= 0),
  constraint product_fulfillment_handling_cost_check check (handling_cost >= 0),
  constraint product_fulfillment_return_risk_check check (return_risk_percent >= 0 and return_risk_percent <= 100),
  constraint product_fulfillment_min_contribution_check check (min_contribution_rupees is null or min_contribution_rupees >= 0),
  constraint product_fulfillment_min_margin_check check (min_margin_percent is null or (min_margin_percent >= 0 and min_margin_percent <= 100))
);

comment on table public.product_fulfillment_profiles is
  'Private fulfillment costing and profitability inputs. Never expose through the public catalog.';

alter table public.product_fulfillment_profiles enable row level security;

drop policy if exists "admins read fulfillment profiles" on public.product_fulfillment_profiles;
create policy "admins read fulfillment profiles"
on public.product_fulfillment_profiles for select to authenticated
using (public.is_admin());

drop policy if exists "vendors read own fulfillment profiles" on public.product_fulfillment_profiles;
create policy "vendors read own fulfillment profiles"
on public.product_fulfillment_profiles for select to authenticated
using (
  exists (
    select 1
    from public.products p
    join public.vendors v on v.id = p.vendor_id
    where p.id = product_fulfillment_profiles.product_id
      and v.owner_id = auth.uid()
  )
);

create table if not exists public.fulfillment_settings (
  id text primary key default 'default',
  nationwide_checkout_enabled boolean not null default false,
  default_min_contribution_rupees numeric not null default 25,
  default_min_margin_percent numeric not null default 5,
  payment_fee_percent numeric not null default 2,
  default_rto_allowance_percent numeric not null default 5,
  default_operating_cost_percent numeric not null default 3,
  free_shipping_enabled boolean not null default false,
  courier_provider text,
  updated_at timestamptz not null default now(),
  constraint fulfillment_settings_singleton_check check (id = 'default'),
  constraint fulfillment_settings_min_contribution_check check (default_min_contribution_rupees >= 0),
  constraint fulfillment_settings_min_margin_check check (default_min_margin_percent >= 0 and default_min_margin_percent <= 100),
  constraint fulfillment_settings_payment_fee_check check (payment_fee_percent >= 0 and payment_fee_percent <= 100),
  constraint fulfillment_settings_rto_check check (default_rto_allowance_percent >= 0 and default_rto_allowance_percent <= 100),
  constraint fulfillment_settings_operating_check check (default_operating_cost_percent >= 0 and default_operating_cost_percent <= 100)
);

alter table public.fulfillment_settings enable row level security;

drop policy if exists "admins read fulfillment settings" on public.fulfillment_settings;
create policy "admins read fulfillment settings"
on public.fulfillment_settings for select to authenticated
using (public.is_admin());

insert into public.fulfillment_settings (id)
values ('default')
on conflict (id) do nothing;

alter table public.inventory_reservations
  add column if not exists fulfillment_mode text,
  add column if not exists shipping_quote_snapshot jsonb not null default '{}'::jsonb;

alter table public.orders
  add column if not exists fulfillment_mode text,
  add column if not exists shipping_snapshot jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'inventory_reservations_fulfillment_mode_check') then
    alter table public.inventory_reservations add constraint inventory_reservations_fulfillment_mode_check
      check (fulfillment_mode is null or fulfillment_mode in ('LOCAL_30_MIN','LOCAL_STANDARD','INDIA_STANDARD'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'orders_fulfillment_mode_check') then
    alter table public.orders add constraint orders_fulfillment_mode_check
      check (fulfillment_mode is null or fulfillment_mode in ('LOCAL_30_MIN','LOCAL_STANDARD','INDIA_STANDARD'));
  end if;
end $$;

-- Safe catalog defaults: Fresh categories are marked as fresh candidates.
-- They still require location/serviceability and an enabled vendor before any 30-minute promise is shown.
update public.products
set
  fresh_eligible = true,
  delivery_mode = 'LOCAL_30_MIN',
  requires_cold_chain = case
    when lower(coalesce(category,'')) in ('chicken','meat & seafood') then true
    else requires_cold_chain
  end,
  shipping_class = case
    when lower(coalesce(category,'')) in ('chicken','meat & seafood') then 'COLD_CHAIN'
    else shipping_class
  end
where lower(coalesce(category,'')) in (
  'fresh fruits','vegetables','eggs','chicken','meat & seafood','dairy & breakfast'
);

-- Never auto-enable nationwide shipping for existing inventory.
update public.products
set nationwide_shipping_enabled = false
where nationwide_shipping_enabled is distinct from false;

create or replace function public.vendor_update_product_fulfillment(
  p_product_id uuid,
  p_delivery_mode text default null,
  p_fresh_eligible boolean default null,
  p_nationwide_shipping_enabled boolean default null,
  p_requires_cold_chain boolean default null,
  p_packed_weight_grams integer default null,
  p_package_length_cm numeric default null,
  p_package_width_cm numeric default null,
  p_package_height_cm numeric default null,
  p_shipping_class text default null,
  p_min_nationwide_quantity integer default null,
  p_min_nationwide_order_value numeric default null,
  p_handling_minutes integer default null,
  p_cost_price numeric default null,
  p_packaging_cost numeric default null,
  p_handling_cost numeric default null,
  p_return_risk_percent numeric default null,
  p_min_contribution_rupees numeric default null,
  p_min_margin_percent numeric default null
)
returns public.products
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_product public.products%rowtype;
begin
  if auth.uid() is null or p_product_id is null then
    raise exception 'invalid fulfillment update';
  end if;

  select * into v_product
  from public.products
  where id = p_product_id
  for update;

  if not found
     or not exists (
       select 1 from public.vendors
       where id = v_product.vendor_id and owner_id = auth.uid()
     ) then
    raise exception 'invalid fulfillment update';
  end if;

  if coalesce(p_delivery_mode, v_product.delivery_mode) not in ('LOCAL_30_MIN','LOCAL_STANDARD','INDIA_STANDARD')
     or coalesce(p_shipping_class, v_product.shipping_class) not in ('STANDARD','FRAGILE','HEAVY','COLD_CHAIN','LOCAL_ONLY')
     or (p_packed_weight_grams is not null and p_packed_weight_grams <= 0)
     or (p_package_length_cm is not null and p_package_length_cm <= 0)
     or (p_package_width_cm is not null and p_package_width_cm <= 0)
     or (p_package_height_cm is not null and p_package_height_cm <= 0)
     or (p_min_nationwide_quantity is not null and p_min_nationwide_quantity < 1)
     or (p_min_nationwide_order_value is not null and p_min_nationwide_order_value < 0)
     or (p_handling_minutes is not null and (p_handling_minutes < 0 or p_handling_minutes > 10080))
     or (p_cost_price is not null and p_cost_price < 0)
     or (p_packaging_cost is not null and p_packaging_cost < 0)
     or (p_handling_cost is not null and p_handling_cost < 0)
     or (p_return_risk_percent is not null and (p_return_risk_percent < 0 or p_return_risk_percent > 100))
     or (p_min_contribution_rupees is not null and p_min_contribution_rupees < 0)
     or (p_min_margin_percent is not null and (p_min_margin_percent < 0 or p_min_margin_percent > 100)) then
    raise exception 'invalid fulfillment update';
  end if;

  -- A product cannot be marked nationwide-ready without the minimum operational data.
  if coalesce(p_nationwide_shipping_enabled, v_product.nationwide_shipping_enabled) then
    if coalesce(p_delivery_mode, v_product.delivery_mode) <> 'INDIA_STANDARD'
       or coalesce(p_requires_cold_chain, v_product.requires_cold_chain)
       or coalesce(p_shipping_class, v_product.shipping_class) in ('COLD_CHAIN','LOCAL_ONLY')
       or coalesce(p_packed_weight_grams, v_product.packed_weight_grams) is null then
      raise exception 'nationwide product is not operationally ready';
    end if;
  end if;

  update public.products
  set
    delivery_mode = coalesce(p_delivery_mode, delivery_mode),
    fresh_eligible = coalesce(p_fresh_eligible, fresh_eligible),
    nationwide_shipping_enabled = coalesce(p_nationwide_shipping_enabled, nationwide_shipping_enabled),
    requires_cold_chain = coalesce(p_requires_cold_chain, requires_cold_chain),
    packed_weight_grams = coalesce(p_packed_weight_grams, packed_weight_grams),
    package_length_cm = coalesce(p_package_length_cm, package_length_cm),
    package_width_cm = coalesce(p_package_width_cm, package_width_cm),
    package_height_cm = coalesce(p_package_height_cm, package_height_cm),
    shipping_class = coalesce(p_shipping_class, shipping_class),
    min_nationwide_quantity = coalesce(p_min_nationwide_quantity, min_nationwide_quantity),
    min_nationwide_order_value = coalesce(p_min_nationwide_order_value, min_nationwide_order_value),
    handling_minutes = coalesce(p_handling_minutes, handling_minutes)
  where id = p_product_id
  returning * into v_product;

  insert into public.product_fulfillment_profiles (
    product_id, cost_price, packaging_cost, handling_cost, return_risk_percent,
    min_contribution_rupees, min_margin_percent, updated_at
  ) values (
    p_product_id,
    p_cost_price,
    coalesce(p_packaging_cost, 0),
    coalesce(p_handling_cost, 0),
    coalesce(p_return_risk_percent, 0),
    p_min_contribution_rupees,
    p_min_margin_percent,
    now()
  )
  on conflict (product_id) do update set
    cost_price = coalesce(excluded.cost_price, product_fulfillment_profiles.cost_price),
    packaging_cost = case when p_packaging_cost is null then product_fulfillment_profiles.packaging_cost else excluded.packaging_cost end,
    handling_cost = case when p_handling_cost is null then product_fulfillment_profiles.handling_cost else excluded.handling_cost end,
    return_risk_percent = case when p_return_risk_percent is null then product_fulfillment_profiles.return_risk_percent else excluded.return_risk_percent end,
    min_contribution_rupees = coalesce(excluded.min_contribution_rupees, product_fulfillment_profiles.min_contribution_rupees),
    min_margin_percent = coalesce(excluded.min_margin_percent, product_fulfillment_profiles.min_margin_percent),
    updated_at = now();

  return v_product;
end;
$$;

revoke all on function public.vendor_update_product_fulfillment(
  uuid,text,boolean,boolean,boolean,integer,numeric,numeric,numeric,text,integer,numeric,integer,numeric,numeric,numeric,numeric,numeric,numeric
) from public;
grant execute on function public.vendor_update_product_fulfillment(
  uuid,text,boolean,boolean,boolean,integer,numeric,numeric,numeric,text,integer,numeric,integer,numeric,numeric,numeric,numeric,numeric,numeric
) to authenticated;

create or replace function public.vendor_get_product_fulfillment(p_product_id uuid)
returns table (
  product_id uuid,
  delivery_mode text,
  fresh_eligible boolean,
  nationwide_shipping_enabled boolean,
  requires_cold_chain boolean,
  packed_weight_grams integer,
  package_length_cm numeric,
  package_width_cm numeric,
  package_height_cm numeric,
  shipping_class text,
  min_nationwide_quantity integer,
  min_nationwide_order_value numeric,
  handling_minutes integer,
  cost_price numeric,
  packaging_cost numeric,
  handling_cost numeric,
  return_risk_percent numeric,
  min_contribution_rupees numeric,
  min_margin_percent numeric
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    p.id,
    p.delivery_mode,
    p.fresh_eligible,
    p.nationwide_shipping_enabled,
    p.requires_cold_chain,
    p.packed_weight_grams,
    p.package_length_cm,
    p.package_width_cm,
    p.package_height_cm,
    p.shipping_class,
    p.min_nationwide_quantity,
    p.min_nationwide_order_value,
    p.handling_minutes,
    f.cost_price,
    coalesce(f.packaging_cost,0),
    coalesce(f.handling_cost,0),
    coalesce(f.return_risk_percent,0),
    f.min_contribution_rupees,
    f.min_margin_percent
  from public.products p
  join public.vendors v on v.id = p.vendor_id
  left join public.product_fulfillment_profiles f on f.product_id = p.id
  where p.id = p_product_id
    and v.owner_id = auth.uid();
$$;

revoke all on function public.vendor_get_product_fulfillment(uuid) from public;
grant execute on function public.vendor_get_product_fulfillment(uuid) to authenticated;
