alter table public.profiles
  add column if not exists measurement_system text not null default 'metric',
  add column if not exists date_format text not null default 'dmy',
  add column if not exists time_format text not null default '24h';

update public.profiles
set
  measurement_system = coalesce(measurement_system, 'metric'),
  date_format = coalesce(date_format, 'dmy'),
  time_format = coalesce(time_format, '24h')
where
  measurement_system is null
  or date_format is null
  or time_format is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_measurement_system_check'
  ) then
    alter table public.profiles
      add constraint profiles_measurement_system_check
      check (measurement_system in ('metric', 'imperial'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_date_format_check'
  ) then
    alter table public.profiles
      add constraint profiles_date_format_check
      check (date_format in ('dmy', 'mdy'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_time_format_check'
  ) then
    alter table public.profiles
      add constraint profiles_time_format_check
      check (time_format in ('24h', '12h'));
  end if;
end $$;
