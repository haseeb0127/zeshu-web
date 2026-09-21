-- Keep live courier costs and profitability decisions server-only.
-- Admin screens can read these later through an authenticated server API using the service role.

drop policy if exists "admins read fulfillment quote audits" on public.fulfillment_quote_audits;
revoke all on public.fulfillment_quote_audits from anon, authenticated;
grant select, insert, update, delete on public.fulfillment_quote_audits to service_role;
