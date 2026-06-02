import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { findMetric, type Metric } from '../lib/metrics-catalog';
import { type TimeRange } from '../lib/bodyComp';

export type MetricEntry = {
  id: string;
  metric_id: string;
  value: number;
  unit: string;
  loggedAt: string; // ISO
  notes?: string;
};

type State = {
  entries: MetricEntry[]; // sorted ascending by loggedAt
  current: number | null;
  delta: number | null; // current - first
  lastLoggedAt: string | null;
  loading: boolean;
  refetch: () => Promise<void>;
};

const RANGE_DAYS: Record<TimeRange, number> = {
  '2W': 14,
  '1M': 30,
  '3M': 90,
  '6M': 180,
  All: Infinity,
};

/**
 * Returns the time-range-filtered history for a single metric.
 *
 * Reads layout depends on the metric's storage hint:
 *   - 'progress.weight_kg'    → progress.weight_kg (legacy table, kg → lb)
 *   - 'progress.body_fat_pct' → progress.body_fat_pct
 *   - 'body_metric_entries'   → flexible per-metric table
 */
export function useMetricEntries(
  metricId: string | null,
  range: TimeRange,
): State {
  const { user } = useAuth();
  const metric: Metric | null = useMemo(
    () => (metricId ? findMetric(metricId) : null),
    [metricId],
  );
  const [allEntries, setAllEntries] = useState<MetricEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user || !metric) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let rows: MetricEntry[] = [];
      if (metric.storage === 'progress.weight_kg') {
        const { data } = await supabase
          .from('progress')
          .select('id, date, weight_kg')
          .eq('user_id', user.id)
          .not('weight_kg', 'is', null)
          .order('date', { ascending: true });
        rows = (data ?? [])
          .map((r) => ({
            id: String(r.id),
            metric_id: 'weight',
            // lb (display unit) — DB stores kg
            value: kgToLb(Number(r.weight_kg)),
            unit: metric.unit,
            loggedAt: `${r.date}T00:00:00Z`,
          }))
          .filter((e) => Number.isFinite(e.value));
      } else if (metric.storage === 'progress.body_fat_pct') {
        const { data } = await supabase
          .from('progress')
          .select('id, date, body_fat_pct')
          .eq('user_id', user.id)
          .not('body_fat_pct', 'is', null)
          .order('date', { ascending: true });
        rows = (data ?? [])
          .map((r) => ({
            id: String(r.id),
            metric_id: 'bodyfat',
            value: Number(r.body_fat_pct),
            unit: metric.unit,
            loggedAt: `${r.date}T00:00:00Z`,
          }))
          .filter((e) => Number.isFinite(e.value));
      } else {
        // body_metric_entries — flexible table
        const { data } = await supabase
          .from('body_metric_entries')
          .select('id, metric_id, value, unit, logged_at, notes')
          .eq('user_id', user.id)
          .eq('metric_id', metric.id)
          .order('logged_at', { ascending: true });
        rows = (data ?? []).map((r) => ({
          id: String(r.id),
          metric_id: r.metric_id,
          value: Number(r.value),
          unit: r.unit ?? metric.unit,
          loggedAt: r.logged_at,
          notes: r.notes ?? undefined,
        }));
      }
      setAllEntries(rows);
    } catch (e) {
      console.error('[useMetricEntries]', e);
      setAllEntries([]);
    } finally {
      setLoading(false);
    }
  }, [user, metric]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      void fetchData();
    }, [fetchData]),
  );

  // Range filter is client-side — same pattern as useBodyCompositionData.
  const entries = useMemo(() => {
    const days = RANGE_DAYS[range];
    if (!Number.isFinite(days)) return allEntries;
    const cutoff = Date.now() - days * 86_400_000;
    return allEntries.filter((e) => new Date(e.loggedAt).getTime() >= cutoff);
  }, [allEntries, range]);

  const current = entries.length > 0 ? entries[entries.length - 1].value : null;
  const delta =
    entries.length >= 2
      ? +(entries[entries.length - 1].value - entries[0].value).toFixed(2)
      : null;
  const lastLoggedAt =
    entries.length > 0 ? entries[entries.length - 1].loggedAt : null;

  return { entries, current, delta, lastLoggedAt, loading, refetch: fetchData };
}

function kgToLb(kg: number): number {
  return kg * 2.2046226218;
}
