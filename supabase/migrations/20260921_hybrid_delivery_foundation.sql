-- Zeshu hybrid fulfilment + profitability foundation.
-- Safe by default: nationwide checkout is disabled globally and every product
-- remains local unless an authorized vendor/admin explicitly configures it.

alter table public.products
  add column if not exists delivery_mode text not null default 'LOCAL_STANDARD',
  add column if not exists fresh_eligible boolean not null default false,
  add column if not exists nationwide_shipping_enabled boolean not null default false,
  add column if not exists requires_cold_chain boolean not null default false,
  add column if not exists packed_weight_grams integer,
  add column if not exists package_length_cm numeric(10,2),
  add column if not exists package_width_cm numeric(10,2),
  add column if not exists package_height_cm numeric(10,2),
  add column if not exists shipping_class text not null default 'STANDARD',
  add column if not exists min_nationwide_quantity integer not null default 1,
  add column if not exists min_nationwide_order_value numeric(12,2) not null default 0,
  add column if not exists handling_minutes integer not null default 15;

alter table public.vendors
  add column if not exists local_30_min_enabled boolean not null default false,
  add column if not exists local_standard_enabled boolean not null default true;

alter table public.orders
  add column if not exists fulfillment_mode text,
  add column if not exists shipping_snapshot jsonb not null default '{}'::jsonb;

create table if not exists public.product_fulfillment_profiles (
  product_id uuid primary key references public.products(id) on delete cascade,
  cost_price numeric(12,2) null,
  packaging_cost numeric(12,2) not null default 0,
  handling_cost numeric(12,2) not null default 0,
  return_risk_percent numeric(7,3) not null default 0,
  min_contribution_rupees numeric(12,2) null,
  min_margin_percent numeric(7,3) null,
  updated_at timestamptz not null default now()
);

create table if not exists public.fulfillment_settings (
  id text primary key default 'default',
  nationwide_checkout_enabled boolean not null default false,
  default_min_contribution_rupees numeric(12,2) not null default 25,
  default_min_margin_percent numeric(7,3) not null default 5,
  payment_fee_percent numeric(7,3) not null default 2,
  default_rto_allowance_percent numeric(7,3) not null default 5,
  default_operating_cost_percent numeric(7,3) not null default 3,
  free_shipping_enabled boolean not null default false,
  courier_provider text null,
  updated_at timestamptz not null default now()
);

insert into public.fulfillment_settings(id) values ('default')
on conflict (id) do nothing;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'products_delivery_mode_check') then
    alter table public.products add constraint products_delivery_mode_check
      check (delivery_mode in ('LOCAL_30_MIN','LOCAL_STANDARD','INDIA_STANDARD'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_shipping_class_check') then
    alter table public.products add constraint products_shipping_class_check
      check (shipping_class in ('STANDARD','FRAGILE','HEAVY','COLD_CHAIN','LOCAL_ONLY'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_packed_weight_nonnegative') then
    alter table public.products add constraint products_packed_weight_nonnegative
      check (packed_weight_grams is null or packed_weight_grams > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_min_nationwide_quantity_positive') then
    alter table public.products add constraint products_min_nationwide_quantity_positive
      check (min_nationwide_quantity >= 1);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_min_nationwide_order_value_nonnegative') then
    alter table public.products add constraint products_min_nationwide_order_value_nonnegative
      check (min_nationwide_order_value >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_handling_minutes_range') then
    alter table public.products add constraint products_handling_minutes_range
      check (handling_minutes >= 0 and handling_minutes <= 10080);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_fresh_delivery_consistency') then
    alter table public.products add constraint products_fresh_delivery_consistency
      check (fresh_eligible = false or delivery_mode = 'LOCAL_30_MIN');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_nationwide_safety') then
    alter table public.products add constraint products_nationwide_safety
      check (
        nationwide_shipping_enabled = false
        or (
          delivery_mode = 'INDIA_STANDARD'
          and requires_cold_chain = false
          and shipping_class not in ('COLD_CHAIN','LOCAL_ONLY')
          and packed_weight_grams is not null
        )
      );
  end if;
  if not exists (select 1 from pg_constraint where conname = 'orders_fulfillment_mode_check') then
    alter table public.orders add constraint orders_fulfillment_mode_check
      check (fulfillment_mode is null or fulfillment_mode in ('LOCAL_30_MIN','LOCAL_STANDARD','INDIA_STANDARD'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'product_fulfillment_cost_price_nonnegative') then
    alter table public.product_fulfillment_profiles add constraint product_fulfillment_cost_price_nonnegative
      check (cost_price is null or cost_price >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'product_fulfillment_packaging_cost_nonnegative') then
    alter table public.product_fulfillment_profiles add constraint product_fulfillment_packaging_cost_nonnegative
      check (packaging_cost >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'product_fulfillment_handling_cost_nonnegative') then
    alter table public.product_fulfillment_profiles add constraint product_fulfillment_handling_cost_nonnegative
      check (handling_cost >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'product_fulfillment_return_risk_range') then
    alter table public.product_fulfillment_profiles add constraint product_fulfillment_return_risk_range
      check (return_risk_percent >= 0 and return_risk_percent <= 100);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'product_fulfillment_min_margin_range') then
    alter table public.product_fulfillment_profiles add constraint product_fulfillment_min_margin_range
      check (min_margin_percent is null or (min_margin_percent >= 0 and min_margin_percent <= 100));
  end if;
end $$;

create index if not exists products_delivery_mode_idx on public.products(delivery_mode);
create index if not exists products_nationwide_enabled_idx on public.products(nationwide_shipping_enabled)
  where nationwide_shipping_enabled = true;

alter table public.product_fulfillment_profiles enable row level security;
alter table public.fulfillment_settings enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='product_fulfillment_profiles' and policyname='admins read fulfillment profiles') then
    create policy "admins read fulfillment profiles" on public.product_fulfillment_profiles
      for select to authenticated using (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='product_fulfillment_profiles' and policyname='vendors read own fulfillment profiles') then
    create policy "vendors read own fulfillment profiles" on public.product_fulfillment_profiles
      for select to authenticated using (
        exists (
          select 1 from public.products p
          join public.vendors v on v.id = p.vendor_id
          where p.id = product_fulfillment_profiles.product_id
            and v.owner_id = auth.uid()
        )
      );
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='fulfillment_settings' and policyname='admins read fulfillment settings') then
    create policy "admins read fulfillment settings" on public.fulfillment_settings
      for select to authenticated using (public.is_admin());
  end if;
end $$;

comment on table public.product_fulfillment_profiles is 'Private fulfillment costing and profitability inputs. Never expose through the public catalog.';
comment on column public.products.delivery_mode is 'Primary fulfilment lane. LOCAL_30_MIN is eligibility only; live ETA still requires location, vendor and rider capacity.';
comment on column public.products.nationwide_shipping_enabled is 'Product readiness flag only. Nationwide payment also requires global enablement, live courier quote and a positive profitability gate.';

create or replace function public.vendor_set_fulfillment_status(p_local_30_min_enabled boolean)
returns public.vendors
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_vendor public.vendors%rowtype;
begin
  if auth.uid() is null or p_local_30_min_enabled is null then
    raise exception 'invalid vendor fulfillment status';
  end if;
  update public.vendors
  set local_30_min_enabled = p_local_30_min_enabled
  where owner_id = auth.uid()
    and admin_suspended is false
  returning * into v_vendor;
  if not found then raise exception 'vendor not found'; end if;
  return v_vendor;
end;
$$;
revoke all on function public.vendor_set_fulfillment_status(boolean) from public;
grant execute on function public.vendor_set_fulfillment_status(boolean) to authenticated;

create or replace function public.vendor_get_product_fulfillment(p_product_id uuid)
returns table(
  product_id uuid, delivery_mode text, fresh_eligible boolean, nationwide_shipping_enabled boolean,
  requires_cold_chain boolean, packed_weight_grams integer, package_length_cm numeric,
  package_width_cm numeric, package_height_cm numeric, shipping_class text,
  min_nationwide_quantity integer, min_nationwide_order_value numeric, handling_minutes integer,
  cost_price numeric, packaging_cost numeric, handling_cost numeric, return_risk_percent numeric,
  min_contribution_rupees numeric, min_margin_percent numeric
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    p.id, p.delivery_mode, p.fresh_eligible, p.nationwide_shipping_enabled,
    p.requires_cold_chain, p.packed_weight_grams, p.package_length_cm,
    p.package_width_cm, p.package_height_cm, p.shipping_class,
    p.min_nationwide_quantity, p.min_nationwide_order_value, p.handling_minutes,
    f.cost_price, coalesce(f.packaging_cost,0), coalesce(f.handling_cost,0),
    coalesce(f.return_risk_percent,0), f.min_contribution_rupees, f.min_margin_percent
  from public.products p
  join public.vendors v on v.id = p.vendor_id
  left join public.product_fulfillment_profiles f on f.product_id = p.id
  where p.id = p_product_id
    and v.owner_id = auth.uid()
    and v.admin_suspended is false;
$$;
revoke all on function public.vendor_get_product_fulfillment(uuid) from public;
grant execute on function public.vendor_get_product_fulfillment(uuid) to authenticated;

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
  v_mode text;
  v_class text;
  v_nationwide boolean;
  v_cold boolean;
  v_weight integer;
begin
  if auth.uid() is null or p_product_id is null then raise exception 'invalid fulfillment update'; end if;

  select * into v_product from public.products where id = p_product_id for update;
  if not found or not exists (
    select 1 from public.vendors
    where id = v_product.vendor_id and owner_id = auth.uid() and admin_suspended is false
  ) then raise exception 'invalid fulfillment update'; end if;

  v_mode := coalesce(p_delivery_mode, v_product.delivery_mode);
  v_class := coalesce(p_shipping_class, v_product.shipping_class);
  v_nationwide := coalesce(p_nationwide_shipping_enabled, v_product.nationwide_shipping_enabled);
  v_cold := coalesce(p_requires_cold_chain, v_product.requires_cold_chain);
  v_weight := coalesce(p_packed_weight_grams, v_product.packed_weight_grams);

  if v_mode not in ('LOCAL_30_MIN','LOCAL_STANDARD','INDIA_STANDARD')
     or v_class not in ('STANDARD','FRAGILE','HEAVY','COLD_CHAIN','LOCAL_ONLY')
     or (p_packed_weight_grams is not null and p_packed_weight_grams <= 0)
     or (p_min_nationwide_quantity is not null and p_min_nationwide_quantity < 1)
     or (p_min_nationwide_order_value is not null and p_min_nationwide_order_value < 0)
     or (p_handling_minutes is not null and (p_handling_minutes < 0 or p_handling_minutes > 10080))
     or (p_cost_price is not null and p_cost_price < 0)
     or (p_packaging_cost is not null and p_packaging_cost < 0)
     or (p_handling_cost is not null and p_handling_cost < 0)
     or (p_return_risk_percent is not null and (p_return_risk_percent < 0 or p_return_risk_percent > 100))
     or (p_min_contribution_rupees is not null and p_min_contribution_rupees < 0)
     or (p_min_margin_percent is not null and (p_min_margin_percent < 0 or p_min_margin_percent > 100))
  then raise exception 'invalid fulfillment update'; end if;

  if coalesce(p_fresh_eligible, v_product.fresh_eligible) and v_mode <> 'LOCAL_30_MIN' then
    raise exception 'invalid fresh fulfillment state';
  end if;

  if v_nationwide and (
    v_mode <> 'INDIA_STANDARD' or v_cold or v_class <> 'STANDARD'
    or v_weight is null or coalesce(p_cost_price, (select cost_price from public.product_fulfillment_profiles where product_id=p_product_id)) is null
  ) then raise exception 'nationwide product is not operationally ready'; end if;

  update public.products set
    delivery_mode = v_mode,
    fresh_eligible = coalesce(p_fresh_eligible, fresh_eligible),
    nationwide_shipping_enabled = v_nationwide,
    requires_cold_chain = v_cold,
    packed_weight_grams = v_weight,
    package_length_cm = coalesce(p_package_length_cm, package_length_cm),
    package_width_cm = coalesce(p_package_width_cm, package_width_cm),
    package_height_cm = coalesce(p_package_height_cm, package_height_cm),
    shipping_class = v_class,
    min_nationwide_quantity = coalesce(p_min_nationwide_quantity, min_nationwide_quantity),
    min_nationwide_order_value = coalesce(p_min_nationwide_order_value, min_nationwide_order_value),
    handling_minutes = coalesce(p_handling_minutes, handling_minutes)
  where id = p_product_id
  returning * into v_product;

  insert into public.product_fulfillment_profiles(
    product_id,cost_price,packaging_cost,handling_cost,return_risk_percent,
    min_contribution_rupees,min_margin_percent,updated_at
  ) values (
    p_product_id,p_cost_price,coalesce(p_packaging_cost,0),coalesce(p_handling_cost,0),
    coalesce(p_return_risk_percent,0),p_min_contribution_rupees,p_min_margin_percent,now()
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
revoke all on function public.vendor_update_product_fulfillment(uuid,text,boolean,boolean,boolean,integer,numeric,numeric,numeric,text,integer,numeric,integer,numeric,numeric,numeric,numeric,numeric,numeric) from public;
grant execute on function public.vendor_update_product_fulfillment(uuid,text,boolean,boolean,boolean,integer,numeric,numeric,numeric,text,integer,numeric,integer,numeric,numeric,numeric,numeric,numeric,numeric) to authenticated;

create or replace function public.admin_update_product_fulfillment(
  p_admin_user_id uuid, p_product_id uuid, p_delivery_mode text,
  p_fresh_eligible boolean, p_nationwide_shipping_enabled boolean,
  p_requires_cold_chain boolean, p_packed_weight_grams integer,
  p_package_length_cm numeric, p_package_width_cm numeric, p_package_height_cm numeric,
  p_shipping_class text, p_min_nationwide_quantity integer,
  p_min_nationwide_order_value numeric, p_handling_minutes integer,
  p_cost_price numeric, p_packaging_cost numeric, p_handling_cost numeric,
  p_return_risk_percent numeric, p_min_contribution_rupees numeric, p_min_margin_percent numeric
)
returns public.products
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_product public.products%rowtype;
begin
  if p_admin_user_id is null or p_product_id is null or not exists (
    select 1 from public.admin_roles where user_id=p_admin_user_id and role='admin'
  ) then raise exception 'admin access required'; end if;

  if p_delivery_mode not in ('LOCAL_30_MIN','LOCAL_STANDARD','INDIA_STANDARD')
     or p_shipping_class not in ('STANDARD','FRAGILE','HEAVY','COLD_CHAIN','LOCAL_ONLY')
     or p_min_nationwide_quantity < 1 or p_min_nationwide_order_value < 0
     or p_handling_minutes < 0 or p_handling_minutes > 10080
     or (p_cost_price is not null and p_cost_price < 0)
     or p_packaging_cost < 0 or p_handling_cost < 0
     or p_return_risk_percent < 0 or p_return_risk_percent > 100
     or (p_min_contribution_rupees is not null and p_min_contribution_rupees < 0)
     or (p_min_margin_percent is not null and (p_min_margin_percent < 0 or p_min_margin_percent > 100))
  then raise exception 'invalid fulfillment update'; end if;

  if p_fresh_eligible and p_delivery_mode <> 'LOCAL_30_MIN' then raise exception 'invalid fresh fulfillment state'; end if;
  if p_nationwide_shipping_enabled and (
    p_delivery_mode <> 'INDIA_STANDARD' or p_requires_cold_chain or p_shipping_class <> 'STANDARD'
    or p_packed_weight_grams is null or p_cost_price is null
  ) then raise exception 'nationwide product is not operationally ready'; end if;

  update public.products set
    delivery_mode=p_delivery_mode, fresh_eligible=p_fresh_eligible,
    nationwide_shipping_enabled=p_nationwide_shipping_enabled,
    requires_cold_chain=p_requires_cold_chain, packed_weight_grams=p_packed_weight_grams,
    package_length_cm=p_package_length_cm, package_width_cm=p_package_width_cm,
    package_height_cm=p_package_height_cm, shipping_class=p_shipping_class,
    min_nationwide_quantity=p_min_nationwide_quantity,
    min_nationwide_order_value=p_min_nationwide_order_value,
    handling_minutes=p_handling_minutes
  where id=p_product_id returning * into v_product;
  if not found then raise exception 'product not found'; end if;

  insert into public.product_fulfillment_profiles(
    product_id,cost_price,packaging_cost,handling_cost,return_risk_percent,
    min_contribution_rupees,min_margin_percent,updated_at
  ) values (
    p_product_id,p_cost_price,p_packaging_cost,p_handling_cost,p_return_risk_percent,
    p_min_contribution_rupees,p_min_margin_percent,now()
  )
  on conflict (product_id) do update set
    cost_price=excluded.cost_price, packaging_cost=excluded.packaging_cost,
    handling_cost=excluded.handling_cost, return_risk_percent=excluded.return_risk_percent,
    min_contribution_rupees=excluded.min_contribution_rupees,
    min_margin_percent=excluded.min_margin_percent, updated_at=now();

  return v_product;
end;
$$;
revoke all on function public.admin_update_product_fulfillment(uuid,uuid,text,boolean,boolean,boolean,integer,numeric,numeric,numeric,text,integer,numeric,integer,numeric,numeric,numeric,numeric,numeric,numeric) from public;
grant execute on function public.admin_update_product_fulfillment(uuid,uuid,text,boolean,boolean,boolean,integer,numeric,numeric,numeric,text,integer,numeric,integer,numeric,numeric,numeric,numeric,numeric,numeric) to authenticated;

create or replace function public.admin_update_fulfillment_settings(
  p_admin_user_id uuid,
  p_nationwide_checkout_enabled boolean,
  p_default_min_contribution_rupees numeric,
  p_default_min_margin_percent numeric,
  p_payment_fee_percent numeric,
  p_default_rto_allowance_percent numeric,
  p_default_operating_cost_percent numeric,
  p_free_shipping_enabled boolean,
  p_courier_provider text
)
returns public.fulfillment_settings
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_row public.fulfillment_settings%rowtype; v_provider text;
begin
  if p_admin_user_id is null or not exists (
    select 1 from public.admin_roles where user_id=p_admin_user_id and role='admin'
  ) then raise exception 'admin access required'; end if;

  v_provider := nullif(upper(btrim(coalesce(p_courier_provider,''))), '');
  if p_default_min_contribution_rupees < 0
     or p_default_min_margin_percent < 0 or p_default_min_margin_percent > 100
     or p_payment_fee_percent < 0 or p_payment_fee_percent > 100
     or p_default_rto_allowance_percent < 0 or p_default_rto_allowance_percent > 100
     or p_default_operating_cost_percent < 0 or p_default_operating_cost_percent > 100
  then raise exception 'invalid fulfillment settings'; end if;

  if p_nationwide_checkout_enabled and v_provider is null then
    raise exception 'courier provider required';
  end if;

  insert into public.fulfillment_settings(
    id,nationwide_checkout_enabled,default_min_contribution_rupees,
    default_min_margin_percent,payment_fee_percent,default_rto_allowance_percent,
    default_operating_cost_percent,free_shipping_enabled,courier_provider,updated_at
  ) values (
    'default',p_nationwide_checkout_enabled,p_default_min_contribution_rupees,
    p_default_min_margin_percent,p_payment_fee_percent,p_default_rto_allowance_percent,
    p_default_operating_cost_percent,p_free_shipping_enabled,v_provider,now()
  )
  on conflict (id) do update set
    nationwide_checkout_enabled=excluded.nationwide_checkout_enabled,
    default_min_contribution_rupees=excluded.default_min_contribution_rupees,
    default_min_margin_percent=excluded.default_min_margin_percent,
    payment_fee_percent=excluded.payment_fee_percent,
    default_rto_allowance_percent=excluded.default_rto_allowance_percent,
    default_operating_cost_percent=excluded.default_operating_cost_percent,
    free_shipping_enabled=excluded.free_shipping_enabled,
    courier_provider=excluded.courier_provider,
    updated_at=now()
  returning * into v_row;
  return v_row;
end;
$$;
revoke all on function public.admin_update_fulfillment_settings(uuid,boolean,numeric,numeric,numeric,numeric,numeric,boolean,text) from public;
grant execute on function public.admin_update_fulfillment_settings(uuid,boolean,numeric,numeric,numeric,numeric,numeric,boolean,text) to authenticated;
