import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { fmtAgo, fmtLocalDate } from '../lib/date';

export type CurrentWeight = {
  current: number | null;
  lastDate: string | null;
  lastAgo: string | null;
  /** Ascending chronological order so the sparkline reads left → right. */
  history: number[];
  /** True when the most recent reading is within the last 7 days. */
  isRecent: boolean;
};

type State = {
  data: CurrentWeight;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

const EMPTY: CurrentWeight = {
  current: null,
  lastDate: null,
  lastAgo: null,
  history: [],
  isRecent: false,
};

type Row = {
  date: string | null;
  // NB: the web's `progress` table stores lbs under the `weight_kg` column.
  // We do not convert — the value is treated as lbs everywhere.
  weight_kg: number | string | null;
};

/**
 * Latest weight + last 30 days of weight history for the signed-in user.
 * Empty when the user has not logged any weight yet.
 */
export function useCurrentWeight(): State {
  const { user } = useAuth();
  const [data, setData] = useState<CurrentWeight>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const { data: rows, error: queryError } = await supabase
        .from('progress')
        .select('date, weight_kg')
        .eq('user_id', user.id)
        .gte('date', fmtLocalDate(cutoff))
        .order('date', { ascending: false })
        .limit(30);
      if (queryError) throw queryError;

      // Filter rows with a weight value (some entries may be body-fat only).
      const series = (rows ?? [])
        .map((r) => r as Row)
        .filter((r) => r.weight_kg != null && r.weight_kg !== '')
        .map((r) => ({
          date: r.date ?? '',
          weight: typeof r.weight_kg === 'string' ? Number(r.weight_kg) : Number(r.weight_kg),
        }))
        .filter((r) => Number.isFinite(r.weight) && r.date);

      if (series.length === 0) {
        setData(EMPTY);
        return;
      }

      const latest = series[0]!;
      const ascending = series.slice().reverse().map((p) => p.weight);
      const isRecent =
        (Date.now() - new Date(latest.date + 'T00:00:00').getTime()) /
          (1000 * 60 * 60 * 24) <=
        7;

      setData({
        current: latest.weight,
        lastDate: latest.date,
        lastAgo: fmtAgo(latest.date),
        history: ascending,
        isRecent,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load weight';
      console.error('[useCurrentWeight]', message);
      setError(message);
      setData(EMPTY);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  return { data, loading, error, refetch: fetchData };
}
