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

