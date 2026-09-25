drop policy if exists "driver applicant reads own application" on public.driver_applications;
create policy "driver applicant reads own application"
on public.driver_applications for select to authenticated
using (
  (select auth.uid()) is not null
  and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) is false
  and (select auth.uid()) = user_id
);

drop policy if exists "driver applicant reads own documents" on public.driver_documents;
create policy "driver applicant reads own documents"
on public.driver_documents for select to authenticated
using (
  (select auth.uid()) is not null
  and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) is false
  and (select auth.uid()) = user_id
);

drop policy if exists "driver applicant reads own eligibility" on public.driver_service_eligibility;
create policy "driver applicant reads own eligibility"
on public.driver_service_eligibility for select to authenticated
using (
  (select auth.uid()) is not null
  and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) is false
  and (select auth.uid()) = user_id
);

drop policy if exists "driver applicant uploads own verification files" on storage.objects;
create policy "driver applicant uploads own verification files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'driver-verification'
  and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) is false
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
