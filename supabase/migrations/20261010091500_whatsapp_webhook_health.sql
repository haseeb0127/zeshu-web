-- Record only aggregated, HMAC-authenticated webhook health; no messages, numbers, or tokens.
create table if not exists public.whatsapp_webhook_health(
  singleton_id smallint primary key default 1 check(singleton_id=1),
  signed_callbacks bigint not null default 0,
  matching_account_callbacks bigint not null default 0,
  inbound_message_events bigint not null default 0,
  last_signed_at timestamptz,
  last_matching_account_at timestamptz,
  last_inbound_at timestamptz
);
alter table public.whatsapp_webhook_health enable row level security;
revoke all on public.whatsapp_webhook_health from public,anon,authenticated;
grant select,insert,update on public.whatsapp_webhook_health to service_role;
create or replace function public.record_verified_whatsapp_webhook(
  p_matches_account boolean,p_inbound_count integer
) returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if p_matches_account is null or p_inbound_count is null
    or p_inbound_count < 0 or p_inbound_count > 50 then return false; end if;
  insert into public.whatsapp_webhook_health (
    singleton_id,signed_callbacks,matching_account_callbacks,inbound_message_events,
    last_signed_at,last_matching_account_at,last_inbound_at
  ) values(
    1,1,case when p_matches_account then 1 else 0 end,p_inbound_count,
    now(),case when p_matches_account then now() else null end,
    case when p_inbound_count>0 then now() else null end
  )
  on conflict(singleton_id) do update set
    signed_callbacks = public.whatsapp_webhook_health.signed_callbacks+1,
    matching_account_callbacks = public.whatsapp_webhook_health.matching_account_callbacks+
      (case when p_matches_account then 1 else 0 end),
    inbound_message_events=public.whatsapp_webhook_health.inbound_message_events+p_inbound_count,
    last_signed_at=now(),
    last_matching_account_at=case when p_matches_account then now()
      else public.whatsapp_webhook_health.last_matching_account_at end,
    last_inbound_at=case when p_inbound_count>0 then now()
      else public.whatsapp_webhook_health.last_inbound_at end;
  return true;
end $$;
revoke all on function public.record_verified_whatsapp_webhook(boolean,integer)
  from public,anon,authenticated;
grant execute on function public.record_verified_whatsapp_webhook(boolean,integer) to service_role;
