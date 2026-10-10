-- A guest's travel indication is advisory, never an automatic table booking,
-- proof of location, payment event, or kitchen start trigger.
alter table public.dine_bookings
  add column if not exists guest_journey_status text not null default 'NOT_STARTED',
  add column if not exists guest_eta_at timestamptz,
  add column if not exists guest_arrived_at timestamptz;

do $$
begin
 if not exists (
   select 1 from pg_constraint
    where conname='dine_guest_journey_status_check'
      and conrelid='public.dine_bookings'::regclass
 ) then
   alter table public.dine_bookings add constraint dine_guest_journey_status_check
      check (guest_journey_status in ('NOT_STARTED','ON_THE_WAY','ARRIVED'));
 end if;
end $$;

-- RLS and existing service-role-only privileges remain unchanged.
