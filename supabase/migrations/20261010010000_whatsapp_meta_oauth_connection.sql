-- Owner-authorized Meta Embedded Signup credentials for Zeshu's own WhatsApp account.
-- The access token is AES-256-GCM encrypted by the application before insertion.
-- Key material lives only in Cloudflare secrets, never in Postgres or GitHub.
create table if not exists public.whatsapp_meta_connections (
  singleton_id smallint primary key default 1 check (singleton_id = 1),
  waba_id text not null check (waba_id ~ '^[0-9]{5,32}$'),
  phone_number_id text not null check (phone_number_id ~ '^[0-9]{5,32}$'),
  display_phone_number text,
  verified_name text,
  meta_app_id text not null check (meta_app_id ~ '^[0-9]{5,32}$'),
  graph_version text not null check (graph_version ~ '^v[0-9]+\.[0-9]+$'),
  token_iv text not null,
  token_ciphertext text not null,
  token_auth_tag text not null,
  connected_by uuid not null references auth.users(id),
  connected_at timestamptz not null default now(),
  verified_at timestamptz not null default now(),
  sending_approved boolean not null default false check (sending_approved = false)
);
alter table public.whatsapp_meta_connections enable row level security;
revoke all on table public.whatsapp_meta_connections from PUBLIC, anon, authenticated;
grant select, insert, update, delete on table public.whatsapp_meta_connections to service_role;
comment on table public.whatsapp_meta_connections is
  'Service-role only encrypted Meta OAuth connection. Does not enable WhatsApp sender, message delivery, billing or webhook subscription.';
