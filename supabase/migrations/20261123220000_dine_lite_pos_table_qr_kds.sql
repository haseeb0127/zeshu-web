-- Zeshu Dine Lite POS: private restaurant memberships and staff-acknowledged QR requests.
-- Deliberately NO online payments, delivery dispatch, or auto-acceptance of public QR orders.
-- A verified restaurant and an explicit Zeshu admin pilot switch are mandatory.
alter table public.dine_restaurants
 add column if not exists qr_order_enabled boolean not null default false;
alter table public.dine_tables
 add column if not exists qr_token uuid not null default gen_random_uuid();
create unique index if not exists dine_table_qr_token_unique on public.dine_tables(qr_token);

create table if not exists public.dine_restaurant_staff (
 restaurant_id uuid not null references public.dine_restaurants(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check(role in ('OWNER','MANAGER','WAITER','KITCHEN')),
 active boolean not null default true,
 created_at timestamptz not null default now(),
 primary key (restaurant_id,user_id)
);
create index if not exists dine_restaurant_staff_user on public.dine_restaurant_staff(user_id,active);

create table if not exists public.dine_table_orders (
 id uuid primary key default gen_random_uuid(),
 restaurant_id uuid not null references public.dine_restaurants(id),
 table_id uuid not null,
 source text not null check(source in ('TABLE_QR','STAFF_TABLE')),
 customer_label text not null default '' check(length(customer_label)<=80),
 notes text not null default '' check(length(notes)<=350),
 items jsonb not null check(jsonb_typeof(items)='array'),
 item_count integer not null check(item_count between 1 and 120),
 subtotal_paise integer not null check(subtotal_paise between 100 and 10000000),
 status text not null default 'PENDING_APPROVAL'
   check(status in ('PENDING_APPROVAL','ACCEPTED','PREPARING','READY','SERVED','REJECTED','CANCELLED')),
 payment_method text not null default 'PAY_AT_RESTAURANT' check(payment_method='PAY_AT_RESTAURANT'),
 payment_status text not null default 'NOT_COLLECTED' check(payment_status='NOT_COLLECTED'),
 idempotency_key uuid not null,
 request_fingerprint text not null default '' check(length(request_fingerprint)<=64),
 created_by uuid references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 foreign key(table_id,restaurant_id) references public.dine_tables(id,restaurant_id),
 unique(restaurant_id,idempotency_key),
 constraint dine_table_order_staff_source check(
   (source='TABLE_QR' and created_by is null) or
   (source='STAFF_TABLE' and created_by is not null)
 )
);
create index if not exists dine_table_orders_restaurant on public.dine_table_orders(restaurant_id,created_at desc);
create index if not exists dine_table_orders_throttle on public.dine_table_orders(table_id,created_at desc);
create index if not exists dine_table_orders_fingerprint on public.dine_table_orders(request_fingerprint,created_at desc);

create table if not exists public.dine_table_order_events (
 id bigint generated always as identity primary key,
 order_id uuid not null references public.dine_table_orders(id) on delete cascade,
 actor_user_id uuid references auth.users(id),
 previous_status text,
 new_status text not null,
 created_at timestamptz not null default now()
);
create index if not exists dine_table_order_events_lookup on public.dine_table_order_events(order_id,created_at);

do $lock$
declare t text;
begin
 foreach t in array array['dine_restaurant_staff','dine_table_orders','dine_table_order_events'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on table public.%I from public,anon,authenticated',t);
  execute format('grant select,insert,update,delete on table public.%I to service_role',t);
 end loop;
end $lock$;
revoke all on sequence public.dine_table_order_events_id_seq from public,anon,authenticated;
grant usage,select on sequence public.dine_table_order_events_id_seq to service_role;

-- Server-only, atomic, serializable-per-table request creation.
-- Staff submissions need approved membership. Public QR submissions always
-- wait for staff acceptance, and never automatically create a kitchen ticket.
create or replace function public.create_dine_table_order(
 p_restaurant_id uuid,
 p_table_id uuid,
 p_qr_token uuid,
 p_idempotency_key uuid,
 p_items jsonb,
 p_label text,
 p_notes text,
 p_fingerprint text,
 p_staff_user uuid default null
) returns uuid language plpgsql security definer
set search_path='' as $order$
declare v_rest public.dine_restaurants%rowtype;
declare v_table public.dine_tables%rowtype;
declare v_item jsonb;
declare v_dish public.dine_menu_items%rowtype;
declare v_id uuid;
declare v_qty integer;
declare v_total bigint := 0;
declare v_count int := 0;
declare v_snapshot jsonb := '[]'::jsonb;
declare v_existing public.dine_table_orders%rowtype;
declare v_order uuid;
declare v_origin text;
declare v_status text;
begin
 if p_restaurant_id is null or p_table_id is null or p_idempotency_key is null then
  raise exception 'INVALID_ORDER';
 end if;
 if p_items is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)<1 or jsonb_array_length(p_items)>12 then
  raise exception 'INVALID_ITEMS';
 end if;
 if length(coalesce(p_label,''))>80 or length(coalesce(p_notes,''))>350 then
  raise exception 'INVALID_TEXT';
 end if;
 -- Concurrent requests to the same table cannot evade request rate limits.
 perform pg_advisory_xact_lock(hashtext(p_table_id::text));
 select * into v_rest from public.dine_restaurants where id=p_restaurant_id;
 if not found or not v_rest.fssai_verified or not v_rest.booking_enabled or not v_rest.qr_order_enabled then
  raise exception 'RESTAURANT_NOT_ENABLED';
 end if;
 select * into v_table from public.dine_tables
  where id=p_table_id and restaurant_id=p_restaurant_id and enabled=true;
 if not found then raise exception 'TABLE_NOT_AVAILABLE'; end if;
 if p_staff_user is null then
  if p_qr_token is null or v_table.qr_token<>p_qr_token then raise exception 'INVALID_TABLE_QR'; end if;
  if length(coalesce(p_fingerprint,''))<>64 then raise exception 'REQUEST_IDENTITY_REQUIRED'; end if;
  v_origin:='TABLE_QR';v_status:='PENDING_APPROVAL';
 else
  if not exists(select 1 from public.dine_restaurant_staff
    where restaurant_id=p_restaurant_id and user_id=p_staff_user and active=true) then
   raise exception 'NOT_RESTAURANT_STAFF';
  end if;
  v_origin:='STAFF_TABLE';v_status:='ACCEPTED';
 end if;
 -- Exact request retry returns the same order without double-charging or cooking.
 select * into v_existing from public.dine_table_orders
  where restaurant_id=p_restaurant_id and idempotency_key=p_idempotency_key;
 if found then
  if v_existing.table_id<>p_table_id or v_existing.source<>v_origin then raise exception 'REUSED_REQUEST_KEY'; end if;
  return v_existing.id;
 end if;
 if p_staff_user is null then
  if (select count(*) from public.dine_table_orders
      where table_id=p_table_id and created_at>now()-interval '10 minutes' and source='TABLE_QR')>=30
    or (select count(*) from public.dine_table_orders
      where request_fingerprint=p_fingerprint and created_at>now()-interval '10 minutes' and source='TABLE_QR')>=4 then
   raise exception 'RATE_LIMITED';
  end if;
 end if;
 for v_item in select value from jsonb_array_elements(p_items) loop
  if jsonb_typeof(v_item)<>'object'
    or coalesce(v_item->>'id','') !~ '^[0-9a-fA-F-]{36}$'
    or coalesce(v_item->>'quantity','') !~ '^[1-9][0-9]?$' then raise exception 'INVALID_ITEM'; end if;
  v_id:=(v_item->>'id')::uuid;
  v_qty:=(v_item->>'quantity')::integer;
  if v_qty>10 then raise exception 'INVALID_QUANTITY'; end if;
  if (v_snapshot @> jsonb_build_array(jsonb_build_object('id',v_id))) then
   raise exception 'DUPLICATE_ITEM';
  end if;
  select * into v_dish from public.dine_menu_items
    where id=v_id and restaurant_id=p_restaurant_id and available=true;
  if not found then raise exception 'DISH_UNAVAILABLE'; end if;
  v_total:=v_total+(v_dish.price_paise::bigint*v_qty);
  v_count:=v_count+v_qty;
  v_snapshot:=v_snapshot||jsonb_build_array(jsonb_build_object(
    'id',v_dish.id,'name',v_dish.name,'quantity',v_qty,
    'unit_price_paise',v_dish.price_paise,'prep_minutes',v_dish.prep_minutes
  ));
 end loop;
 if v_total<100 or v_total>10000000 or v_count>120 then raise exception 'ORDER_LIMIT_EXCEEDED'; end if;
 insert into public.dine_table_orders (
  restaurant_id,table_id,source,customer_label,notes,items,item_count,
  subtotal_paise,status,idempotency_key,request_fingerprint,created_by
 ) values(
  p_restaurant_id,p_table_id,v_origin,coalesce(p_label,''),coalesce(p_notes,''),
  v_snapshot,v_count,v_total,v_status,p_idempotency_key,
  coalesce(p_fingerprint,''),p_staff_user
 ) returning id into v_order;
 insert into public.dine_table_order_events(order_id,actor_user_id,previous_status,new_status)
 values(v_order,p_staff_user,null,v_status);
 return v_order;
end $order$;

revoke all on function public.create_dine_table_order(uuid,uuid,uuid,uuid,jsonb,text,text,text,uuid) from public,anon,authenticated;
grant execute on function public.create_dine_table_order(uuid,uuid,uuid,uuid,jsonb,text,text,text,uuid) to service_role;
