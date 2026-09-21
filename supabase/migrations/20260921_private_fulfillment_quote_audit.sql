-- Private audit trail for the live courier quote and profitability decision.
-- Customers must never receive Zeshu's courier cost, contribution, or margin.

create table if not exists public.fulfillment_quote_audits (
  reservation_id uuid primary key references public.inventory_reservations(id) on delete cascade,
  provider text not null,
  courier_company_id integer,
  courier_name text,
  courier_cost numeric(12,2) not null check (courier_cost >= 0),
  customer_shipping_charge numeric(12,2) not null check (customer_shipping_charge >= 0),
  free_shipping boolean not null default false,
  contribution_rupees numeric(12,2) not null,
  margin_percent numeric(9,3) not null,
  minimum_contribution_rupees numeric(12,2) not null check (minimum_contribution_rupees >= 0),
  minimum_margin_percent numeric(9,3) not null check (minimum_margin_percent >= 0 and minimum_margin_percent <= 100),
  shipment_weight_kg numeric(12,3) not null check (shipment_weight_kg > 0),
  delivery_postcode text not null check (delivery_postcode ~ '^\d{6}$'),
  quoted_at timestamptz not null default now()
);

alter table public.fulfillment_quote_audits enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public'
      and tablename='fulfillment_quote_audits'
      and policyname='admins read fulfillment quote audits'
  ) then
    create policy "admins read fulfillment quote audits"
      on public.fulfillment_quote_audits
      for select
      to authenticated
      using (public.is_admin());
  end if;
end $$;

revoke insert, update, delete on public.fulfillment_quote_audits from anon, authenticated;
grant select on public.fulfillment_quote_audits to authenticated;
