-- ============================================================
--  Daily Life Progress — Supabase Schema
--  Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── Users profile (extends Supabase auth.users) ──────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  weight_kg   numeric,
  height_cm   numeric,
  age         int,
  created_at  timestamptz default now()
);

-- ── Nutrition phase (maintain / cut) ─────────────────────────────────────────
create table if not exists public.nutrition_phase (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  phase   text not null default 'maintain' check (phase in ('maintain', 'cut')),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- ── Nutrition daily log ───────────────────────────────────────────────────────
create table if not exists public.nutrition_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  log_date    date not null default current_date,
  eaten       jsonb not null default '{}',       -- Record<MealKey, boolean>
  custom_entries jsonb not null default '[]',    -- CustomEntry[]
  unique(user_id, log_date)
);

-- ── Saved meals library ───────────────────────────────────────────────────────
create table if not exists public.saved_meals (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users(id) on delete cascade,
  name     text not null,
  emoji    text not null default '🍽️',
  macros   jsonb not null,   -- { cal, protein, carbs, fat }
  created_at timestamptz default now()
);

-- ── Schedule log ──────────────────────────────────────────────────────────────
create table if not exists public.schedule_logs (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users(id) on delete cascade,
  log_date  date not null default current_date,
  view      text not null default 'wfh' check (view in ('wfh', 'office', 'weekend')),
  completed int[] not null default '{}',
  unique(user_id, log_date)
);

-- ── Reading log ───────────────────────────────────────────────────────────────
create table if not exists public.reading_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  log_date     date not null default current_date,
  current_page int not null default 0,
  book_id      text,
  unique(user_id, log_date)
);

-- ── Goals progress (step completions) ────────────────────────────────────────
create table if not exists public.goal_progress (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users(id) on delete cascade,
  goal_id  text not null,
  done     jsonb not null default '{}',  -- Record<stepId, boolean>
  updated_at timestamptz default now(),
  unique(user_id, goal_id)
);

-- ── Todos ────────────────────────────────────────────────────────────────────
create table if not exists public.todos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  text       text not null,
  done       boolean not null default false,
  created_at timestamptz default now()
);

-- ── Fitness PRs ───────────────────────────────────────────────────────────────
create table if not exists public.fitness_lifts (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users(id) on delete cascade,
  lift_id  text not null,   -- e.g. "bench", "squat"
  goal     numeric not null default 0,
  history  jsonb not null default '[]',  -- PREntry[]
  unique(user_id, lift_id)
);

create table if not exists public.fitness_skills (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users(id) on delete cascade,
  skill_id text not null,
  goal     numeric not null default 0,
  goal_label text,
  history  jsonb not null default '[]',  -- PREntry[]
  unique(user_id, skill_id)
);

-- ============================================================
--  Row Level Security — every table locked to owner only
-- ============================================================

alter table public.profiles        enable row level security;
alter table public.nutrition_phase enable row level security;
alter table public.nutrition_logs  enable row level security;
alter table public.saved_meals     enable row level security;
alter table public.schedule_logs   enable row level security;
alter table public.reading_logs    enable row level security;
alter table public.goal_progress   enable row level security;
alter table public.todos           enable row level security;
alter table public.fitness_lifts   enable row level security;
alter table public.fitness_skills  enable row level security;

-- Helper: one policy pattern repeated per table
-- "Users can only see and modify their own rows"

do $$ declare t text; begin
  foreach t in array array[
    'profiles', 'nutrition_phase', 'nutrition_logs', 'saved_meals',
    'schedule_logs', 'reading_logs', 'goal_progress', 'todos',
    'fitness_lifts', 'fitness_skills'
  ] loop
    execute format(
      'create policy "owner_all" on public.%I
       for all using (auth.uid() = user_id)
       with check (auth.uid() = user_id)', t
    );
  end loop;
end $$;

-- Profiles uses "id" not "user_id"
drop policy if exists "owner_all" on public.profiles;
create policy "owner_all" on public.profiles
  for all using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================
--  Auto-create profile on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();