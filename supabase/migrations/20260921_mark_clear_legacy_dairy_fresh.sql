-- Mark only clearly fresh legacy dairy SKUs as Fresh candidates.
-- This does not create a 30-minute promise by itself; runtime location/store/rider
-- checks and vendor enablement are still required.
update public.products
set
  delivery_mode = 'LOCAL_30_MIN',
  fresh_eligible = true
where lower(coalesce(category,'')) = 'dairy'
  and lower(coalesce(name,'')) ~ '(milk|curd|paneer|yogurt|lassi|buttermilk)'
  and nationwide_shipping_enabled = false;
