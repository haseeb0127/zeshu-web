-- Admin-only, manually initiated Zeshu WhatsApp service replies.
-- New Oct-2026 Meta model: only the first 1,000 service replies/month per number
-- are free. We conservatively allow <= 500 reservations in ANY rolling 35 days.
-- No marketing, utility/authentication templates, proactive sends or scheduling.
create table if not exists public.whatsapp_inbox_reply_attempts (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  thread_id uuid not null references public.whatsapp_inbox_threads(id) on delete restrict,
  admin_user_id uuid not null references auth.users(id),
  recipient_wa_id text not null check(recipient_wa_id ~ '^91[6-9][0-9]{9}$'),
  body text not null check(char_length(body) between 1 and 4000),
  state text not null default 'RESERVED'
    check(state in ('RESERVED','ACCEPTED','REJECTED','UNKNOWN')),
  provider_message_id text unique,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists whatsapp_inbox_reply_attempts_created_idx
  on public.whatsapp_inbox_reply_attempts(created_at desc);
create index if not exists whatsapp_inbox_reply_attempts_thread_idx
  on public.whatsapp_inbox_reply_attempts(thread_id,created_at desc);
alter table public.whatsapp_inbox_reply_attempts enable row level security;
revoke all on public.whatsapp_inbox_reply_attempts from public, anon, authenticated;
grant select, insert, update on public.whatsapp_inbox_reply_attempts to service_role;

-- Lock serializes simultaneous admin replies across all conversations.
-- Every reservation permanently consumes one of the rolling safety slots, even
-- if Meta rejects it or the network fails. That favors avoiding paid messages.
create or replace function public.reserve_free_whatsapp_service_reply(
  p_request_id uuid,p_thread_id uuid,p_admin_user_id uuid,p_body text
) returns jsonb
language plpgsql security definer set search_path=''
as $$
declare
 v_thread record;
 v_last_at timestamptz;
 v_used integer;
 v_attempt_id uuid;
 v_existing uuid;
begin
 if p_request_id is null or p_thread_id is null or p_admin_user_id is null
    or p_body is null or char_length(btrim(p_body)) not between 1 and 4000
    or not exists(select 1 from public.admin_roles ar
        where ar.user_id=p_admin_user_id and ar.role='admin')
 then return jsonb_build_object('status','DENIED');end if;
 perform pg_advisory_xact_lock(27282026);
 select id into v_existing from public.whatsapp_inbox_reply_attempts
 where request_id=p_request_id;
 if found then return jsonb_build_object('status','ALREADY_RESERVED');end if;
 select id,customer_wa_id,status into v_thread
   from public.whatsapp_inbox_threads where id=p_thread_id for update;
 if not found or v_thread.status<>'OPEN'
   or v_thread.customer_wa_id !~ '^91[6-9][0-9]{9}$'
 then return jsonb_build_object('status','NOT_ELIGIBLE');end if;
 select max(sent_at) into v_last_at from public.whatsapp_inbox_messages
   where thread_id=p_thread_id and direction='INBOUND'
     and sent_at<=now()+interval '1 minute';
 -- Margin avoids crossing Meta's 24-hour boundary while an API call runs.
 if v_last_at is null or v_last_at < now()-interval '23 hours 50 minutes'
 then return jsonb_build_object('status','WINDOW_CLOSED');end if;
 select count(*) into v_used from public.whatsapp_inbox_reply_attempts
 where created_at>=now()-interval '35 days';
 if v_used>=500 then return jsonb_build_object('status','FREE_LIMIT_REACHED');end if;
 insert into public.whatsapp_inbox_reply_attempts
   (request_id,thread_id,admin_user_id,recipient_wa_id,body)
 values (p_request_id,p_thread_id,p_admin_user_id,v_thread.customer_wa_id,btrim(p_body))
 returning id into v_attempt_id;
 return jsonb_build_object('status','RESERVED','attemptId',v_attempt_id);
end $$;
revoke all on function public.reserve_free_whatsapp_service_reply(uuid,uuid,uuid,text)
 from public,anon,authenticated;
grant execute on function public.reserve_free_whatsapp_service_reply(uuid,uuid,uuid,text)
 to service_role;
comment on table public.whatsapp_inbox_reply_attempts is
 'Manual customer-initiated non-template WhatsApp service replies; 500 reservations per rolling 35 days maximum, independently of Meta free-tier usage. Never retry ambiguous sends automatically.';
