-- Habit Tracker: Supabase schema + RLS
-- Run this in Supabase SQL Editor (Query).

-- 1) Habits table
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists habits_user_id_idx on public.habits (user_id);

-- 2) Daily checks table
create table if not exists public.habit_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  habit_id uuid not null references public.habits (id) on delete cascade,
  date_key text not null,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists habit_checks_user_id_idx on public.habit_checks (user_id);
create index if not exists habit_checks_habit_id_idx on public.habit_checks (habit_id);
create unique index if not exists habit_checks_unique
  on public.habit_checks (user_id, habit_id, date_key);

-- Keep updated_at in sync
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists habit_checks_set_updated_at on public.habit_checks;
create trigger habit_checks_set_updated_at
before update on public.habit_checks
for each row execute function public.set_updated_at();

-- 3) RLS
alter table public.habits enable row level security;
alter table public.habit_checks enable row level security;

-- Habits policies
drop policy if exists habits_select_own on public.habits;
create policy habits_select_own
on public.habits
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists habits_insert_own on public.habits;
create policy habits_insert_own
on public.habits
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists habits_update_own on public.habits;
create policy habits_update_own
on public.habits
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists habits_delete_own on public.habits;
create policy habits_delete_own
on public.habits
for delete
to authenticated
using (user_id = auth.uid());

-- Checks policies
drop policy if exists habit_checks_select_own on public.habit_checks;
create policy habit_checks_select_own
on public.habit_checks
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists habit_checks_insert_own on public.habit_checks;
create policy habit_checks_insert_own
on public.habit_checks
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists habit_checks_update_own on public.habit_checks;
create policy habit_checks_update_own
on public.habit_checks
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists habit_checks_delete_own on public.habit_checks;
create policy habit_checks_delete_own
on public.habit_checks
for delete
to authenticated
using (user_id = auth.uid());

-- ============================================================
-- 4) Supplements & Nutrition (Training modules)
-- ============================================================

create table if not exists public.supplements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  unit text not null default 'ölçek', -- e.g. ölçek, kapsül
  default_amount numeric not null default 1, -- e.g. 1 ölçek
  dose_per_unit numeric null, -- e.g. 5 (per unit)
  dose_unit text null, -- e.g. g, mg, IU
  inventory_amount numeric null, -- optional: remaining amount
  inventory_unit text null, -- optional: g/adet/kapsül/etc.
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safe alters for existing projects
alter table public.supplements add column if not exists inventory_amount numeric null;
alter table public.supplements add column if not exists inventory_unit text null;
alter table public.supplements add column if not exists archived boolean not null default false;

-- İsteğe bağlı alış sıklığı (hatırlatıcıdan bağımsız; web bildirimi şimdilik yok)
alter table public.supplements add column if not exists intake_enabled boolean not null default false;
alter table public.supplements add column if not exists intake_mode text null;
-- intake_mode = weekly: 0=Pazar … 6=Cumartesi (Date.getDay)
alter table public.supplements add column if not exists intake_weekly_day smallint null;
-- intake_mode = custom_days: örn. [1,3,5]
alter table public.supplements add column if not exists intake_custom_days jsonb null;
-- intake_mode = every_3_days: başlangıç tarihi (YYYY-MM-DD)
alter table public.supplements add column if not exists intake_interval_anchor date null;

-- İleride hatırlatıcı (ayrı zaman/saat vb.) için rezerve; şu an uygulama yazmıyor
alter table public.supplements add column if not exists reminder_enabled boolean not null default false;
alter table public.supplements add column if not exists reminder_mode text null;
alter table public.supplements add column if not exists reminder_time_local time null;
alter table public.supplements add column if not exists reminder_weekly_day smallint null;
alter table public.supplements add column if not exists reminder_custom_days jsonb null;
alter table public.supplements add column if not exists reminder_interval_anchor date null;

-- Eski tek şemadan geçiş: reminder dolu, intake boşsa bir kez kopyala
update public.supplements
set
  intake_enabled = reminder_enabled,
  intake_mode = reminder_mode,
  intake_weekly_day = reminder_weekly_day,
  intake_custom_days = reminder_custom_days,
  intake_interval_anchor = reminder_interval_anchor
where intake_mode is null
  and reminder_mode is not null;

create index if not exists supplements_user_id_idx on public.supplements (user_id);

drop trigger if exists supplements_set_updated_at on public.supplements;
create trigger supplements_set_updated_at
before update on public.supplements
for each row execute function public.set_updated_at();

create table if not exists public.supplement_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  supplement_id uuid not null references public.supplements (id) on delete cascade,
  date date not null,
  amount numeric not null default 0, -- number of units (e.g. 2 ölçek)
  dose_total numeric null, -- optional: calculated
  time time null, -- optional
  notes text null,
  created_at timestamptz not null default now()
);

create index if not exists supplement_logs_user_id_idx on public.supplement_logs (user_id);
create index if not exists supplement_logs_supplement_id_idx on public.supplement_logs (supplement_id);
create index if not exists supplement_logs_date_idx on public.supplement_logs (date);

-- default: no time dimension (one log per supplement per day)
create unique index if not exists supplement_logs_unique_day
  on public.supplement_logs (user_id, supplement_id, date)
  where time is null;

create table if not exists public.nutrition_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  calories int not null default 0,
  protein_g int null,
  carb_g int null,
  fat_g int null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists nutrition_logs_unique_day on public.nutrition_logs (user_id, date);
create index if not exists nutrition_logs_user_id_idx on public.nutrition_logs (user_id);
create index if not exists nutrition_logs_date_idx on public.nutrition_logs (date);

drop trigger if exists nutrition_logs_set_updated_at on public.nutrition_logs;
create trigger nutrition_logs_set_updated_at
before update on public.nutrition_logs
for each row execute function public.set_updated_at();

-- 5) RLS
alter table public.supplements enable row level security;
alter table public.supplement_logs enable row level security;
alter table public.nutrition_logs enable row level security;

-- Supplements policies
drop policy if exists supplements_select_own on public.supplements;
create policy supplements_select_own
on public.supplements
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists supplements_insert_own on public.supplements;
create policy supplements_insert_own
on public.supplements
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists supplements_update_own on public.supplements;
create policy supplements_update_own
on public.supplements
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists supplements_delete_own on public.supplements;
create policy supplements_delete_own
on public.supplements
for delete
to authenticated
using (user_id = auth.uid());

-- Supplement logs policies
drop policy if exists supplement_logs_select_own on public.supplement_logs;
create policy supplement_logs_select_own
on public.supplement_logs
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists supplement_logs_insert_own on public.supplement_logs;
create policy supplement_logs_insert_own
on public.supplement_logs
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists supplement_logs_update_own on public.supplement_logs;
create policy supplement_logs_update_own
on public.supplement_logs
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists supplement_logs_delete_own on public.supplement_logs;
create policy supplement_logs_delete_own
on public.supplement_logs
for delete
to authenticated
using (user_id = auth.uid());

-- Nutrition logs policies
drop policy if exists nutrition_logs_select_own on public.nutrition_logs;
create policy nutrition_logs_select_own
on public.nutrition_logs
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists nutrition_logs_insert_own on public.nutrition_logs;
create policy nutrition_logs_insert_own
on public.nutrition_logs
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists nutrition_logs_update_own on public.nutrition_logs;
create policy nutrition_logs_update_own
on public.nutrition_logs
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists nutrition_logs_delete_own on public.nutrition_logs;
create policy nutrition_logs_delete_own
on public.nutrition_logs
for delete
to authenticated
using (user_id = auth.uid());

