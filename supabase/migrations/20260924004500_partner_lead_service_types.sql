alter table public.partner_leads
  drop constraint if exists partner_leads_partner_type_check;

alter table public.partner_leads
  add constraint partner_leads_partner_type_check
  check (
    partner_type in (
      'LOCAL_VENDOR',
      'LICENSED_PHARMACY',
      'MEDICINE_DISTRIBUTOR',
      'RECHARGE_BILLS',
      'MOBILITY',
      'LOGISTICS_COURIER',
      'TRAVEL',
      'SPONSOR',
      'OTHER'
    )
  );

comment on column public.partner_leads.partner_type is
  'Business intake category. Mobility and logistics/courier are tracked separately for commercial and compliance follow-up.';
