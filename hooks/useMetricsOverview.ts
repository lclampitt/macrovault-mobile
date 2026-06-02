import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { DEFAULT_METRICS, type Metric } from '../lib/metrics-catalog';

export type MetricOverviewRow = {
  metric: Metric;
  /** Latest logged value. Null when the user has never logged this metric. */
  current: number | null;
  /** Latest minus first-in-history (raw, not absolute). */
  delta: number | null;
  /** ISO of the most recent entry. */
  lastLoggedAt: string | null;
  /** Total entry count (used for sparkline "n points" labels later). */
  entryCount: number;
};

type State = {
  rows: MetricOverviewRow[];
  loading: boolean;
  refetch: () => Promise<void>;
};

/**
 * Pulls the latest-value + delta-since-first per metric in a single batched
 * read. Powers the Measurements tile grid and the Stats metric picker rows.
 *
 * Strategy:
 *   - One round trip to `progress` for weight + bodyfat history (sorted
 *     ascending). First & last rows give us the delta + current.
 *   - One round trip to `body_metric_entries` for every other metric.
 *   - Grouped client-side. Total: 2 queries regardless of how many metrics.
 */
export function useMetricsOverview(): State {
  const { user } = useAuth();
  const [rows, setRows] = useState<MetricOverviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [progressRes, entriesRes] = await Promise.all([
        supabase
          .from('progress')
          .select('id, date, weight_kg, body_fat_pct')
          .eq('user_id', user.id)
          .order('date', { ascending: true }),
        supabase
          .from('body_metric_entries')
          .select('metric_id, value, logged_at')
          .eq('user_id', user.id)
          .order('logged_at', { ascending: true }),
      ]);

      // NOTE: If the `body_metric_entries` table doesn't exist yet (i.e. the
      //   migration in /supabase/migrations/0002_body_metrics.sql hasn't been
      //   applied), `entriesRes.error` will fire and we silently fall back to
      //   "no rows" for circumference metrics. Apply the migration to light
      //   them up.
      const progressRows = (progressRes.data ?? []) as Array<{
        date: string;
        weight_kg: number | string | null;
        body_fat_pct: number | string | null;
      }>;
      const entryRows = (entriesRes.data ?? []) as Array<{
        metric_id: string;
        value: number | string;
        logged_at: string;
      }>;

      const out: MetricOverviewRow[] = DEFAULT_METRICS.map((metric) => {
        if (metric.id === 'weight') {
          const values = progressRows
            .map((r) =>
              r.weight_kg == null ? null : Number(r.weight_kg) * 2.2046226218,
            )
            .filter((v): v is number => v != null && Number.isFinite(v));
          const dates = progressRows
            .filter((r) => r.weight_kg != null)
            .map((r) => r.date);
          return buildRow(metric, values, dates);
        }
        if (metric.id === 'bodyfat') {
          const values = progressRows
            .map((r) =>
              r.body_fat_pct == null ? null : Number(r.body_fat_pct),
            )
            .filter((v): v is number => v != null && Number.isFinite(v));
          const dates = progressRows
            .filter((r) => r.body_fat_pct != null)
            .map((r) => r.date);
          return buildRow(metric, values, dates);
        }
        const matching = entryRows.filter((r) => r.metric_id === metric.id);
        const values = matching.map((r) => Number(r.value));
        const dates = matching.map((r) => r.logged_at);
        return buildRow(metric, values, dates);
      });

      setRows(out);
    } catch (e) {
      console.error('[useMetricsOverview]', e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      void fetchData();
    }, [fetchData]),
  );

  return { rows, loading, refetch: fetchData };
}

function buildRow(
  metric: Metric,
  values: number[],
  dates: string[],
): MetricOverviewRow {
  const entryCount = values.length;
  if (entryCount === 0) {
    return {
      metric,
      current: null,
      delta: null,
      lastLoggedAt: null,
      entryCount: 0,
    };
  }
  const current = values[values.length - 1];
  const delta = entryCount >= 2 ? +(current - values[0]).toFixed(2) : null;
  const lastLoggedAt = dates[dates.length - 1] ?? null;
  return { metric, current, delta, lastLoggedAt, entryCount };
}
