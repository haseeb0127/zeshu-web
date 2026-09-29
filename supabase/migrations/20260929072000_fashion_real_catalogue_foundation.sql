-- Fashion Phase 2: real seller catalogue and variant inventory foundation.
-- Additive only. Existing products remain valid and no placeholder catalogue rows are created.

create table if not exists public.product_commerce_details (
  product_id uuid primary key references public.products(id) on delete cascade,
  mrp numeric(12,2),
  return_eligible boolean not null default false,
  return_window_days integer,
  return_policy_summary text,
  external_source text not null default 'DIRECT',
  external_product_id text,
  source_catalog_id text,
  last_catalog_sync_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint product_commerce_mrp_check check (mrp is null or mrp >= 0),
  constraint product_commerce_return_window_check check (
    (return_eligible = false and return_window_days is null)
    or (return_eligible = true and return_window_days between 1 and 90)
  ),
  constraint product_commerce_source_check check (external_source in ('DIRECT','ONDC','MYSTORE','OTHER'))
);

create unique index if not exists product_commerce_external_identity_idx
  on public.product_commerce_details (external_source, external_product_id)
  where external_product_id is not null;

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null,
  seller_sku text,
  size_label text,
  colour_name text,
  colour_hex text,
  stock_quantity integer not null default 0,
  sale_price numeric(12,2),
  mrp numeric(12,2),
  active boolean not null default true,
  external_variant_id text,
  last_stock_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_sku_nonempty check (char_length(btrim(sku)) between 1 and 120),
  constraint product_variants_stock_check check (stock_quantity >= 0),
  constraint product_variants_sale_price_check check (sale_price is null or sale_price >= 0),
  constraint product_variants_mrp_check check (mrp is null or mrp >= 0),
  constraint product_variants_price_order_check check (mrp is null or sale_price is null or sale_price <= mrp),
  constraint product_variants_colour_hex_check check (colour_hex is null or colour_hex ~ '^#[0-9A-Fa-f]{6}$')
);

create unique index if not exists product_variants_product_sku_idx
  on public.product_variants(product_id, sku);
create index if not exists product_variants_product_active_idx
  on public.product_variants(product_id, active);
create index if not exists product_variants_size_idx
  on public.product_variants(size_label) where size_label is not null;
create index if not exists product_variants_colour_idx
  on public.product_variants(colour_name) where colour_name is not null;

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  image_url text not null,
  alt_text text,
  display_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint product_images_url_nonempty check (char_length(btrim(image_url)) > 0),
  constraint product_images_display_order_check check (display_order >= 0)
);

create index if not exists product_images_product_order_idx
  on public.product_images(product_id, display_order, id);
create unique index if not exists product_images_one_primary_product_idx
  on public.product_images(product_id)
  where is_primary = true and variant_id is null;
create unique index if not exists product_images_one_primary_variant_idx
  on public.product_images(variant_id)
  where is_primary = true and variant_id is not null;

create table if not exists public.fashion_product_details (
  product_id uuid primary key references public.products(id) on delete cascade,
  department text not null,
  subcategory text,
  gender text,
  material text,
  fit text,
  care_instructions text,
  updated_at timestamptz not null default now(),
  constraint fashion_department_check check (department in ('WOMEN','MEN','KIDS','FOOTWEAR','ACCESSORIES'))
);

alter table public.product_commerce_details enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.fashion_product_details enable row level security;

-- Customer reads are limited to catalogue rows whose parent product is currently public/orderable.
drop policy if exists "customer read commerce details" on public.product_commerce_details;
create policy "customer read commerce details" on public.product_commerce_details
for select to anon, authenticated
using (exists (
  select 1 from public.products p
  where p.id = product_commerce_details.product_id and p.in_stock = true
));

drop policy if exists "customer read active variants" on public.product_variants;
create policy "customer read active variants" on public.product_variants
for select to anon, authenticated
using (
  active = true
  and exists (
    select 1 from public.products p
    where p.id = product_variants.product_id and p.in_stock = true
  )
);

drop policy if exists "customer read product images" on public.product_images;
create policy "customer read product images" on public.product_images
for select to anon, authenticated
using (exists (
  select 1 from public.products p
  where p.id = product_images.product_id and p.in_stock = true
));

drop policy if exists "customer read fashion details" on public.fashion_product_details;
create policy "customer read fashion details" on public.fashion_product_details
for select to anon, authenticated
using (exists (
  select 1 from public.products p
  where p.id = fashion_product_details.product_id and p.in_stock = true
));

comment on table public.product_variants is
  'Seller-backed SKU variants. Size, colour, price and stock must come from real seller/provider catalogue data.';
comment on table public.product_commerce_details is
  'Product-level MRP, returns and external catalogue identity for DIRECT, ONDC, MYSTORE or other verified sources.';
comment on table public.product_images is
  'Real seller/provider product media; no placeholder product rows are created by this migration.';
comment on table public.fashion_product_details is
  'Fashion-only classification used for real-data filtering after seller catalogue onboarding.';
