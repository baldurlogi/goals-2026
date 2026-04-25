create table if not exists public.life_progress_history (
  user_id uuid not null references auth.users (id) on delete cascade,
  snapshot_date date not null,
  score integer not null check (score >= 0 and score <= 100),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, snapshot_date)
);

alter table public.life_progress_history enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'life_progress_history'
      and policyname = 'life_progress_history_select_own'
  ) then
    create policy life_progress_history_select_own
      on public.life_progress_history
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'life_progress_history'
      and policyname = 'life_progress_history_insert_own'
  ) then
    create policy life_progress_history_insert_own
      on public.life_progress_history
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'life_progress_history'
      and policyname = 'life_progress_history_update_own'
  ) then
    create policy life_progress_history_update_own
      on public.life_progress_history
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'life_progress_history'
      and policyname = 'life_progress_history_delete_own'
  ) then
    create policy life_progress_history_delete_own
      on public.life_progress_history
      for delete
      using (auth.uid() = user_id);
  end if;
end
$$;
