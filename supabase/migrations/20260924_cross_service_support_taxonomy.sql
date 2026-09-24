-- Cross-service Zeshu Support foundation.
-- Additive only: existing support_conversations/support_messages continue to work.
-- Keep external providers customer-transparent while retaining provider references internally.

alter table if exists public.support_conversations
  add column if not exists support_service text,
  add column if not exists issue_type text,
  add column if not exists severity text,
  add column if not exists priority smallint,
  add column if not exists provider_reference text,
  add column if not exists service_reference text,
  add column if not exists conversation_summary text,
  add column if not exists ai_attempted boolean not null default false,
  add column if not exists ai_resolved boolean,
  add column if not exists escalation_reason text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'support_conversations_support_service_check'
  ) then
    alter table public.support_conversations add constraint support_conversations_support_service_check
      check (support_service is null or support_service in ('COMMERCE','MARKETPLACE','DIGITAL','MOBILITY','COURIER','CAR_SHARE','TRAVEL','ACCOUNT','REWARDS','OTHER'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'support_conversations_severity_check'
  ) then
    alter table public.support_conversations add constraint support_conversations_severity_check
      check (severity is null or severity in ('P0','P1','P2','P3'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'support_conversations_priority_check'
  ) then
    alter table public.support_conversations add constraint support_conversations_priority_check
      check (priority is null or priority between 0 and 3);
  end if;
end $$;

create index if not exists support_conversations_service_status_idx
  on public.support_conversations (support_service, status, updated_at desc);

create index if not exists support_conversations_priority_idx
  on public.support_conversations (priority, updated_at desc)
  where status <> 'RESOLVED';

comment on column public.support_conversations.provider_reference is
  'Internal provider/seller reference only; never expose provider credentials or secrets.';
comment on column public.support_conversations.service_reference is
  'Order/ride/courier/travel/recharge reference where applicable.';
comment on column public.support_conversations.severity is
  'P0 immediate safety, P1 money/active service, P2 fulfilment/service, P3 general information.';
