-- Harden only auth-required SECURITY DEFINER RPCs.
-- The staging and production function inventories differ; skip absent routines.
-- Public product/vendor review read RPCs intentionally remain public.
do $migration$
begin
  if to_regprocedure('public.debit_zeshu_coins(numeric)') is not null then
    execute 'revoke execute on function public.debit_zeshu_coins(numeric) from public, anon';
    execute 'grant execute on function public.debit_zeshu_coins(numeric) to authenticated, service_role';
  end if;

  if to_regprocedure('public.vendor_get_tax_profile()') is not null then
    execute 'revoke execute on function public.vendor_get_tax_profile() from public, anon';
    execute 'grant execute on function public.vendor_get_tax_profile() to authenticated, service_role';
  end if;

  if to_regprocedure('public.vendor_upsert_tax_profile(text,boolean,text)') is not null then
    execute 'revoke execute on function public.vendor_upsert_tax_profile(text,boolean,text) from public, anon';
    execute 'grant execute on function public.vendor_upsert_tax_profile(text,boolean,text) to authenticated, service_role';
  end if;
end
$migration$;
