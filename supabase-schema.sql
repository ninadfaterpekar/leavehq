-- ─────────────────────────────────────────
-- LeaveHQ — Supabase Schema
-- Paste this entire file into:
-- Supabase → SQL Editor → New query → Run
-- ─────────────────────────────────────────

-- ── 1. Profiles table (extends auth.users) ──
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null default 'employee' check (role in ('employee','supervisor','manager','admin')),
  manager_id uuid references public.profiles(id) on delete set null,
  annual_allowance integer not null default 20,
  daily_rate numeric(10,2) not null default 120.00,
  created_at timestamptz default now()
);

-- ── 2. Leave requests table ──
create table public.leave_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  leave_type text not null check (leave_type in ('annual','sick','unpaid')),
  start_date date not null,
  end_date date not null,
  working_days integer not null,
  note text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  manager_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── 3. Auto-create profile on signup ──
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 4. Auto-update updated_at ──
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_leave_request_updated
  before update on public.leave_requests
  for each row execute procedure public.handle_updated_at();

-- ── 5. Row Level Security ──
alter table public.profiles enable row level security;
alter table public.leave_requests enable row level security;

-- Profiles: users can read their own, managers can read their team, admins read all
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Managers can read their team"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role in ('manager', 'admin', 'supervisor')
    )
  );

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can update any profile"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Leave requests: users manage their own, managers see their team, admins see all
create policy "Users can read own requests"
  on public.leave_requests for select
  using (auth.uid() = user_id);

create policy "Users can insert own requests"
  on public.leave_requests for insert
  with check (auth.uid() = user_id);

create policy "Managers can read team requests"
  on public.leave_requests for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role in ('manager', 'admin', 'supervisor')
    )
  );

create policy "Managers can update team requests"
  on public.leave_requests for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role in ('manager', 'admin', 'supervisor')
    )
  );

-- ── 6. Seed data — demo users ──
-- NOTE: Create these users first via Supabase Auth → Users → Add user
-- Then run this to set their profiles. Replace UUIDs with real ones.

-- After creating users in Supabase Auth dashboard, run:
-- update public.profiles set full_name = 'Sarah Admin', role = 'admin', annual_allowance = 25, daily_rate = 200 where email = 'admin@leavehq.com';
-- update public.profiles set full_name = 'Mark Manager', role = 'manager', annual_allowance = 25, daily_rate = 180 where email = 'manager@leavehq.com';
-- update public.profiles set full_name = 'Sam Supervisor', role = 'supervisor', annual_allowance = 22, daily_rate = 150 where email = 'supervisor@leavehq.com';
-- update public.profiles set full_name = 'Jamie Employee', role = 'employee', annual_allowance = 20, daily_rate = 120 where email = 'employee1@leavehq.com';
-- update public.profiles set full_name = 'Alex Employee', role = 'employee', annual_allowance = 20, daily_rate = 120 where email = 'employee2@leavehq.com';

-- Then set manager relationships:
-- update public.profiles set manager_id = (select id from public.profiles where email = 'manager@leavehq.com') where email in ('employee1@leavehq.com', 'employee2@leavehq.com', 'supervisor@leavehq.com');
