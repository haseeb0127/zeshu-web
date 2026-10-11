-- Aggregate-only, service-role-only WhatsApp event-shape counters.
-- No customer phone numbers, message content, access tokens or Meta payloads.
alter table public.whatsapp_webhook_health
  add column if not exists messages_field_callbacks bigint not null default 0,
  add column if not exists phone_messages_callbacks bigint not null default 0,
  add column if not exists candidate_message_events bigint not null default 0,
  add column if not exists ignored_message_events bigint not null default 0,
  add column if not exists last_messages_field_at timestamptz,
  add column if not exists last_phone_messages_at timestamptz;
create or replace function public.record_verified_whatsapp_message_shape(
 p_messages_field boolean,p_phone_messages boolean,
 p_candidate_count integer,p_parsed_count integer
) returns boolean
language plpgsql security definer set search_path=''
as $$
begin
 if p_messages_field is null or p_phone_messages is null
   or p_candidate_count is null or p_parsed_count is null
   or p_candidate_count < 0 or p_candidate_count > 50
   or p_parsed_count < 0 or p_parsed_count > p_candidate_count
   or (p_phone_messages and not p_messages_field)
 then return false; end if;
 insert into public.whatsapp_webhook_health(
  singleton_id,messages_field_callbacks,phone_messages_callbacks,
  candidate_message_events,ignored_message_events,
  last_messages_field_at,last_phone_messages_at
 ) values(
  1,case when p_messages_field then 1 else 0 end,
  case when p_phone_messages then 1 else 0 end,
  p_candidate_count,p_candidate_count-p_parsed_count,
  case when p_messages_field then now() else null end,
  case when p_phone_messages then now() else null end
 )
 on conflict(singleton_id) do update set
  messages_field_callbacks=public.whatsapp_webhook_health.messages_field_callbacks+
    (case when p_messages_field then 1 else 0 end),
  phone_messages_callbacks=public.whatsapp_webhook_health.phone_messages_callbacks+
    (case when p_phone_messages then 1 else 0 end),
  candidate_message_events=public.whatsapp_webhook_health.candidate_message_events+p_candidate_count,
  ignored_message_events=public.whatsapp_webhook_health.ignored_message_events+
    (p_candidate_count-p_parsed_count),
  last_messages_field_at=case when p_messages_field then now()
    else public.whatsapp_webhook_health.last_messages_field_at end,
  last_phone_messages_at=case when p_phone_messages then now()
    else public.whatsapp_webhook_health.last_phone_messages_at end;
 return true;
end $$;
revoke all on function public.record_verified_whatsapp_message_shape(boolean,boolean,integer,integer)
 from public,anon,authenticated;
grant execute on function public.record_verified_whatsapp_message_shape(boolean,boolean,integer,integer)
 to service_role;
