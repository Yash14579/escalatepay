-- ============================================================
-- EscalatePay - reminder history for debtors
-- Paste into Supabase SQL Editor and press Run.
-- Safe to run more than once.
-- ============================================================

create table if not exists public.debtor_reminder_logs (
  id uuid primary key default gen_random_uuid(),
  debtor_id uuid not null references public.debtors(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  channel text not null default 'whatsapp'
    check (channel in ('email','whatsapp','sms')),
  outcome text not null default 'queued'
    check (outcome in ('sent','queued','failed','skipped')),
  to_address text not null,
  body text not null,
  error text,
  created_at timestamptz default now()
);

create index if not exists debtor_reminder_logs_debtor_idx
  on public.debtor_reminder_logs (debtor_id, created_at desc);

alter table public.debtor_reminder_logs enable row level security;

drop policy if exists "own debtor logs" on public.debtor_reminder_logs;
create policy "own debtor logs" on public.debtor_reminder_logs
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ============================================================
-- Check
-- ============================================================
select table_name
from information_schema.tables
where table_schema = 'public' and table_name = 'debtor_reminder_logs';
