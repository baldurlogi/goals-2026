alter table public.saved_meals enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'saved_meals'
      and cmd = 'UPDATE'
  ) then
    create policy saved_meals_update_own
      on public.saved_meals
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;
