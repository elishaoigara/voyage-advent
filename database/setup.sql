-- Voyage Advent: run once in a dedicated Supabase project's SQL Editor.
-- Then run seed.sql. This script does not alter other applications' tables.
begin;
create table if not exists public.voyage_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.voyage_admins enable row level security;
revoke all on public.voyage_admins from anon, authenticated;
grant select on public.voyage_admins to authenticated;
grant all on public.voyage_admins to service_role;
create policy "Staff can check own membership" on public.voyage_admins for select to authenticated using (user_id = (select auth.uid()));

create table if not exists public.voyage_products (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null, category text not null, size text not null,
  price integer not null check (price > 0 and price <= 1000000),
  description text not null, image text,
  featured boolean not null default false,
  collection text not null default 'favourites' check (collection in ('discovery','favourites')),
  occasions text[] not null default '{}',
  stock integer check (stock >= 0), active boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.voyage_products enable row level security;
revoke all on public.voyage_products from anon, authenticated;
grant select on public.voyage_products to anon, authenticated;
grant insert, update on public.voyage_products to authenticated;
grant all on public.voyage_products to service_role;
create policy "Public active catalogue" on public.voyage_products for select to anon using (active);
create policy "Staff catalogue read" on public.voyage_products for select to authenticated using (active or exists (select 1 from public.voyage_admins where user_id = (select auth.uid())));
create policy "Staff catalogue insert" on public.voyage_products for insert to authenticated with check (exists (select 1 from public.voyage_admins where user_id = (select auth.uid())));
create policy "Staff catalogue update" on public.voyage_products for update to authenticated using (exists (select 1 from public.voyage_admins where user_id = (select auth.uid()))) with check (exists (select 1 from public.voyage_admins where user_id = (select auth.uid())));
create index if not exists voyage_products_category on public.voyage_products(category) where active;

create table if not exists public.voyage_orders (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique,
  request_hash text not null,
  reference text not null unique,
  customer_name text not null, phone text not null, email text not null default '',
  fulfilment text not null check (fulfilment in ('delivery','collection')),
  address text not null default '', notes text not null default '',
  age_confirmed boolean not null check (age_confirmed),
  items jsonb not null check (jsonb_typeof(items)='array' and jsonb_array_length(items)>0),
  subtotal integer not null check (subtotal > 0),
  delivery_fee integer check (delivery_fee >= 0),
  status text not null default 'pending' check (status in ('pending','confirmed','preparing','ready','completed','cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','pending','paid','failed')),
  payment_reference text, admin_note text,
  stock_reserved jsonb not null default '[]',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.voyage_orders enable row level security;
revoke all on public.voyage_orders from anon, authenticated;
grant select on public.voyage_orders to authenticated;
grant all on public.voyage_orders to service_role;
create policy "Staff orders read" on public.voyage_orders for select to authenticated using (exists (select 1 from public.voyage_admins where user_id = (select auth.uid())));
create index if not exists voyage_orders_recent on public.voyage_orders(created_at desc);
create index if not exists voyage_orders_status on public.voyage_orders(status,created_at desc);

create table if not exists public.voyage_audit (
  id bigint generated always as identity primary key, actor uuid references auth.users(id) on delete set null,
  order_id uuid references public.voyage_orders(id), action text not null, details jsonb not null default '{}', created_at timestamptz not null default now()
);
alter table public.voyage_audit enable row level security;
revoke all on public.voyage_audit from anon, authenticated;
grant select on public.voyage_audit to authenticated;
grant all on public.voyage_audit to service_role;
grant usage, select on sequence public.voyage_audit_id_seq to service_role;
create policy "Staff audit read" on public.voyage_audit for select to authenticated using (exists (select 1 from public.voyage_admins where user_id = (select auth.uid())));
create index if not exists voyage_audit_actor on public.voyage_audit(actor);
create index if not exists voyage_audit_order on public.voyage_audit(order_id,created_at desc);

create table if not exists public.voyage_rate_limits (key text primary key, hits integer not null, expires_at timestamptz not null);
alter table public.voyage_rate_limits enable row level security;
-- Intentionally no client policies: only the server's service_role can access rate limits.
revoke all on public.voyage_rate_limits from anon, authenticated;
grant all on public.voyage_rate_limits to service_role;
-- Only the trusted server can call these functions. SECURITY INVOKER preserves role permissions.
create or replace function public.voyage_check_rate(p_key text, p_limit integer default 5)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare n integer;
begin
 delete from public.voyage_rate_limits where expires_at < now() - interval '1 day';
 insert into public.voyage_rate_limits(key,hits,expires_at) values(p_key,1,now()+interval '15 minutes')
 on conflict(key) do update set hits = case when public.voyage_rate_limits.expires_at < now() then 1 else public.voyage_rate_limits.hits+1 end,
 expires_at = case when public.voyage_rate_limits.expires_at < now() then now()+interval '15 minutes' else public.voyage_rate_limits.expires_at end returning hits into n;
 return n <= p_limit;
end; $$;
revoke all on function public.voyage_check_rate(text,integer) from public,anon,authenticated;
grant execute on function public.voyage_check_rate(text,integer) to service_role;

create or replace function public.voyage_update_order(p_order_id uuid,p_actor uuid,p_status text,p_delivery_fee integer,p_payment_status text,p_payment_reference text,p_admin_note text)
returns void language plpgsql security invoker set search_path = '' as $$
declare o public.voyage_orders%rowtype; line jsonb; p public.voyage_products%rowtype; reserved jsonb := '[]'::jsonb; q integer;
begin
 if not exists(select 1 from public.voyage_admins where user_id=p_actor) then raise exception 'Unauthorised'; end if;
 select * into o from public.voyage_orders where id=p_order_id for update;
 if not found then raise exception 'Order not found'; end if;
 if p_status not in ('pending','confirmed','preparing','ready','completed','cancelled') then raise exception 'Invalid order status'; end if;
 if p_payment_status not in ('unpaid','pending','paid','failed') then raise exception 'Invalid payment status'; end if;
 if p_delivery_fee is not null and (p_delivery_fee<0 or p_delivery_fee>100000) then raise exception 'Invalid delivery fee'; end if;
 if p_payment_status='paid' and length(trim(coalesce(p_payment_reference,'')))<5 then raise exception 'A verified payment reference is required'; end if;
 if o.payment_status='paid' and p_payment_status<>'paid' then raise exception 'Paid transactions cannot be cleared here. Record any refund separately.'; end if;
 if p_status<>o.status and not (
 (o.status='pending' and p_status in ('confirmed','cancelled')) or
 (o.status='confirmed' and p_status in ('preparing','cancelled')) or
 (o.status='preparing' and p_status in ('ready','cancelled')) or
 (o.status='ready' and p_status in ('completed','cancelled'))
 ) then raise exception 'Invalid order status transition'; end if;
 if p_status='confirmed' and o.status='pending' then
  if o.fulfilment='delivery' and p_delivery_fee is null then raise exception 'Confirm the delivery fee before accepting this order'; end if;
  for line in select value from jsonb_array_elements(o.items) order by value->>'id' loop
   select * into p from public.voyage_products where id=line->>'id' for update;
   if not found or not p.active then raise exception 'A product is no longer available'; end if;
   q := (line->>'quantity')::integer;
   if p.stock is not null then
    if p.stock<q then raise exception 'Insufficient stock for %',p.name; end if;
    update public.voyage_products set stock=stock-q,updated_at=now() where id=p.id;
    reserved := reserved || jsonb_build_array(jsonb_build_object('id',p.id,'quantity',q));
   end if;
  end loop;
 else reserved := o.stock_reserved;
 end if;
 if p_status='completed' and p_payment_status<>'paid' then raise exception 'Verify payment before completing the order'; end if;
 if p_status='cancelled' and o.status<>'cancelled' then
  for line in select value from jsonb_array_elements(o.stock_reserved) order by value->>'id' loop
   update public.voyage_products set stock=case when stock is null then null else stock+(line->>'quantity')::integer end,updated_at=now() where id=line->>'id';
  end loop;
  reserved := '[]'::jsonb;
 end if;
 update public.voyage_orders set status=p_status,delivery_fee=case when fulfilment='collection' then 0 else p_delivery_fee end,payment_status=p_payment_status,payment_reference=nullif(trim(p_payment_reference),''),admin_note=p_admin_note,stock_reserved=reserved,updated_at=now() where id=p_order_id;
 insert into public.voyage_audit(actor,order_id,action,details) values(p_actor,p_order_id,'staff_update',jsonb_build_object('from_status',o.status,'to_status',p_status,'payment_status',p_payment_status,'payment_reference',p_payment_reference,'delivery_fee',p_delivery_fee));
end; $$;
revoke all on function public.voyage_update_order(uuid,uuid,text,integer,text,text,text) from public,anon,authenticated;
grant execute on function public.voyage_update_order(uuid,uuid,text,integer,text,text,text) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('voyage-products','voyage-products',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy "Public product photos" on storage.objects for select to anon,authenticated using(bucket_id='voyage-products');
create policy "Staff product photo upload" on storage.objects for insert to authenticated with check(bucket_id='voyage-products' and exists(select 1 from public.voyage_admins where user_id=(select auth.uid())));
commit;

-- Admin provisioning (after creating the owner's user in Authentication > Users):
-- insert into public.voyage_admins(user_id) values ('OWNER_USER_UUID_HERE');
-- Disable public sign-ups in Supabase Auth. Only staff accounts are needed.
