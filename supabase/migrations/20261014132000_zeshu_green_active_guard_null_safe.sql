-- Harden ACTIVE guard against SQL three-valued NULL checks.
-- PostgreSQL CHECK constraints accept UNKNOWN, so nullable partner URL and
-- tree-cost fields must be explicitly checked with COALESCE.
alter table public.zeshu_green_program
  drop constraint if exists zeshu_green_activation_guard;
alter table public.zeshu_green_program
  add constraint zeshu_green_activation_guard check (
    mode <> 'ACTIVE' or (
      activated_at is not null
      and verified_partner_agreement
      and live_order_payments_verified
      and length(trim(coalesce(planting_partner,'')))>=3
      and coalesce(partner_public_website,'') ~ '^https://[^[:space:]]+$'
      and coalesce(tree_unit_budget_paise,0) between 100 and 100000
      and funded_tree_quota > 0
    )
  );
