-- ============================================================
-- EscalatePay - connect your own auto-send bridge
-- Paste into Supabase SQL Editor and press Run.
-- Safe to run more than once.
-- ============================================================

-- Which channel each person's reminders use.
alter table public.debtors
  add column if not exists reminder_channel text not null default 'whatsapp';

alter table public.debtors
  drop constraint if exists debtors_channel_check;
alter table public.debtors
  add constraint debtors_channel_check
  check (reminder_channel in ('whatsapp','sms'));

-- One bridge per person per channel. The credentials belong to the user,
-- so each row is theirs alone.
create table if not exists public.bridges (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('whatsapp','sms')),
  provider text not null check (provider in ('waha','sms_gateway')),
  endpoint text not null,
  auth_user text,
  auth_secret text,
  session_name text,
  enabled boolean not null default false,
  last_tested_at timestamptz,
  last_test_ok boolean,
  last_test_error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(owner_id, kind)
);

alter table public.bridges enable row level security;

drop policy if exists "own bridges" on public.bridges;
create policy "own bridges" on public.bridges
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Daily send counter, so a runaway loop cannot burn a SIM's quota.
create table if not exists public.bridge_daily_counts (
  owner_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  day date not null default current_date,
  sent integer not null default 0,
  primary key (owner_id, kind, day)
);

alter table public.bridge_daily_counts enable row level security;

drop policy if exists "own counts" on public.bridge_daily_counts;
create policy "own counts" on public.bridge_daily_counts
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Bumps the daily counter and returns the new total.
create or replace function public.bump_bridge_count(p_owner uuid, p_kind text)
returns integer
language plpgsql
security definer
as $$
declare
  new_count integer;
begin
  insert into public.bridge_daily_counts (owner_id, kind, day, sent)
  values (p_owner, p_kind, current_date, 1)
  on conflict (owner_id, kind, day)
  do update set sent = public.bridge_daily_counts.sent + 1
  returning sent into new_count;

  return new_count;
end;
$$;

-- ============================================================
-- Check: should list 'bridges', 'bridge_daily_counts', 'bump_bridge_count'
-- ============================================================
select table_name from information_schema.tables
where table_schema = 'public'
  and table_name in ('bridges','bridge_daily_counts')
union all
select routine_name from information_schema.routines
where routine_schema = 'public' and routine_name = 'bump_bridge_count';
