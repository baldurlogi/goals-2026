create table if not exists public.launch_waitlist (
  id bigint generated always as identity primary key,
  email text not null,
  email_normalized text not null,
  plan_id text not null default 'pro',
  source text not null default 'landing_pricing',
  created_at timestamptz not null default timezone('utc', now()),
  constraint launch_waitlist_email_nonempty
    check (char_length(trim(email)) > 3),
  constraint launch_waitlist_email_normalized_nonempty
    check (char_length(trim(email_normalized)) > 3),
  constraint launch_waitlist_plan_nonempty
    check (char_length(trim(plan_id)) > 0)
);

create unique index if not exists launch_waitlist_email_plan_idx
  on public.launch_waitlist (email_normalized, plan_id);

alter table public.launch_waitlist enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'launch_waitlist'
      and policyname = 'launch_waitlist_insert_public'
  ) then
    create policy launch_waitlist_insert_public
      on public.launch_waitlist
      for insert
      to anon, authenticated
      with check (true);
  end if;
end
$$;
