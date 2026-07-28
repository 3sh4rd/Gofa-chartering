-- ===========================================================================
-- Gofa / Aquaholic Adventures — Supabase setup
-- Run this in your Supabase project:  Dashboard > SQL Editor > New query > paste > Run
-- ===========================================================================

-- 1) CUSTOMER ACCOUNTS -------------------------------------------------------
-- One row per visitor. customer_no is the human-friendly individual ID (1001, 1002, ...).
create table if not exists public.customers (
  id          uuid primary key default gen_random_uuid(),
  auth_uid    uuid unique references auth.users(id) on delete cascade,
  customer_no bigint generated always as identity (start with 1001),
  name        text,
  email       text,
  created_at  timestamptz default now()
);

-- 2) CHAT MESSAGES -----------------------------------------------------------
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  auth_uid    uuid,                                  -- the customer's auth id (used by security rules)
  sender      text not null check (sender in ('customer','admin')),
  body        text not null,
  created_at  timestamptz default now()
);
create index if not exists messages_customer_idx on public.messages(customer_id, created_at);

-- 3) ADMIN ALLOWLIST ---------------------------------------------------------
-- Add the email address(es) you will log into the admin page with.
create table if not exists public.admins ( email text primary key );

-- helper: is the current logged-in user an admin?
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins a where a.email = (auth.jwt() ->> 'email'));
$$;

-- 4) ROW-LEVEL SECURITY ------------------------------------------------------
alter table public.customers enable row level security;
alter table public.messages  enable row level security;
alter table public.admins    enable row level security;

-- customers: a visitor manages only their own row; admins can read all
drop policy if exists "cust_insert_own" on public.customers;
create policy "cust_insert_own" on public.customers
  for insert with check (auth.uid() = auth_uid);
drop policy if exists "cust_select_own" on public.customers;
create policy "cust_select_own" on public.customers
  for select using (auth.uid() = auth_uid or public.is_admin());
drop policy if exists "cust_update_own" on public.customers;
create policy "cust_update_own" on public.customers
  for update using (auth.uid() = auth_uid);

-- messages: visitor reads/writes their own thread; admin reads all and replies
drop policy if exists "msg_select" on public.messages;
create policy "msg_select" on public.messages
  for select using (auth.uid() = auth_uid or public.is_admin());
drop policy if exists "msg_insert_customer" on public.messages;
create policy "msg_insert_customer" on public.messages
  for insert with check (auth.uid() = auth_uid and sender = 'customer');
drop policy if exists "msg_insert_admin" on public.messages;
create policy "msg_insert_admin" on public.messages
  for insert with check (public.is_admin() and sender = 'admin');

-- admins table: only admins can read it
drop policy if exists "admins_select" on public.admins;
create policy "admins_select" on public.admins
  for select using (public.is_admin());

-- 5) REALTIME ----------------------------------------------------------------
alter publication supabase_realtime add table public.messages;

-- ===========================================================================
-- AFTER RUNNING THIS:
--   * Authentication > Providers > enable "Anonymous sign-ins"
--   * Authentication > Users > Add user  (create YOUR admin login: email + password)
--   * Then run, replacing with that same email:
--        insert into public.admins (email) values ('you@youremail.com');
-- ===========================================================================
