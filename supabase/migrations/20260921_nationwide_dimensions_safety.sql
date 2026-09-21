-- Nationwide products need complete shipment dimensions before they can be customer-enabled.
-- Existing India candidates are currently disabled, so tightening this constraint is non-destructive.

alter table public.products
  drop constraint if exists products_nationwide_ready_check;

alter table public.products
  add constraint products_nationwide_ready_check
  check (
    not nationwide_shipping_enabled
    or (
      delivery_mode = 'INDIA_STANDARD'
      and requires_cold_chain = false
      and shipping_class = 'STANDARD'
      and packed_weight_grams is not null and packed_weight_grams > 0
      and package_length_cm is not null and package_length_cm > 0
      and package_width_cm is not null and package_width_cm > 0
      and package_height_cm is not null and package_height_cm > 0
    )
  );
