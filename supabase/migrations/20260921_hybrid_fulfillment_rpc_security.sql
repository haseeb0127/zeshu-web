-- Restrict vendor fulfillment RPCs to signed-in users only.
revoke execute on function public.vendor_update_product_fulfillment(
  uuid,text,boolean,boolean,boolean,integer,numeric,numeric,numeric,text,integer,numeric,integer,numeric,numeric,numeric,numeric,numeric,numeric
) from anon;
revoke execute on function public.vendor_get_product_fulfillment(uuid) from anon;

grant execute on function public.vendor_update_product_fulfillment(
  uuid,text,boolean,boolean,boolean,integer,numeric,numeric,numeric,text,integer,numeric,integer,numeric,numeric,numeric,numeric,numeric,numeric
) to authenticated;
grant execute on function public.vendor_get_product_fulfillment(uuid) to authenticated;
