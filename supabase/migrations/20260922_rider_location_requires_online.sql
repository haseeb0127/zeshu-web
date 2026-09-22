-- Offline or suspended riders must not publish live GPS.
-- Customer tracking already treats offline riders as unavailable; enforce the same rule at write time.

create or replace function public.rider_update_location(
  p_latitude numeric,
  p_longitude numeric,
  p_accuracy_meters numeric default null
)
returns public.riders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rider public.riders%rowtype;
begin
  if auth.uid() is null then
    raise exception 'rider authentication required';
  end if;

  if p_latitude is null
     or p_longitude is null
     or p_latitude < -90
     or p_latitude > 90
     or p_longitude < -180
     or p_longitude > 180
     or (p_accuracy_meters is not null and p_accuracy_meters < 0) then
    raise exception 'invalid rider location';
  end if;

  update public.riders
  set current_latitude = p_latitude,
      current_longitude = p_longitude,
      current_location_accuracy_meters = p_accuracy_meters,
      location_updated_at = now()
  where user_id = auth.uid()
    and admin_suspended = false
    and is_active = true
  returning * into v_rider;

  if not found then
    raise exception 'rider is not available';
  end if;

  return v_rider;
end;
$$;

revoke all on function public.rider_update_location(numeric,numeric,numeric) from public, anon;
grant execute on function public.rider_update_location(numeric,numeric,numeric) to authenticated;
