-- Home-service professionals register only as interested partners; they are
-- not automatically approved, listed, verified, assigned or billed.
-- Also reconcile two partnership types already accepted by the server which
-- were not permitted by the earlier database CHECK constraint.
alter table public.partner_leads
  drop constraint if exists partner_leads_partner_type_check;

alter table public.partner_leads
  add constraint partner_leads_partner_type_check
  check (partner_type in (
    'LOCAL_VENDOR','LICENSED_PHARMACY','MEDICINE_DISTRIBUTOR',
    'RECHARGE_BILLS','MOBILITY','LOGISTICS_COURIER','TRAVEL',
    'SPONSOR','OTHER','HOME_SERVICE_PRO'
  ));
