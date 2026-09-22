revoke all on function public.vendor_get_tax_profile() from public;
revoke all on function public.vendor_upsert_tax_profile(text, boolean, text) from public;
grant execute on function public.vendor_get_tax_profile() to authenticated;
grant execute on function public.vendor_upsert_tax_profile(text, boolean, text) to authenticated;
