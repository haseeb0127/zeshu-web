alter table public.partner_leads
  add column if not exists consented_at timestamptz not null default now();
