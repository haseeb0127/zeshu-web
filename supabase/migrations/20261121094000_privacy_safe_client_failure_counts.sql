-- Privacy-safe aggregate diagnostics for Android/website React recovery screens.
-- No device identifiers, IPs, routes, user IDs, error strings, session data,
-- payment information or raw browser traces are stored in this table.
create table if not exists public.zeshu_client_failure_daily_counts (
  event_date date not null default (now() at time zone 'UTC')::date,
  failure_kind text not null check (failure_kind in ('asset','storage','hydration','network','render')),
  route_group text not null check (route_group in ('home','dine','green','fashion','move','help','pay','account','admin','other')),
  failure_scope text not null check (failure_scope in ('root','page')),
  occurrences integer not null default 0 check (occurrences >= 0),
  last_seen_at timestamptz not null default now(),
  primary key(event_date,failure_kind,route_group,failure_scope)
);
alter table public.zeshu_client_failure_daily_counts enable row level security;
revoke all on table public.zeshu_client_failure_daily_counts from public,anon,authenticated;
grant select,insert,update on table public.zeshu_client_failure_daily_counts to service_role;

-- Invoker, not SECURITY DEFINER. The backend-only service role can execute.
create or replace function public.record_zeshu_client_failure(
  p_kind text,p_group text,p_scope text
) returns void language plpgsql security invoker
set search_path = '' as $$
begin
  if p_kind not in ('asset','storage','hydration','network','render')
    or p_group not in ('home','dine','green','fashion','move','help','pay','account','admin','other')
    or p_scope not in ('root','page') then
    raise exception 'Invalid diagnostic category';
  end if;
  insert into public.zeshu_client_failure_daily_counts as c
    (event_date,failure_kind,route_group,failure_scope,occurrences,last_seen_at)
    values ((now() at time zone 'UTC')::date,p_kind,p_group,p_scope,1,now())
  on conflict (event_date,failure_kind,route_group,failure_scope)
    do update set
      occurrences=least(c.occurrences+1,2147483647),
      last_seen_at=now();
end
$$;
revoke all on function public.record_zeshu_client_failure(text,text,text) from public,anon,authenticated;
grant execute on function public.record_zeshu_client_failure(text,text,text) to service_role;
