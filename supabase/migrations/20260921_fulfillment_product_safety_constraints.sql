do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_nationwide_ready_check') then
    alter table public.products add constraint products_nationwide_ready_check
      check (
        not nationwide_shipping_enabled
        or (
          delivery_mode = 'INDIA_STANDARD'
          and requires_cold_chain = false
          and shipping_class not in ('COLD_CHAIN','LOCAL_ONLY')
          and packed_weight_grams is not null
          and packed_weight_grams > 0
        )
      );
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_fresh_delivery_mode_check') then
    alter table public.products add constraint products_fresh_delivery_mode_check
      check (not fresh_eligible or delivery_mode = 'LOCAL_30_MIN');
  end if;
end $$;
