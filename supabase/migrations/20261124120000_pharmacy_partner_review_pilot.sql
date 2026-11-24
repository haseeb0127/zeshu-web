-- Zeshu Pharmacy: admin-only verification of existing licensed pharmacy interest leads.
-- NO prescription uploads, drugs, payments, live delivery or subscriptions created here.
create table if not exists public.pharmacy_partner_reviews (
  lead_id uuid primary key references public.partner_leads(id) on delete cascade,
  licence_checked boolean not null default false,
  pharmacist_checked boolean not null default false,
  premises_checked boolean not null default false,
  district_checked boolean not null default false,
  records_privacy_checked boolean not null default false,
  restricted_categories_checked boolean not null default false,
  cold_chain_excluded boolean not null default false,
  pharmacy_invoice_checked boolean not null default false,
  agreement_checked boolean not null default false,
  notes text not null default '' check(char_length(notes)<=1000),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
comment on table public.pharmacy_partner_reviews is
 'Private human review of pharmacy partner interest. Checking boxes NEVER enables medicine sales.';
alter table public.pharmacy_partner_reviews enable row level security;
revoke all on table public.pharmacy_partner_reviews from public,anon,authenticated;
grant select,insert,update,delete on table public.pharmacy_partner_reviews to service_role;
