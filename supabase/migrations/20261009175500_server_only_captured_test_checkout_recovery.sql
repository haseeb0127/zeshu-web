CREATE OR REPLACE FUNCTION public.reconcile_captured_expired_test_checkout(p_user_id uuid, p_reservation_id uuid, p_razorpay_order_id text, p_payment_id text, p_captured_amount_paise bigint)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
 v_reservation public.inventory_reservations%rowtype;
 v_existing public.orders%rowtype;
 v_line record;
 v_product public.products%rowtype;
 v_vendor public.vendors%rowtype;
 v_order_id uuid;
begin
 if p_user_id is null or p_reservation_id is null
    or nullif(btrim(p_razorpay_order_id),'') is null
    or nullif(btrim(p_payment_id),'') is null
    or p_captured_amount_paise is null or p_captured_amount_paise <= 0 then
   raise exception 'invalid captured-payment reconciliation request';
 end if;
 -- Match the payment lock used by the original finalizer for exactly-once processing.
 perform pg_advisory_xact_lock(hashtextextended(p_payment_id,0));
 select * into v_reservation
 from public.inventory_reservations
 where id=p_reservation_id
 for update;
 if not found or v_reservation.user_id is distinct from p_user_id
    or v_reservation.razorpay_order_id is distinct from btrim(p_razorpay_order_id)
    or v_reservation.expected_total_paid is null
    or round(v_reservation.expected_total_paid * 100)::bigint <> p_captured_amount_paise then
   raise exception 'reservation and captured payment do not match';
 end if;
 select * into v_existing from public.orders where payment_id = btrim(p_payment_id);
 if found then
   if v_reservation.status <> 'CONSUMED'
      or v_existing.user_id is distinct from p_user_id
      or v_existing.vendor_id is distinct from v_reservation.vendor_id
      or v_existing.total_paid is distinct from v_reservation.expected_total_paid then
     raise exception 'captured payment requires reconciliation review';
   end if;
   return v_existing.id;
 end if;
 if v_reservation.status <> 'PAYMENT_PENDING' or v_reservation.abandoned_at is not null
    or v_reservation.expires_at < now() - interval '24 hours'
    or v_reservation.created_at < now() - interval '30 hours' then
   raise exception 'captured payment requires reconciliation review';
 end if;
 if exists (
   select 1 from public.payment_reconciliation_refunds
   where reservation_id=p_reservation_id or payment_id=btrim(p_payment_id)
 ) then
   raise exception 'refund reconciliation is already in progress';
 end if;
 if exists (
   select 1 from public.reward_redemptions r
   where r.reservation_id=p_reservation_id
      and (r.status <> 'RESERVED' or r.order_id is not null
           or r.razorpay_order_id is distinct from v_reservation.razorpay_order_id)
 ) then
   raise exception 'reward hold requires reconciliation review';
 end if;
 if not exists (select 1 from public.inventory_reservation_items where reservation_id=p_reservation_id) then
   raise exception 'empty paid reservation requires reconciliation review';
 end if;
 select * into v_vendor from public.vendors where id=v_reservation.vendor_id;
 if not found or v_vendor.admin_suspended is true then
   raise exception 'paid store is unavailable; manual reconciliation required';
 end if;
 for v_line in
   select i.product_id, i.quantity, i.unit_price
   from public.inventory_reservation_items i
   where i.reservation_id=p_reservation_id order by i.product_id
 loop
   select * into v_product from public.products where id=v_line.product_id for update;
   if not found or v_product.vendor_id is distinct from v_reservation.vendor_id
      or v_product.in_stock is not true or v_product.price is distinct from v_line.unit_price then
     raise exception 'paid basket changed; manual reconciliation required';
   end if;
 end loop;
 -- Only extend expiry inside this transaction, so finalize_grocery_order
 -- atomically validates stock, decrements quantity, creates a uniquely paid order,
 -- and marks the reservation consumed. Any failure rolls the extension back.
 update public.inventory_reservations
 set expires_at=greatest(expires_at,now()+interval '10 minutes')
 where id=p_reservation_id and status='PAYMENT_PENDING' and abandoned_at is null;
 if not found then raise exception 'paid reservation requires reconciliation review'; end if;
 v_order_id := public.finalize_grocery_order(
   p_user_id,p_reservation_id,btrim(p_razorpay_order_id),btrim(p_payment_id),p_captured_amount_paise
 );
 -- Completion of the Zeshu Cash hold must be in the same DB transaction.
 if exists (select 1 from public.reward_redemptions where reservation_id=p_reservation_id and status='RESERVED') then
   perform public.consume_zeshu_cash_redemption(p_reservation_id,v_order_id);
 end if;
 return v_order_id;
end;
$function$
;
REVOKE ALL ON FUNCTION public.reconcile_captured_expired_test_checkout(uuid,uuid,text,text,bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_captured_expired_test_checkout(uuid,uuid,text,text,bigint) TO service_role;
