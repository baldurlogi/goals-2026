alter table public.schedule_templates
add column if not exists monday jsonb not null default '[]'::jsonb;

alter table public.schedule_templates
add column if not exists tuesday jsonb not null default '[]'::jsonb;

alter table public.schedule_templates
add column if not exists wednesday jsonb not null default '[]'::jsonb;

alter table public.schedule_templates
add column if not exists thursday jsonb not null default '[]'::jsonb;

alter table public.schedule_templates
add column if not exists friday jsonb not null default '[]'::jsonb;

alter table public.schedule_templates
add column if not exists saturday jsonb not null default '[]'::jsonb;

alter table public.schedule_templates
add column if not exists sunday jsonb not null default '[]'::jsonb;

update public.schedule_templates
set
  monday = case when jsonb_array_length(monday) = 0 then coalesce(wfh, '[]'::jsonb) else monday end,
  tuesday = case when jsonb_array_length(tuesday) = 0 then coalesce(wfh, '[]'::jsonb) else tuesday end,
  wednesday = case when jsonb_array_length(wednesday) = 0 then coalesce(wfh, '[]'::jsonb) else wednesday end,
  thursday = case when jsonb_array_length(thursday) = 0 then coalesce(wfh, '[]'::jsonb) else thursday end,
  friday = case when jsonb_array_length(friday) = 0 then coalesce(wfh, '[]'::jsonb) else friday end,
  saturday = case when jsonb_array_length(saturday) = 0 then coalesce(weekend, '[]'::jsonb) else saturday end,
  sunday = case when jsonb_array_length(sunday) = 0 then coalesce(weekend, '[]'::jsonb) else sunday end;

alter table public.schedule_logs
add column if not exists total_blocks integer not null default 0;

update public.schedule_logs as logs
set total_blocks = case extract(isodow from logs.log_date::date)
  when 1 then jsonb_array_length(coalesce(templates.monday, '[]'::jsonb))
  when 2 then jsonb_array_length(coalesce(templates.tuesday, '[]'::jsonb))
  when 3 then jsonb_array_length(coalesce(templates.wednesday, '[]'::jsonb))
  when 4 then jsonb_array_length(coalesce(templates.thursday, '[]'::jsonb))
  when 5 then jsonb_array_length(coalesce(templates.friday, '[]'::jsonb))
  when 6 then jsonb_array_length(coalesce(templates.saturday, '[]'::jsonb))
  else jsonb_array_length(coalesce(templates.sunday, '[]'::jsonb))
end
from public.schedule_templates as templates
where templates.user_id = logs.user_id
  and coalesce(logs.total_blocks, 0) = 0;
