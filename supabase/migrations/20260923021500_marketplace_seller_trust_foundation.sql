alter table public.vendors
  add column if not exists marketplace_status text not null default 'PENDING',
  add column if not exists kyc_verified boolean not null default false,
  add column if not exists gst_verified boolean not null default false,
  add column if not exists authorized_brand_partner boolean not null default false,
  add column if not exists invoice_available boolean not null default false,
  add column if not exists seller_quality_score numeric(5,2) not null default 0,
  add column if not exists trust_updated_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'vendors_marketplace_status_check') then
    alter table public.vendors
      add constraint vendors_marketplace_status_check
      check (marketplace_status in ('PENDING','VERIFIED','SUSPENDED'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'vendors_seller_quality_score_check') then
    alter table public.vendors
      add constraint vendors_seller_quality_score_check
      check (seller_quality_score >= 0 and seller_quality_score <= 100);
  end if;
end $$;

comment on column public.vendors.marketplace_status is
  'Marketplace trust state controlled by Zeshu admin. VERIFIED is not inferred from advertising or seller payment.';
comment on column public.vendors.kyc_verified is
  'True only after Zeshu has verified the seller identity/KYC evidence.';
comment on column public.vendors.gst_verified is
  'True only after Zeshu has verified GST details where applicable.';
comment on column public.vendors.authorized_brand_partner is
  'True only when applicable brand/distributor authorization evidence has been reviewed.';
comment on column public.vendors.invoice_available is
  'Whether the seller can provide the applicable customer invoice for marketplace orders.';
comment on column public.vendors.seller_quality_score is
  'Internal 0-100 reliability score used as one recommendation signal; paid placement must not directly set this value.';
