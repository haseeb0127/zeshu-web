-- Public access to these SECURITY DEFINER RPCs is unnecessary.
-- Each operation requires auth.uid() and should not be callable by anon.
-- Public review read endpoints remain available to unauthenticated visitors.
begin;
revoke execute on function public.debit_zeshu_coins(numeric) from public, anon;
grant execute on function public.debit_zeshu_coins(numeric) to authenticated, service_role;

revoke execute on function public.vendor_get_tax_profile() from public, anon;
grant execute on function public.vendor_get_tax_profile() to authenticated, service_role;

revoke execute on function public.vendor_upsert_tax_profile(text, boolean, text) from public, anon;
grant execute on function public.vendor_upsert_tax_profile(text, boolean, text) to authenticated, service_role;
commit;
