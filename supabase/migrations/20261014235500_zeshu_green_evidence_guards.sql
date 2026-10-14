-- Never count partner-reported plantings without basic planting details.
-- PostgreSQL CHECK accepts NULL (UNKNOWN), so every required evidence field
-- is COALESCE'd before checking. No existing real plantings in Zeshu's pilot.
alter table public.zeshu_green_tree_commitments
  drop constraint if exists green_verified_tree_evidence;

alter table public.zeshu_green_tree_commitments
  add constraint green_reported_tree_evidence check (
    status not in ('PLANTED','VERIFIED') or (
      planted_at is not null
      and length(trim(coalesce(native_species,'')))>=2
      and length(trim(coalesce(planting_area,'')))>=3
      and length(trim(coalesce(partner_reference,'')))>=3
    )
  ),
  add constraint green_verified_tree_evidence check (
    status <> 'VERIFIED' or (
      planted_at is not null
      and verified_at is not null
      and verified_at >= planted_at
      and coalesce(proof_url,'') ~ '^https://[^[:space:]]+$'
      and length(trim(coalesce(native_species,'')))>=2
      and length(trim(coalesce(planting_area,'')))>=3
      and length(trim(coalesce(partner_reference,'')))>=3
    )
  );

comment on table public.zeshu_green_tree_commitments is
  'One order-linked, private future commitment. PLANTED requires partner-reported real species/site/date/reference; VERIFIED additionally requires HTTPS evidence and chronological verification. No historical TEST order backfill.';
