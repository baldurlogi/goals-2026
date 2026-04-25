alter table public.launch_waitlist
  add column if not exists confirmed_at timestamptz,
  add column if not exists confirmation_token_hash text,
  add column if not exists confirmation_sent_at timestamptz,
  add column if not exists last_ip_hash text,
  add column if not exists last_user_agent text;

create index if not exists launch_waitlist_confirmed_at_idx
  on public.launch_waitlist (confirmed_at);

create table if not exists public.launch_waitlist_attempts (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  source text not null default 'landing_pricing',
  created_at timestamptz not null default timezone('utc', now()),
  constraint launch_waitlist_attempts_ip_hash_nonempty
    check (char_length(trim(ip_hash)) > 10)
);

create index if not exists launch_waitlist_attempts_ip_created_idx
  on public.launch_waitlist_attempts (ip_hash, created_at desc);

alter table public.launch_waitlist_attempts enable row level security;

drop policy if exists launch_waitlist_insert_public on public.launch_waitlist;
