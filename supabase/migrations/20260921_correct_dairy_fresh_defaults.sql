-- Corrective default: not every Dairy & Breakfast item is necessarily fresh.
-- Keep those products local-standard until a vendor/admin explicitly marks a specific
-- chilled/fresh item (milk, curd, paneer, etc.) as a 30-minute Fresh candidate.
update public.products
set
  delivery_mode = 'LOCAL_STANDARD',
  fresh_eligible = false
where lower(coalesce(category,'')) = 'dairy & breakfast'
  and delivery_mode = 'LOCAL_30_MIN'
  and fresh_eligible = true
  and nationwide_shipping_enabled = false;
