-- Fulfillment admin mutations are server-side only.
-- The API authenticates the admin, then calls these RPCs with the service role.

revoke execute on function public.admin_update_product_fulfillment(
  uuid,uuid,text,boolean,boolean,boolean,integer,numeric,numeric,numeric,text,integer,numeric,integer,numeric,numeric,numeric,numeric,numeric,numeric
) from anon, authenticated;
grant execute on function public.admin_update_product_fulfillment(
  uuid,uuid,text,boolean,boolean,boolean,integer,numeric,numeric,numeric,text,integer,numeric,integer,numeric,numeric,numeric,numeric,numeric,numeric
) to service_role;

do $$
begin
  if to_regprocedure('public.admin_update_fulfillment_settings(uuid,boolean,numeric,numeric,numeric,numeric,numeric,boolean,text)') is not null then
    revoke execute on function public.admin_update_fulfillment_settings(
      uuid,boolean,numeric,numeric,numeric,numeric,numeric,boolean,text
    ) from anon, authenticated;
    grant execute on function public.admin_update_fulfillment_settings(
      uuid,boolean,numeric,numeric,numeric,numeric,numeric,boolean,text
    ) to service_role;
  end if;
end $$;
