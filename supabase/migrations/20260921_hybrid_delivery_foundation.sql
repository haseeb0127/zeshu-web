-- Zeshu hybrid fulfilment foundation
-- Safe rollout: all new products remain LOCAL_STANDARD unless explicitly opted in.

do $$ begin
  create type public.product_delivery_mode as enum ('LOCAL_30_MIN', 'INDIA_STANDARD', 'LOCAL_STANDARD');
exception when duplicate_object then null;
end $$;

alter table public.products
  add column if not exists delivery_mode public.product_delivery_mode not null default 'LOCAL_STANDARD',
  add column if not exists nationwide_shipping_enabled boolean not null default false,
  add column if not exists fresh_eligible boolean not null default false,
  add column if not exists requires_cold_chain boolean not null default false,
  add column if not exists packed_weight_grams integer,
  add column if not exists package_length_cm numeric(10,2),
  add column if not exists package_width_cm numeric(10,2),
  add column if not exists package_height_cm numeric(10,2),
  add column if not exists shipping_class text,
  add column if not exists min_nationwide_quantity integer not null default 1,
  add column if not exists min_nationwide_order_value numeric(12,2),
  add column if not exists handling_cost numeric(12,2) not null default 0,
  add column if not exists handling_time_hours integer,
  add column if not exists minimum_contribution_rupees numeric(12,2),
  add column if not exists minimum_margin_percent numeric(7,3);

alter table public.products
  drop constraint if exists products_packed_weight_nonnegative,
  add constraint products_packed_weight_nonnegative check (packed_weight_grams is null or packed_weight_grams > 0),
  drop constraint if exists products_min_nationwide_quantity_positive,
  add constraint products_min_nationwide_quantity_positive check (min_nationwide_quantity >= 1),
  drop constraint if exists products_nationwide_requires_weight,
  add constraint products_nationwide_requires_weight check (
    nationwide_shipping_enabled = false
    or (delivery_mode = 'INDIA_STANDARD' and packed_weight_grams is not null and packed_weight_grams > 0)
  ),
  drop constraint if exists products_fresh_not_nationwide,
  add constraint products_fresh_not_nationwide check (
    not (delivery_mode = 'LOCAL_30_MIN' and nationwide_shipping_enabled = true)
  );

create index if not exists products_delivery_mode_idx on public.products(delivery_mode);
create index if not exists products_nationwide_enabled_idx on public.products(nationwide_shipping_enabled)
  where nationwide_shipping_enabled = true;

comment on column public.products.delivery_mode is 'Primary fulfilment lane. LOCAL_30_MIN is an eligibility flag; live ETA still requires serviceability, vendor and rider readiness.';
comment on column public.products.nationwide_shipping_enabled is 'Explicit opt-in. Nationwide checkout must additionally pass courier serviceability and profitability gates.';
comment on column public.products.minimum_contribution_rupees is 'Optional product override for server-side nationwide profitability gate; never expose to customers.';
comment on column public.products.minimum_margin_percent is 'Optional product override for server-side nationwide profitability gate; never expose to customers.';
