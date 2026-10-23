-- ============================================================
-- EscalatePay - reminder scheduling upgrade
-- Paste into Supabase SQL Editor and press Run.
-- Safe to run more than once.
-- ============================================================

-- How often to remind each person, and how many times at most.
alter table public.debtors
  add column if not exists reminder_interval_days integer not null default 10,
  add column if not exists reminder_time text not null default '10:00',
  add column if not exists max_reminders integer not null default 6,
  add column if not exists reminder_count integer not null default 0,
  add column if not exists next_reminder_at timestamptz,
  add column if not exists auto_send boolean not null default false,
  add column if not exists reminder_message text;

-- Sensible bounds so nobody can turn this into spam.
alter table public.debtors
  drop constraint if exists debtors_interval_check;
alter table public.debtors
  add constraint debtors_interval_check
  check (reminder_interval_days >= 1 and reminder_interval_days <= 365);

alter table public.debtors
  drop constraint if exists debtors_max_reminders_check;
alter table public.debtors
  add constraint debtors_max_reminders_check
  check (max_reminders >= 1 and max_reminders <= 50);

-- When a person is added, the first reminder is due after one interval.
create or replace function public.set_first_reminder()
returns trigger
language plpgsql
as $$
begin
  if new.next_reminder_at is null and new.status <> 'paid' then
    new.next_reminder_at := now() + (new.reminder_interval_days || ' days')::interval;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_first_reminder on public.debtors;
create trigger trg_set_first_reminder
  before insert on public.debtors
  for each row execute function public.set_first_reminder();

-- Fills in any existing rows that have no next reminder yet.
update public.debtors
set next_reminder_at = now() + (reminder_interval_days || ' days')::interval
where next_reminder_at is null and status <> 'paid';

-- ============================================================
-- Check: this should list the new columns
-- ============================================================
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'debtors'
  and column_name in ('reminder_interval_days','reminder_time','max_reminders',
                      'reminder_count','next_reminder_at','auto_send','reminder_message')
order by column_name;
