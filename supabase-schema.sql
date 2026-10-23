-- EscalatePay schema
-- Run this in Supabase SQL Editor

-- Users profile
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  company_name text,
  email text,
  timezone text default 'America/New_York',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Invoices
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  number text not null,
  amount_minor integer not null,
  currency text not null default 'USD',
  issued_at timestamp with time zone not null default now(),
  due_at timestamp with time zone not null,
  status text not null default 'draft' check (status in ('draft','armed','paused','paid','cancelled')),
  recipient_name text not null,
  recipient_email text,
  recipient_phone text,
  recipient_timezone text not null default 'America/New_York',
  schedule jsonb not null default '{"day3":3,"day7":7,"day14":14,"day30":30}',
  armed_at timestamp with time zone,
  paid_at timestamp with time zone,
  late_fee_note text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Message templates (editable)
create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  step text not null check (step in ('day3','day7','day14','day30')),
  channel text not null check (channel in ('email','whatsapp','sms')),
  subject text,
  body text not null,
  updated_at timestamp with time zone default now(),
  unique(owner_id, step, channel)
);

-- Send jobs (scheduler)
create table if not exists public.send_jobs (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  step text not null check (step in ('day3','day7','day14','day30')),
  channel text not null check (channel in ('email','whatsapp','sms')),
  due_at timestamp with time zone not null,
  status text not null default 'pending' check (status in ('pending','processing','sent','failed','cancelled')),
  attempts integer not null default 0,
  last_attempt_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Send log (audit trail)
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
  sent_at timestamp with time zone default now()
);

-- Opt outs
create table if not exists public.opt_outs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  email text,
  phone text,
  reason text,
  created_at timestamp with time zone default now(),
  unique(owner_id, email),
  unique(owner_id, phone)
);

-- Sender settings (user brings their own or uses defaults)
create table if not exists public.sender_settings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade unique,
  default_channel text not null default 'email' check (default_channel in ('email','whatsapp','sms')),
  email_provider text not null default 'platform' check (email_provider in ('platform','own_smtp','own_gmail')),
  reply_to_email text,
  sms_provider text not null default 'tap' check (sms_provider in ('tap','android_gateway','twilio')),
  whatsapp_provider text not null default 'tap' check (whatsapp_provider in ('tap','bridge','cloud')),
  quiet_hours_start integer not null default 9,
  quiet_hours_end integer not null default 18,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.invoices enable row level security;
alter table public.message_templates enable row level security;
alter table public.send_jobs enable row level security;
alter table public.send_logs enable row level security;
alter table public.opt_outs enable row level security;
alter table public.sender_settings enable row level security;

create policy "Users manage their profile" on public.profiles for all using (auth.uid() = id);
create policy "Users manage their invoices" on public.invoices for all using (auth.uid() = owner_id);
create policy "Users manage their templates" on public.message_templates for all using (auth.uid() = owner_id);
create policy "Users see their jobs" on public.send_jobs for all using (auth.uid() = (select owner_id from public.invoices where id = invoice_id));
create policy "Users see their logs" on public.send_logs for all using (auth.uid() = owner_id);
create policy "Users manage opt outs" on public.opt_outs for all using (auth.uid() = owner_id);
create policy "Users manage sender settings" on public.sender_settings for all using (auth.uid() = owner_id);
