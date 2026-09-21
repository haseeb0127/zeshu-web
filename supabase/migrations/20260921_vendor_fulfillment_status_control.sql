create or replace function public.vendor_set_fulfillment_status(p_local_30_min_enabled boolean)
returns public.vendors
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_vendor public.vendors%rowtype;
begin
  if auth.uid() is null or p_local_30_min_enabled is null then
    raise exception 'invalid vendor fulfillment status';
  end if;

  update public.vendors
  set local_30_min_enabled = p_local_30_min_enabled
  where owner_id = auth.uid()
  returning * into v_vendor;

  if not found then
    raise exception 'vendor not found';
  end if;

  return v_vendor;
end;
$$;

revoke all on function public.vendor_set_fulfillment_status(boolean) from public;
revoke execute on function public.vendor_set_fulfillment_status(boolean) from anon;
grant execute on function public.vendor_set_fulfillment_status(boolean) to authenticated;
