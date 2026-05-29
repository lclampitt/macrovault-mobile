-- Schedule items — user-defined plan for a given day (meals, workouts,
-- weigh-ins, anything else). Powers the dashboard "Schedule" card.
--
-- One row per scheduled item, keyed by (user_id, date). The `time` field is
-- the local "HH:MM" the user picked; `period` is derived at write but kept
-- on the row for fast filtering. `macros` is an optional snapshot used when
-- the user schedules from their meal plan — so the per-row "Log" button can
-- one-tap insert into food_logs without re-asking for the numbers.

create table if not exists schedule_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  time text not null,
  period text not null check (period in ('morning','noon','evening','snack')),
  kind text not null check (kind in ('meal','workout','weight','other')),
  title text not null,
  notes text,
  macros jsonb,
  created_at timestamptz default now()
);

create index if not exists schedule_items_user_date_idx
  on schedule_items (user_id, date);

alter table schedule_items enable row level security;

create policy "users read own schedule"
  on schedule_items for select using (auth.uid() = user_id);

create policy "users write own schedule"
  on schedule_items for insert with check (auth.uid() = user_id);

create policy "users update own schedule"
  on schedule_items for update using (auth.uid() = user_id);

create policy "users delete own schedule"
  on schedule_items for delete using (auth.uid() = user_id);
