-- Admin-only WhatsApp Cloud API inbound inbox; no outbound delivery path.
-- Store only minimal text/unsupported-media placeholders, never raw webhook JSON.
create table if not exists public.whatsapp_inbox_threads (
  id uuid primary key default gen_random_uuid(),
  customer_wa_id text not null unique check (customer_wa_id ~ '^[1-9][0-9]{6,14}$'),
  display_name text not null default '',
  last_message_preview text not null default '',
  last_message_at timestamptz,
  status text not null default 'OPEN' check (status in ('OPEN','ARCHIVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.whatsapp_inbox_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.whatsapp_inbox_threads(id) on delete cascade,
  provider_message_id text not null unique check (length(provider_message_id) between 5 and 512),
  direction text not null default 'INBOUND' check (direction = 'INBOUND'),
  message_type text not null check (message_type in ('text','unsupported')),
  body text not null check (char_length(body) between 1 and 4000),
  sent_at timestamptz not null,
  received_at timestamptz not null default now()
);
create index if not exists whatsapp_inbox_threads_latest_idx on public.whatsapp_inbox_threads(last_message_at desc nulls last);
create index if not exists whatsapp_inbox_messages_thread_idx on public.whatsapp_inbox_messages(thread_id,sent_at desc);
create table if not exists public.whatsapp_inbox_drafts (
  thread_id uuid primary key references public.whatsapp_inbox_threads(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now()
);
alter table public.whatsapp_inbox_threads enable row level security;
alter table public.whatsapp_inbox_messages enable row level security;
alter table public.whatsapp_inbox_drafts enable row level security;
revoke all on public.whatsapp_inbox_threads,public.whatsapp_inbox_messages,public.whatsapp_inbox_drafts from public,anon,authenticated;
grant select,insert,update,delete on public.whatsapp_inbox_threads,public.whatsapp_inbox_messages,public.whatsapp_inbox_drafts to service_role;

-- Atomic, idempotent webhook ingestion, callable by service_role alone.
create or replace function public.ingest_whatsapp_inbox_message(
  p_customer_wa_id text,
  p_display_name text,
  p_provider_message_id text,
  p_message_type text,
  p_body text,
  p_sent_at timestamptz
) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_thread_id uuid;
  v_inserted uuid;
  v_name text;
begin
  if p_customer_wa_id is null or p_customer_wa_id !~ '^[1-9][0-9]{6,14}$'
    or p_provider_message_id is null or char_length(p_provider_message_id) not between 5 and 512
    or p_message_type not in ('text','unsupported')
    or p_body is null or char_length(p_body) not between 1 and 4000
    or p_sent_at is null or p_sent_at < timestamptz '2020-01-01'
    or p_sent_at > now() + interval '1 day' then
    return false;
  end if;
  v_name := left(coalesce(p_display_name,''),100);
  insert into public.whatsapp_inbox_threads(customer_wa_id,display_name)
    values(p_customer_wa_id,v_name)
    on conflict(customer_wa_id) do update
      set display_name = case when excluded.display_name <> ''
        then excluded.display_name else public.whatsapp_inbox_threads.display_name end
    returning id into v_thread_id;
  insert into public.whatsapp_inbox_messages(thread_id,provider_message_id,message_type,body,sent_at)
    values(v_thread_id,p_provider_message_id,p_message_type,p_body,p_sent_at)
    on conflict(provider_message_id) do nothing returning id into v_inserted;
  if v_inserted is not null then
    update public.whatsapp_inbox_threads
    set last_message_at = greatest(coalesce(last_message_at,p_sent_at),p_sent_at),
        last_message_preview = case when last_message_at is null or p_sent_at >= last_message_at then left(p_body,160) else last_message_preview end,
        updated_at = now()
    where id = v_thread_id;
  end if;
  return true;
end $$;
revoke all on function public.ingest_whatsapp_inbox_message(text,text,text,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.ingest_whatsapp_inbox_message(text,text,text,text,text,timestamptz) to service_role;

comment on table public.whatsapp_inbox_threads is 'Service-role-only customer WhatsApp inbox. No outbound messages are sent by this feature.';
comment on table public.whatsapp_inbox_drafts is 'Admin drafts only; saving never sends a WhatsApp message.';
