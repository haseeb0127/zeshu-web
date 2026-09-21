create or replace function public.finalize_grocery_order(
  p_user_id uuid,
  p_reservation_id uuid,
  p_razorpay_order_id text,
  p_payment_id text,
  p_captured_amount_paise bigint
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_reservation public.inventory_reservations%rowtype;
  v_existing_order public.orders%rowtype;
  v_product public.products%rowtype;
  v_item record;
  v_other_held_quantity bigint;
  v_order_items jsonb;
  v_order_id uuid;
begin
  if p_user_id is null
     or p_reservation_id is null
     or p_razorpay_order_id is null
     or length(btrim(p_razorpay_order_id)) = 0
     or p_payment_id is null
     or length(btrim(p_payment_id)) = 0
     or p_captured_amount_paise is null
     or p_captured_amount_paise < 0 then
    raise exception 'invalid reservation request';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_payment_id, 0));

  select *
  into v_reservation
  from public.inventory_reservations
  where id = p_reservation_id;

  if not found then
    raise exception 'invalid reservation request';
  end if;

  select *
  into v_existing_order
  from public.orders
  where payment_id = p_payment_id;

  if found then
    if v_reservation.user_id is distinct from p_user_id
       or v_existing_order.user_id is distinct from p_user_id
       or v_existing_order.vendor_id is distinct from v_reservation.vendor_id
       or v_reservation.razorpay_order_id is distinct from btrim(p_razorpay_order_id)
       or v_existing_order.total_paid is distinct from v_reservation.expected_total_paid
       or p_captured_amount_paise <> round(v_reservation.expected_total_paid * 100)::bigint then
      raise exception 'invalid reservation request';
    end if;
    return v_existing_order.id;
  end if;

  select *
  into v_reservation
  from public.inventory_reservations
  where id = p_reservation_id
  for update;

  if v_reservation.user_id <> p_user_id
     or v_reservation.vendor_id is null
     or v_reservation.razorpay_order_id <> btrim(p_razorpay_order_id)
     or v_reservation.status <> 'PAYMENT_PENDING' then
    raise exception 'invalid reservation request';
  end if;

  if v_reservation.expires_at <= now() then
    raise exception 'reservation expired; payment reconciliation required';
  end if;

  if p_captured_amount_paise <> round(v_reservation.expected_total_paid * 100)::bigint
     or not exists (
       select 1
       from public.inventory_reservation_items
       where reservation_id = v_reservation.id
     ) then
    raise exception 'invalid reservation request';
  end if;

  for v_item in
    select iri.product_id, iri.quantity
    from public.inventory_reservation_items iri
    where iri.reservation_id = v_reservation.id
    order by iri.product_id
  loop
    select *
    into v_product
    from public.products
    where id = v_item.product_id
    for update;

    if not found or v_product.quantity < v_item.quantity then
      raise exception 'invalid reservation request';
    end if;

    select coalesce(sum(iri.quantity), 0)
    into v_other_held_quantity
    from public.inventory_reservation_items iri
    join public.inventory_reservations ir on ir.id = iri.reservation_id
    where iri.product_id = v_product.id
      and ir.id <> v_reservation.id
      and ir.status in ('ACTIVE', 'PAYMENT_PENDING')
      and ir.expires_at > now();

    if v_product.quantity - v_item.quantity < v_other_held_quantity then
      raise exception 'invalid reservation request';
    end if;
  end loop;

  for v_item in
    select iri.product_id, iri.quantity
    from public.inventory_reservation_items iri
    where iri.reservation_id = v_reservation.id
    order by iri.product_id
  loop
    update public.products
    set
      quantity = quantity - v_item.quantity,
      in_stock = case when quantity - v_item.quantity = 0 then false else in_stock end
    where id = v_item.product_id
      and quantity >= v_item.quantity;

    if not found then
      raise exception 'invalid reservation request';
    end if;
  end loop;

  select jsonb_agg(
    jsonb_build_object(
      'item', item_snapshot,
      'qty', quantity
    )
    order by product_id
  )
  into v_order_items
  from public.inventory_reservation_items
  where reservation_id = v_reservation.id;

  insert into public.orders (
    user_id,
    items,
    total_paid,
    payment_id,
    delivery_address,
    delivery_fee,
    vendor_id,
    status,
    fulfillment_mode,
    shipping_snapshot
  )
  values (
    p_user_id,
    v_order_items,
    v_reservation.expected_total_paid,
    btrim(p_payment_id),
    v_reservation.delivery_address,
    (v_reservation.pricing_snapshot ->> 'delivery_fee')::numeric,
    v_reservation.vendor_id,
    'PENDING',
    v_reservation.fulfillment_mode,
    coalesce(v_reservation.shipping_quote_snapshot, '{}'::jsonb)
  )
  returning id into v_order_id;

  update public.inventory_reservations
  set
    status = 'CONSUMED',
    consumed_at = now()
  where id = v_reservation.id;

  return v_order_id;
end;
$$;

revoke all on function public.finalize_grocery_order(uuid,uuid,text,text,bigint) from public;
revoke execute on function public.finalize_grocery_order(uuid,uuid,text,text,bigint) from anon;
revoke execute on function public.finalize_grocery_order(uuid,uuid,text,text,bigint) from authenticated;
grant execute on function public.finalize_grocery_order(uuid,uuid,text,text,bigint) to service_role;
