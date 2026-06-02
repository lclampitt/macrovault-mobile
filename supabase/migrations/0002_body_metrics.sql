-- Body metric entries + custom metric definitions.
--
-- Two tables:
--   • body_metric_entries — one row per measurement event for any metric
--   • custom_metrics      — user-defined metrics that aren't in the built-in
--                           catalog (Neck, Calf, Forearm, etc.)
--
-- Weight + Body Fat continue to also write to the legacy `progress` table so
-- the web app's existing BodyComp views keep working. Eventually those two
-- can migrate fully to body_metric_entries — see /lib/metrics-catalog.ts.

create table if not exists custom_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null check (char_length(name) between 1 and 30),
  unit text not null,
  good_direction text not null check (good_direction in ('up','down','either')) default 'either',
  decimals smallint not null default 1,
  created_at timestamptz default now()
);

create index if not exists custom_metrics_user_idx on custom_metrics (user_id);

alter table custom_metrics enable row level security;

create policy "users read own custom_metrics"
  on custom_metrics for select using (auth.uid() = user_id);
create policy "users insert own custom_metrics"
  on custom_metrics for insert with check (auth.uid() = user_id);
create policy "users delete own custom_metrics"
  on custom_metrics for delete using (auth.uid() = user_id);

create table if not exists body_metric_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  /**
   * Either a built-in catalog id ('weight', 'bodyfat', 'waist', etc.) or a
   * UUID matching custom_metrics.id. We don't enforce the FK because
   * built-in metrics live in code, not in the DB.
   */
  metric_id text not null,
  value numeric not null,
  unit text not null,
  notes text,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists body_metric_entries_user_metric_idx
  on body_metric_entries (user_id, metric_id, logged_at desc);

alter table body_metric_entries enable row level security;

create policy "users read own metric entries"
  on body_metric_entries for select using (auth.uid() = user_id);
create policy "users insert own metric entries"
  on body_metric_entries for insert with check (auth.uid() = user_id);
create policy "users update own metric entries"
  on body_metric_entries for update using (auth.uid() = user_id);
create policy "users delete own metric entries"
  on body_metric_entries for delete using (auth.uid() = user_id);
