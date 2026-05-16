import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import {
  deriveStats,
  filterByRange,
  sortByDate,
  type BodyCompEntry,
  type BodyCompStats,
  type TimeRange,
} from '../lib/bodyComp';

type State = {
  entries: BodyCompEntry[]; // range-filtered, ascending (for the chart)
  allEntries: BodyCompEntry[]; // full set, ascending
  stats: BodyCompStats; // computed from the FULL set (matches web)
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

type Row = {
  id: string;
  date: string | null;
  weight_kg: number | string | null;
  body_fat_pct: number | string | null;
};

function toNum(v: number | string | null): number | null {
  if (v === '' || v == null) return null;
  const n = typeof v === 'string' ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
}

export function useBodyCompositionData(range: TimeRange): State {
  const { user } = useAuth();
  const [allEntries, setAllEntries] = useState<BodyCompEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { data, error: queryError } = await supabase
        .from('progress')
        .select('id, date, weight_kg, body_fat_pct')
        .eq('user_id', user.id)
        .order('date', { ascending: true });
      if (queryError) throw queryError;

      const mapped: BodyCompEntry[] = (data ?? [])
        .map((raw) => {
          const r = raw as Row;
          return {
            id: r.id,
            date: r.date ?? '',
            weight: toNum(r.weight_kg),
            bodyFat: toNum(r.body_fat_pct),
          };
        })
        .filter((e) => e.date);

      setAllEntries(sortByDate(mapped));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load progress';
      console.error('[useBodyCompositionData]', message);
      setError(message);
      setAllEntries([]);
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

  const entries = useMemo(
    () => filterByRange(allEntries, range),
    [allEntries, range],
  );
  const stats = useMemo(() => deriveStats(allEntries), [allEntries]);

  return { entries, allEntries, stats, loading, error, refetch: fetchData };
}
