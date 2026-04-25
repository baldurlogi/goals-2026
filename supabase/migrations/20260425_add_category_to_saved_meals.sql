alter table public.saved_meals
add column if not exists category text not null default 'other';

alter table public.saved_meals
drop constraint if exists saved_meals_category_check;

alter table public.saved_meals
add constraint saved_meals_category_check
check (category in ('breakfast', 'lunch', 'dinner', 'snack', 'other'));
