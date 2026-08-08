-- ===========================================================================
-- Aquaholic Adventures — Bookings + Availability
-- Run this in Supabase (SQL Editor) AFTER supabase-setup.sql
-- ===========================================================================

-- 1) BOOKINGS ----------------------------------------------------------------
create table if not exists public.bookings (
  id             uuid primary key default gen_random_uuid(),
  ref            text unique,
  tour           text not null,
  tour_date      date not null,
  tour_time      text,
  guests         int not null,
  traveler_names text,
  name           text not null,
  email          text not null,
  phone          text,
  pickup         boolean default false,
  total          numeric(10,2) not null,
  deposit        numeric(10,2) not null,
  payment_method text,                       -- 'paypal' | 'suncash'
  payment_status text default 'pending',     -- 'pending' | 'paid'
  payment_ref    text,
  created_at     timestamptz default now()
);
create index if not exists bookings_date_idx on public.bookings(tour_date);

-- 2) BLOCKED (unavailable) DATES --------------------------------------------
create table if not exists public.blocked_dates (
  d          date primary key,
  note       text,
  created_at timestamptz default now()
);

-- 3) SECURITY ----------------------------------------------------------------
alter table public.bookings enable row level security;
alter table public.blocked_dates enable row level security;

-- anyone can create a booking (public booking form); only admins can read them
drop policy if exists "book_insert_any" on public.bookings;
create policy "book_insert_any" on public.bookings for insert with check (true);
drop policy if exists "book_select_admin" on public.bookings;
create policy "book_select_admin" on public.bookings for select using (public.is_admin());
drop policy if exists "book_update_admin" on public.bookings;
create policy "book_update_admin" on public.bookings for update using (public.is_admin());

-- everyone can READ blocked dates (so the booking page can check availability);
-- only admins can add/remove them
drop policy if exists "blocked_read_all" on public.blocked_dates;
create policy "blocked_read_all" on public.blocked_dates for select using (true);
drop policy if exists "blocked_write_admin" on public.blocked_dates;
create policy "blocked_write_admin" on public.blocked_dates for all
  using (public.is_admin()) with check (public.is_admin());
