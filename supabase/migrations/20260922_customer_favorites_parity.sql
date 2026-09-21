-- Restore customer favorites parity for sanitized/staging databases.
-- Safe to apply repeatedly; no customer data is modified.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.customer_favorites'::regclass
      and conname = 'customer_favorites_user_product_unique'
  ) then
    alter table public.customer_favorites
      add constraint customer_favorites_user_product_unique unique (user_id, product_id);
  end if;
end
$$;

create or replace function public.customer_add_favorite(p_product_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  if p_product_id is null
     or not exists (select 1 from public.products where id = p_product_id) then
    raise exception 'product not found';
  end if;

  insert into public.customer_favorites(user_id, product_id)
  values (v_user_id, p_product_id)
  on conflict (user_id, product_id) do nothing;

  return true;
end;
$$;

create or replace function public.customer_remove_favorite(p_product_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if p_product_id is null then
    raise exception 'product not found';
  end if;

  delete from public.customer_favorites
  where user_id = auth.uid()
    and product_id = p_product_id;

  return true;
end;
$$;

revoke all on function public.customer_add_favorite(uuid) from public, anon;
revoke all on function public.customer_remove_favorite(uuid) from public, anon;
grant execute on function public.customer_add_favorite(uuid) to authenticated, service_role;
grant execute on function public.customer_remove_favorite(uuid) to authenticated, service_role;
