-- ============================================================
--  Daily Life Progress — Supabase Schema (consolidated)
--  Safe to re-run: all statements are idempotent
-- ============================================================

create extension if not exists "pgcrypto";

-- ── Tables ────────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  display_name         text,
  weight_kg            numeric,
  height_cm            numeric,
  age                  int,
  sex                  text check (sex in ('male','female')),
  activity_level       text check (activity_level in ('sedentary','light','moderate','active','very_active')) default 'active',
  onboarding_done      boolean not null default false,
  macro_maintain       jsonb,
  macro_cut            jsonb,
  default_schedule_view text check (default_schedule_view in ('wfh','office','weekend')) default 'wfh',
  daily_reading_goal   int default 20,
  created_at           timestamptz default now()
);

create table if not exists public.nutrition_phase (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  phase      text not null default 'maintain' check (phase in ('maintain','cut')),
  updated_at timestamptz default now(),
  unique(user_id)
);

create table if not exists public.nutrition_logs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  log_date       date not null default current_date,
  eaten          jsonb not null default '{}',
  custom_entries jsonb not null default '[]',
  unique(user_id, log_date)
);

create table if not exists public.saved_meals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  emoji      text not null default '🍽️',
  macros     jsonb not null,
  created_at timestamptz default now()
);

create table if not exists public.schedule_logs (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users(id) on delete cascade,
  log_date  date not null default current_date,
  view      text not null default 'wfh' check (view in ('wfh','office','weekend')),
  completed int[] not null default '{}',
  unique(user_id, log_date)
);

create table if not exists public.reading_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  log_date     date not null default current_date,
  current_page int not null default 0,
  book_id      text,
  unique(user_id, log_date)
);

create table if not exists public.reading_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  state      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.goal_progress (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  goal_id    text not null,
  done       jsonb not null default '{}',
  updated_at timestamptz default now(),
  unique(user_id, goal_id)
);

create table if not exists public.todos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  text       text not null,
  done       boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists public.fitness_lifts (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users(id) on delete cascade,
  lift_id  text not null,
  goal     numeric not null default 0,
  history  jsonb not null default '[]',
  unique(user_id, lift_id)
);

create table if not exists public.fitness_skills (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  skill_id   text not null,
  goal       numeric not null default 0,
  goal_label text,
  history    jsonb not null default '[]',
  unique(user_id, skill_id)
);

create table if not exists public.finance_months (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  goal_id    text not null,
  month      text not null,
  state      jsonb not null default '{}',
  updated_at timestamptz default now(),
  unique(user_id, goal_id, month)
);

create table if not exists public.goal_module_state (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  goal_id    text not null,
  module_key text not null,
  state      jsonb not null default '{}',
  updated_at timestamptz default now(),
  unique(user_id, goal_id, module_key)
);

-- ── Add new profile columns if upgrading from old schema ─────────────────────

alter table public.profiles
  add column if not exists sex                   text check (sex in ('male','female')),
  add column if not exists activity_level        text check (activity_level in ('sedentary','light','moderate','active','very_active')) default 'active',
  add column if not exists onboarding_done       boolean not null default false,
  add column if not exists macro_maintain        jsonb,
  add column if not exists macro_cut             jsonb,
  add column if not exists default_schedule_view text check (default_schedule_view in ('wfh','office','weekend')) default 'wfh',
  add column if not exists daily_reading_goal    int default 20;

-- ── Row Level Security ────────────────────────────────────────────────────────

alter table public.profiles           enable row level security;
alter table public.nutrition_phase    enable row level security;
alter table public.nutrition_logs     enable row level security;
alter table public.saved_meals        enable row level security;
alter table public.schedule_logs      enable row level security;
alter table public.reading_logs       enable row level security;
alter table public.reading_state      enable row level security;
alter table public.goal_progress      enable row level security;
alter table public.todos              enable row level security;
alter table public.fitness_lifts      enable row level security;
alter table public.fitness_skills     enable row level security;
alter table public.finance_months     enable row level security;
alter table public.goal_module_state  enable row level security;

-- Drop all policies first, then recreate — fully idempotent
do $$ declare t text; begin
  foreach t in array array[
    'nutrition_phase','nutrition_logs','saved_meals','schedule_logs',
    'reading_logs','reading_state','goal_progress','todos',
    'fitness_lifts','fitness_skills','finance_months','goal_module_state'
  ] loop
    execute format('drop policy if exists owner_all on public.%I', t);
    execute format(
      'create policy owner_all on public.%I
       for all using (auth.uid() = user_id)
       with check (auth.uid() = user_id)', t
    );
  end loop;
end $$;

-- profiles uses "id" not "user_id"
drop policy if exists owner_all on public.profiles;
create policy owner_all on public.profiles
  for all using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── Auto-create profile on signup ─────────────────────────────────────────────

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