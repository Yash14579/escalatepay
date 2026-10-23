-- ============================================================
-- EscalatePay - complete database setup
-- Paste this whole file into Supabase SQL Editor and press Run.
-- Safe to run more than once.
-- ============================================================

-- 1. Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  company_name text,
  email text,
  timezone text default 'America/New_York',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Invoices
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  number text not null,
  amount_minor integer not null,
  currency text not null default 'USD',
  issued_at timestamptz not null default now(),
  due_at timestamptz not null,
  status text not null default 'draft'
    check (status in ('draft','armed','paused','paid','cancelled')),
  recipient_name text not null,
  recipient_email text,
  recipient_phone text,
  recipient_timezone text not null default 'America/New_York',
  schedule jsonb not null default '{"day3":3,"day7":7,"day14":14,"day30":30}'::jsonb,
  armed_at timestamptz,
  paid_at timestamptz,
  late_fee_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Message templates
create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  step text not null check (step in ('day3','day7','day14','day30')),
  channel text not null check (channel in ('email','whatsapp','sms')),
  subject text,
  body text not null,
  updated_at timestamptz default now(),
  unique(owner_id, step, channel)
);

-- 4. Send jobs
create table if not exists public.send_jobs (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  step text not null check (step in ('day3','day7','day14','day30')),
  channel text not null check (channel in ('email','whatsapp','sms')),
  due_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending','processing','sent','failed','cancelled')),
  attempts integer not null default 0,
  last_attempt_at timestamptz,
  created_at timestamptz default now()
);

-- 5. Send log
create table if not exists public.send_logs (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  step text not null check (step in ('day3','day7','day14','day30')),
  channel text not null check (channel in ('email','whatsapp','sms')),
  outcome text not null check (outcome in ('sent','failed','skipped','queued','cancelled')),
  to_address text not null,
  subject text,
  body text not null,
  provider_id text,
  error text,
  sent_at timestamptz default now()
);

-- 6. Opt outs
create table if not exists public.opt_outs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  email text,
  phone text,
  reason text,
  created_at timestamptz default now()
);

-- 7. Sender settings
create table if not exists public.sender_settings (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  default_channel text not null default 'email'
    check (default_channel in ('email','whatsapp','sms')),
  email_provider text not null default 'platform',
  reply_to_email text,
  sms_provider text not null default 'tap',
  whatsapp_provider text not null default 'tap',
  quiet_hours_start integer not null default 9,
  quiet_hours_end integer not null default 18,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 8. Debtors (people who owe you)
create table if not exists public.debtors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text not null,
  amount_minor integer not null,
  amount_paid_minor integer not null default 0,
  currency text not null default 'USD',
  reason text,
  due_date date,
  status text not null default 'pending'
    check (status in ('pending','reminded','partial','paid')),
  last_reminded_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 9. User settings
create table if not exists public.user_settings (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  currency text not null default 'USD',
  language text not null default 'en',
  theme text not null default 'system',
  quiet_hours_start integer not null default 9,
  quiet_hours_end integer not null default 18,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- Row level security: each user only sees their own rows
-- ============================================================
alter table public.profiles          enable row level security;
alter table public.invoices          enable row level security;
alter table public.message_templates enable row level security;
alter table public.send_jobs         enable row level security;
alter table public.send_logs         enable row level security;
alter table public.opt_outs          enable row level security;
alter table public.sender_settings   enable row level security;
alter table public.debtors           enable row level security;
alter table public.user_settings     enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own invoices" on public.invoices;
create policy "own invoices" on public.invoices
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "own templates" on public.message_templates;
create policy "own templates" on public.message_templates
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "own jobs" on public.send_jobs;
create policy "own jobs" on public.send_jobs
  for all using (auth.uid() = (select owner_id from public.invoices where id = invoice_id))
  with check (auth.uid() = (select owner_id from public.invoices where id = invoice_id));

drop policy if exists "own logs" on public.send_logs;
create policy "own logs" on public.send_logs
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "own opt outs" on public.opt_outs;
create policy "own opt outs" on public.opt_outs
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "own sender settings" on public.sender_settings;
create policy "own sender settings" on public.sender_settings
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "own debtors" on public.debtors;
create policy "own debtors" on public.debtors
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "own user settings" on public.user_settings;
create policy "own user settings" on public.user_settings
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ============================================================
-- Check: this should list 9 table names when it worked
-- ============================================================
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles','invoices','message_templates','send_jobs',
                     'send_logs','opt_outs','sender_settings','debtors','user_settings')
order by table_name;
