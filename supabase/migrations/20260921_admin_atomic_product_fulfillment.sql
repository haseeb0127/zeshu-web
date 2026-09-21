create or replace function public.admin_update_product_fulfillment(
  p_admin_user_id uuid,
  p_product_id uuid,
  p_delivery_mode text,
  p_fresh_eligible boolean,
  p_nationwide_shipping_enabled boolean,
  p_requires_cold_chain boolean,
  p_packed_weight_grams integer,
  p_package_length_cm numeric,
  p_package_width_cm numeric,
  p_package_height_cm numeric,
  p_shipping_class text,
  p_min_nationwide_quantity integer,
  p_min_nationwide_order_value numeric,
  p_handling_minutes integer,
  p_cost_price numeric,
  p_packaging_cost numeric,
  p_handling_cost numeric,
  p_return_risk_percent numeric,
  p_min_contribution_rupees numeric,
  p_min_margin_percent numeric
)
returns public.products
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_product public.products%rowtype;
begin
  if p_admin_user_id is null
     or p_product_id is null
     or not exists (
       select 1
       from public.admin_roles
       where user_id = p_admin_user_id
         and role = 'admin'
     ) then
    raise exception 'admin access required';
  end if;

  if p_delivery_mode not in ('LOCAL_30_MIN','LOCAL_STANDARD','INDIA_STANDARD')
     or p_shipping_class not in ('STANDARD','FRAGILE','HEAVY','COLD_CHAIN','LOCAL_ONLY')
     or p_min_nationwide_quantity is null or p_min_nationwide_quantity < 1
     or p_min_nationwide_order_value is null or p_min_nationwide_order_value < 0
     or p_handling_minutes is null or p_handling_minutes < 0 or p_handling_minutes > 10080
     or (p_packed_weight_grams is not null and p_packed_weight_grams <= 0)
     or (p_package_length_cm is not null and p_package_length_cm <= 0)
     or (p_package_width_cm is not null and p_package_width_cm <= 0)
     or (p_package_height_cm is not null and p_package_height_cm <= 0)
     or (p_cost_price is not null and p_cost_price < 0)
     or p_packaging_cost is null or p_packaging_cost < 0
     or p_handling_cost is null or p_handling_cost < 0
     or p_return_risk_percent is null or p_return_risk_percent < 0 or p_return_risk_percent > 100
     or (p_min_contribution_rupees is not null and p_min_contribution_rupees < 0)
     or (p_min_margin_percent is not null and (p_min_margin_percent < 0 or p_min_margin_percent > 100)) then
    raise exception 'invalid fulfillment update';
  end if;

  if p_fresh_eligible and p_delivery_mode <> 'LOCAL_30_MIN' then
    raise exception 'invalid fresh fulfillment state';
  end if;

  if p_nationwide_shipping_enabled and (
    p_delivery_mode <> 'INDIA_STANDARD'
    or p_requires_cold_chain
    or p_shipping_class in ('COLD_CHAIN','LOCAL_ONLY')
    or p_packed_weight_grams is null
    or p_cost_price is null
  ) then
    raise exception 'nationwide product is not operationally ready';
  end if;

  update public.products
  set
    delivery_mode = p_delivery_mode,
    fresh_eligible = p_fresh_eligible,
    nationwide_shipping_enabled = p_nationwide_shipping_enabled,
    requires_cold_chain = p_requires_cold_chain,
    packed_weight_grams = p_packed_weight_grams,
    package_length_cm = p_package_length_cm,
    package_width_cm = p_package_width_cm,
    package_height_cm = p_package_height_cm,
    shipping_class = p_shipping_class,
    min_nationwide_quantity = p_min_nationwide_quantity,
    min_nationwide_order_value = p_min_nationwide_order_value,
    handling_minutes = p_handling_minutes
  where id = p_product_id
  returning * into v_product;

  if not found then
    raise exception 'product not found';
  end if;

  insert into public.product_fulfillment_profiles (
    product_id,
    cost_price,
    packaging_cost,
    handling_cost,
    return_risk_percent,
    min_contribution_rupees,
    min_margin_percent,
    updated_at
  ) values (
    p_product_id,
    p_cost_price,
    p_packaging_cost,
    p_handling_cost,
    p_return_risk_percent,
    p_min_contribution_rupees,
    p_min_margin_percent,
    now()
  )
  on conflict (product_id) do update set
    cost_price = excluded.cost_price,
    packaging_cost = excluded.packaging_cost,
    handling_cost = excluded.handling_cost,
    return_risk_percent = excluded.return_risk_percent,
    min_contribution_rupees = excluded.min_contribution_rupees,
    min_margin_percent = excluded.min_margin_percent,
    updated_at = now();

  return v_product;
end;
$$;

revoke all on function public.admin_update_product_fulfillment(
  uuid,uuid,text,boolean,boolean,boolean,integer,numeric,numeric,numeric,text,integer,numeric,integer,numeric,numeric,numeric,numeric,numeric,numeric
) from public;
revoke execute on function public.admin_update_product_fulfillment(
  uuid,uuid,text,boolean,boolean,boolean,integer,numeric,numeric,numeric,text,integer,numeric,integer,numeric,numeric,numeric,numeric,numeric,numeric
) from anon;
revoke execute on function public.admin_update_product_fulfillment(
  uuid,uuid,text,boolean,boolean,boolean,integer,numeric,numeric,numeric,text,integer,numeric,integer,numeric,numeric,numeric,numeric,numeric,numeric
) from authenticated;
grant execute on function public.admin_update_product_fulfillment(
  uuid,uuid,text,boolean,boolean,boolean,integer,numeric,numeric,numeric,text,integer,numeric,integer,numeric,numeric,numeric,numeric,numeric,numeric
) to service_role;
