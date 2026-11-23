-- Expand existing professionally reviewed enquiry inbox to first-wave Zeshu
-- Services enquiries. No booking, driver dispatch or money is enabled.
alter table public.professional_service_enquiries
  add column if not exists service_category text;

alter table public.professional_service_enquiries
  drop constraint if exists professional_service_enquiries_service_type_check;

alter table public.professional_service_enquiries
  add constraint professional_service_enquiries_service_type_check
  check (service_type in ('WEDDING', 'INTERIORS', 'HOME_SERVICES'));

alter table public.professional_service_enquiries
  drop constraint if exists professional_service_enquiries_home_category_check;

alter table public.professional_service_enquiries
  add constraint professional_service_enquiries_home_category_check
  check (
    (service_type <> 'HOME_SERVICES' and service_category is null)
    or
    (service_type = 'HOME_SERVICES' and service_category in (
      'AC_REPAIR', 'ELECTRICIAN', 'PLUMBER', 'RO_APPLIANCE',
      'SALON', 'BEAUTICIAN', 'MEHNDI', 'MAKEUP'
    ))
  );

-- Preserve its existing administrative server-only access model.
alter table public.professional_service_enquiries enable row level security;
revoke all on table public.professional_service_enquiries from anon, authenticated;
grant select, insert, update, delete on table public.professional_service_enquiries to service_role;

comment on column public.professional_service_enquiries.service_category is
  'Home-service enquiry category only. No verified provider, booked visit, price, background check, wallet balance, or payment is implied.';
