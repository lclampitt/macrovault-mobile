-- Extend the existing `goals` singleton table to support the redesigned
-- Goal Planner. All additions are nullable / defaulted so the existing
-- web app keeps working — the mobile-app fields just stay null on rows
-- saved from the Macro Calculator on web.
--
-- New columns:
--   • start_date           — start of the goal timeline (defaults to created_at::date)
--   • target_date          — end of the goal timeline (start_date + timeframe_weeks)
--   • start_weight_value   — body weight when the goal was set, in user's unit
--   • start_weight_unit    — 'kg' | 'lb' (matches body_metric_entries.unit values)
--   • target_weight_value  — target body weight at goal end
--   • target_weight_unit   — 'kg' | 'lb'
--   • calorie_delta        — daily kcal +/- from maintenance (signed int)
--   • is_active            — flips false when archived
--   • archived_at          — when the goal was archived
--   • archive_reason       — free-text ('type-change', 'manual', 'completed')

alter table if exists goals
  add column if not exists start_date date,
  add column if not exists target_date date,
  add column if not exists start_weight_value numeric,
  add column if not exists start_weight_unit text check (start_weight_unit in ('kg','lb')),
  add column if not exists target_weight_value numeric,
  add column if not exists target_weight_unit text check (target_weight_unit in ('kg','lb')),
  add column if not exists calorie_delta integer,
  add column if not exists is_active boolean not null default true,
  add column if not exists archived_at timestamptz,
  add column if not exists archive_reason text;

-- Backfill start_date from created_at for rows that don't have it yet so
-- the timeline math has something to anchor on.
update goals
   set start_date = created_at::date
 where start_date is null;

-- Compute a default target_date from start_date + timeframe_weeks for rows
-- that have a timeframe but no explicit target. (Rows with no timeframe
-- — e.g. saved from the Macro Calculator — stay null and the UI hides the
-- timeline.)
update goals
   set target_date = start_date + (timeframe_weeks * 7)
 where target_date is null
   and start_date is not null
   and timeframe_weeks is not null
   and timeframe_weeks > 0;

-- Indexes for the "active goal" query and the "archived history" query.
create index if not exists goals_user_active_idx
  on goals (user_id, is_active);

create index if not exists goals_user_archived_idx
  on goals (user_id, archived_at desc)
  where archived_at is not null;
