-- Admin-only global delivery/profitability settings.
-- Nationwide checkout remains off unless an admin explicitly enables it
-- after a courier provider has been configured.

create or replace function public.admin_update_fulfillment_settings(
  p_admin_user_id uuid,
  p_nationwide_checkout_enabled boolean,
  p_default_min_contribution_rupees numeric,
  p_default_min_margin_percent numeric,
  p_payment_fee_percent numeric,
  p_default_rto_allowance_percent numeric,
  p_default_operating_cost_percent numeric,
  p_free_shipping_enabled boolean,
  p_courier_provider text
)
returns public.fulfillment_settings
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.fulfillment_settings%rowtype;
  v_provider text;
begin
  if p_admin_user_id is null
     or not exists (
       select 1
       from public.admin_roles
       where user_id = p_admin_user_id
         and role = 'admin'
     )
  then
    raise exception 'admin access required';
  end if;

  if p_nationwide_checkout_enabled is null
     or p_free_shipping_enabled is null
     or p_default_min_contribution_rupees is null
     or p_default_min_margin_percent is null
     or p_payment_fee_percent is null
     or p_default_rto_allowance_percent is null
     or p_default_operating_cost_percent is null
     or p_default_min_contribution_rupees < 0
     or p_default_min_margin_percent < 0 or p_default_min_margin_percent > 100
     or p_payment_fee_percent < 0 or p_payment_fee_percent > 100
     or p_default_rto_allowance_percent < 0 or p_default_rto_allowance_percent > 100
     or p_default_operating_cost_percent < 0 or p_default_operating_cost_percent > 100
  then
    raise exception 'invalid fulfillment settings';
  end if;

  v_provider := nullif(upper(btrim(coalesce(p_courier_provider, ''))), '');

  if p_nationwide_checkout_enabled and v_provider is null then
    raise exception 'courier provider required';
  end if;

  insert into public.fulfillment_settings (
    id,
    nationwide_checkout_enabled,
    default_min_contribution_rupees,
    default_min_margin_percent,
    payment_fee_percent,
    default_rto_allowance_percent,
    default_operating_cost_percent,
    free_shipping_enabled,
    courier_provider,
    updated_at
  ) values (
    'default',
    p_nationwide_checkout_enabled,
    p_default_min_contribution_rupees,
    p_default_min_margin_percent,
    p_payment_fee_percent,
    p_default_rto_allowance_percent,
    p_default_operating_cost_percent,
    p_free_shipping_enabled,
    v_provider,
    now()
  )
  on conflict (id) do update set
    nationwide_checkout_enabled = excluded.nationwide_checkout_enabled,
    default_min_contribution_rupees = excluded.default_min_contribution_rupees,
    default_min_margin_percent = excluded.default_min_margin_percent,
    payment_fee_percent = excluded.payment_fee_percent,
    default_rto_allowance_percent = excluded.default_rto_allowance_percent,
    default_operating_cost_percent = excluded.default_operating_cost_percent,
    free_shipping_enabled = excluded.free_shipping_enabled,
    courier_provider = excluded.courier_provider,
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.admin_update_fulfillment_settings(uuid,boolean,numeric,numeric,numeric,numeric,numeric,boolean,text) from public;
grant execute on function public.admin_update_fulfillment_settings(uuid,boolean,numeric,numeric,numeric,numeric,numeric,boolean,text) to authenticated;
