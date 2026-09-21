-- GST bookkeeping foundation for Zeshu.
-- This migration does not file GST returns and does not change checkout totals.
-- It captures tax metadata so future monthly reports can be generated from immutable order snapshots.

create table if not exists public.business_tax_profiles (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null check (char_length(btrim(legal_name)) between 1 and 160),
  trade_name text not null default 'Zeshu' check (char_length(btrim(trade_name)) between 1 and 120),
  gstin text null check (gstin is null or gstin ~ '^[0-9A-Z]{15}$'),
  state_code text not null default '36' check (state_code ~ '^[0-9]{2}$'),
  filing_frequency text not null default 'MONTHLY' check (filing_frequency in ('MONTHLY','QRMP')),
  registration_effective_date date null,
  invoice_prefix text not null default 'ZESHU' check (invoice_prefix ~ '^[A-Z0-9_-]{1,20}$'),
  status text not null default 'DRAFT' check (status in ('DRAFT','ACTIVE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists business_tax_profiles_one_active
  on public.business_tax_profiles ((status))
  where status = 'ACTIVE';
alter table public.business_tax_profiles enable row level security;

create table if not exists public.vendor_tax_profiles (
  vendor_id uuid primary key references public.vendors(id) on delete cascade,
  legal_name text null check (legal_name is null or char_length(btrim(legal_name)) between 1 and 160),
  gst_registered boolean not null default false,
  gstin text null check (gstin is null or gstin ~ '^[0-9A-Z]{15}$'),
  state_code text null check (state_code is null or state_code ~ '^[0-9]{2}$'),
  invoice_model text null check (invoice_model is null or invoice_model in ('MARKETPLACE_VENDOR','ZESHU_RESELLER')),
  verification_status text not null default 'PENDING' check (verification_status in ('PENDING','VERIFIED','REJECTED')),
  updated_at timestamptz not null default now()
);
alter table public.vendor_tax_profiles enable row level security;

create table if not exists public.product_tax_profiles (
  product_id uuid primary key references public.products(id) on delete cascade,
  hsn_code text null check (hsn_code is null or hsn_code ~ '^[0-9]{2,8}$'),
  gst_rate numeric(6,3) null check (gst_rate is null or (gst_rate >= 0 and gst_rate <= 100)),
  price_includes_gst boolean not null default true,
  classification_status text not null default 'UNCLASSIFIED' check (classification_status in ('UNCLASSIFIED','REVIEWED')),
  updated_at timestamptz not null default now()
);
alter table public.product_tax_profiles enable row level security;

create table if not exists public.gst_purchase_invoices (
  id uuid primary key default gen_random_uuid(),
  supplier_name text not null check (char_length(btrim(supplier_name)) between 1 and 180),
  supplier_gstin text null check (supplier_gstin is null or supplier_gstin ~ '^[0-9A-Z]{15}$'),
  invoice_number text not null check (char_length(btrim(invoice_number)) between 1 and 80),
  invoice_date date not null,
  taxable_value numeric(14,2) not null default 0 check (taxable_value >= 0),
  cgst numeric(14,2) not null default 0 check (cgst >= 0),
  sgst numeric(14,2) not null default 0 check (sgst >= 0),
  igst numeric(14,2) not null default 0 check (igst >= 0),
  cess numeric(14,2) not null default 0 check (cess >= 0),
  total_value numeric(14,2) not null check (total_value >= 0),
  itc_eligible boolean not null default false,
  itc_claimed boolean not null default false,
  document_url text null,
  notes text null check (notes is null or char_length(notes) <= 1200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.gst_purchase_invoices enable row level security;

comment on table public.business_tax_profiles is 'Server/admin-only Zeshu GST profile. No automatic return filing.';
comment on table public.vendor_tax_profiles is 'Vendor GST identity and legal invoicing model, reviewed before use.';
comment on table public.product_tax_profiles is 'Admin-reviewed HSN/GST classification for products; never guessed from category.';
comment on table public.gst_purchase_invoices is 'Input-tax-credit bookkeeping register; eligibility must be verified before claiming.';

create or replace function public.vendor_upsert_tax_profile(
  p_legal_name text,
  p_gst_registered boolean,
  p_gstin text default null
)
returns public.vendor_tax_profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_vendor public.vendors%rowtype;
  v_row public.vendor_tax_profiles%rowtype;
  v_gstin text;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select * into v_vendor
  from public.vendors
  where owner_id = auth.uid()
  for update;

  if not found or v_vendor.admin_suspended is true then
    raise exception 'vendor access required';
  end if;

  if p_legal_name is null or char_length(btrim(p_legal_name)) not between 1 and 160 then
    raise exception 'invalid legal name';
  end if;

  v_gstin := nullif(upper(btrim(coalesce(p_gstin, ''))), '');
  if p_gst_registered and (v_gstin is null or v_gstin !~ '^[0-9A-Z]{15}$') then
    raise exception 'valid GSTIN required';
  end if;
  if not p_gst_registered then
    v_gstin := null;
  end if;

  insert into public.vendor_tax_profiles (
    vendor_id, legal_name, gst_registered, gstin, state_code, verification_status, updated_at
  ) values (
    v_vendor.id,
    btrim(p_legal_name),
    p_gst_registered,
    v_gstin,
    case when v_gstin is not null then left(v_gstin, 2) else null end,
    'PENDING',
    now()
  )
  on conflict (vendor_id) do update set
    legal_name = excluded.legal_name,
    gst_registered = excluded.gst_registered,
    gstin = excluded.gstin,
    state_code = excluded.state_code,
    verification_status = case
      when public.vendor_tax_profiles.gstin is distinct from excluded.gstin
        or public.vendor_tax_profiles.legal_name is distinct from excluded.legal_name
      then 'PENDING'
      else public.vendor_tax_profiles.verification_status
    end,
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.vendor_upsert_tax_profile(text,boolean,text) from public;
grant execute on function public.vendor_upsert_tax_profile(text,boolean,text) to authenticated;

create or replace function public.vendor_get_tax_profile()
returns public.vendor_tax_profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_vendor_id uuid;
  v_row public.vendor_tax_profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select id into v_vendor_id
  from public.vendors
  where owner_id = auth.uid()
    and admin_suspended is false;

  if v_vendor_id is null then
    raise exception 'vendor access required';
  end if;

  select * into v_row
  from public.vendor_tax_profiles
  where vendor_id = v_vendor_id;

  return v_row;
end;
$$;

revoke all on function public.vendor_get_tax_profile() from public;
grant execute on function public.vendor_get_tax_profile() to authenticated;

create or replace function public.create_inventory_reservation(
  p_user_id uuid,
  p_items jsonb,
  p_delivery_address text,
  p_has_zeshu_pass boolean,
  p_is_donating boolean,
  p_tip numeric
)
returns table(reservation_id uuid, expected_total_paid numeric)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_entry jsonb;
  v_product_id_text text;
  v_quantity_text text;
  v_product_id uuid;
  v_quantity integer;
  v_existing_quantity bigint;
  v_item_map jsonb := '{}'::jsonb;
  v_product public.products%rowtype;
  v_vendor_id uuid;
  v_held_quantity bigint;
  v_subtotal numeric := 0;
  v_delivery_fee numeric;
  v_total numeric;
  v_reservation_id uuid;
  v_snapshots jsonb := '{}'::jsonb;
  v_snapshot jsonb;
  v_item record;
  v_tax public.product_tax_profiles%rowtype;
  v_vendor_tax public.vendor_tax_profiles%rowtype;
begin
  if p_user_id is null
     or p_delivery_address is null
     or length(btrim(p_delivery_address)) < 8
     or p_has_zeshu_pass is null
     or p_is_donating is null
     or p_tip is null
     or p_tip not in (0, 20, 30, 50)
     or not exists (select 1 from public.users where id = p_user_id) then
    raise exception 'invalid reservation request';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'invalid reservation items';
  end if;

  for v_entry in select value from jsonb_array_elements(p_items)
  loop
    if jsonb_typeof(v_entry) <> 'object' then
      raise exception 'invalid reservation items';
    end if;

    v_product_id_text := v_entry ->> 'product_id';
    v_quantity_text := v_entry ->> 'quantity';
    if v_product_id_text is null
       or v_quantity_text is null
       or v_product_id_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       or v_quantity_text !~ '^[0-9]+$'
       or length(v_quantity_text) > 10
       or (length(v_quantity_text) = 10 and v_quantity_text > '2147483647') then
      raise exception 'invalid reservation items';
    end if;

    v_product_id := v_product_id_text::uuid;
    v_quantity := v_quantity_text::integer;
    if v_quantity <= 0 then
      raise exception 'invalid reservation items';
    end if;

    v_existing_quantity := coalesce((v_item_map ->> v_product_id::text)::bigint, 0);
    if v_existing_quantity + v_quantity > 2147483647 then
      raise exception 'invalid reservation items';
    end if;

    v_item_map := jsonb_set(
      v_item_map,
      array[v_product_id::text],
      to_jsonb(v_existing_quantity + v_quantity),
      true
    );
  end loop;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 9173));

  update public.inventory_reservations
  set status = 'EXPIRED'
  where user_id = p_user_id
    and status in ('ACTIVE', 'PAYMENT_PENDING')
    and expires_at <= now();

  if exists (
    select 1 from public.inventory_reservations
    where user_id = p_user_id
      and status = 'PAYMENT_PENDING'
      and expires_at > now()
  ) then
    raise exception 'an active payment checkout already exists';
  end if;

  update public.inventory_reservations
  set status = 'EXPIRED'
  where user_id = p_user_id
    and status = 'ACTIVE'
    and razorpay_order_id is null
    and expires_at > now();

  for v_item in
    select key::uuid as product_id, value::integer as quantity
    from jsonb_each_text(v_item_map)
    order by key::uuid
  loop
    select * into v_product
    from public.products
    where id = v_item.product_id
    for update;

    if not found
       or v_product.vendor_id is null
       or v_product.in_stock is not true
       or v_product.price is null then
      raise exception 'invalid reservation items';
    end if;

    if v_vendor_id is null then
      v_vendor_id := v_product.vendor_id;
      select * into v_vendor_tax
      from public.vendor_tax_profiles
      where vendor_id = v_vendor_id;
    elsif v_vendor_id <> v_product.vendor_id then
      raise exception 'invalid reservation items';
    end if;

    select * into v_tax
    from public.product_tax_profiles
    where product_id = v_product.id;

    select coalesce(sum(iri.quantity), 0) into v_held_quantity
    from public.inventory_reservation_items iri
    join public.inventory_reservations ir on ir.id = iri.reservation_id
    where iri.product_id = v_product.id
      and ir.status in ('ACTIVE', 'PAYMENT_PENDING')
      and ir.expires_at > now();

    if v_product.quantity - v_held_quantity < v_item.quantity then
      raise exception 'invalid reservation items';
    end if;

    v_subtotal := v_subtotal + (v_product.price * v_item.quantity);
    v_snapshot := jsonb_build_object(
      'quantity', v_item.quantity,
      'unit_price', v_product.price,
      'item_snapshot', jsonb_build_object(
        'id', v_product.id,
        'name', v_product.name,
        'price', v_product.price,
        'weight', v_product.weight,
        'unit', v_product.unit,
        'image_url', v_product.image_url,
        'category', v_product.category,
        'hsn_code', v_tax.hsn_code,
        'gst_rate', v_tax.gst_rate,
        'price_includes_gst', coalesce(v_tax.price_includes_gst, true),
        'tax_classification_status', coalesce(v_tax.classification_status, 'UNCLASSIFIED'),
        'seller_legal_name', v_vendor_tax.legal_name,
        'seller_gstin', v_vendor_tax.gstin,
        'seller_state_code', v_vendor_tax.state_code,
        'invoice_model', v_vendor_tax.invoice_model,
        'seller_tax_verification_status', coalesce(v_vendor_tax.verification_status, 'PENDING')
      )
    );
    v_snapshots := jsonb_set(v_snapshots, array[v_product.id::text], v_snapshot, true);
  end loop;

  v_delivery_fee := case when v_subtotal >= 299 then 0 else 30 end;
  v_total := v_subtotal + v_delivery_fee;

  insert into public.inventory_reservations (
    user_id, vendor_id, delivery_address, merchandise_subtotal, expected_total_paid,
    pricing_snapshot, expires_at
  ) values (
    p_user_id, v_vendor_id, btrim(p_delivery_address), v_subtotal, v_total,
    jsonb_build_object(
      'small_cart_fee', 0,
      'delivery_fee', v_delivery_fee,
      'handling_fee', 0,
      'donation', 0,
      'tip', 0,
      'pass_fee', 0,
      'discount_total', 0
    ),
    now() + interval '10 minutes'
  ) returning id into v_reservation_id;

  for v_item in
    select key::uuid as product_id, value::integer as quantity
    from jsonb_each_text(v_item_map)
    order by key::uuid
  loop
    v_snapshot := v_snapshots -> v_item.product_id::text;
    insert into public.inventory_reservation_items (
      reservation_id, product_id, quantity, unit_price, item_snapshot
    ) values (
      v_reservation_id,
      v_item.product_id,
      v_item.quantity,
      (v_snapshot ->> 'unit_price')::numeric,
      v_snapshot -> 'item_snapshot'
    );
  end loop;

  reservation_id := v_reservation_id;
  expected_total_paid := v_total;
  return next;
end;
$$;

revoke all on function public.create_inventory_reservation(uuid,jsonb,text,boolean,boolean,numeric) from public;
grant execute on function public.create_inventory_reservation(uuid,jsonb,text,boolean,boolean,numeric) to authenticated;
