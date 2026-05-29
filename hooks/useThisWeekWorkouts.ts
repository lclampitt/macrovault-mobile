import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { fmtLocalDate, getWeekRange } from '../lib/date';

export type ThisWeekWorkouts = {
  completed: number;
  target: number;
  /** Per-day completion flags, Monday=0 … Sunday=6. True iff any workout
   *  was logged on that calendar date in the current week. */
  completedDays: boolean[];
};

type State = {
  data: ThisWeekWorkouts;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

// Web hardcodes /4 as the weekly target in the mobile dashboard.
const WEEKLY_TARGET = 4;
const EMPTY_DAYS = [false, false, false, false, false, false, false];
const EMPTY: ThisWeekWorkouts = {
  completed: 0,
  target: WEEKLY_TARGET,
  completedDays: EMPTY_DAYS,
};

function addDays(s: string, n: number): string {
  // s is YYYY-MM-DD (already-local Monday start). Add n days in local time.
  const [y, m, d] = s.split('-').map(Number);
  const local = new Date(y, (m ?? 1) - 1, d ?? 1);
  local.setDate(local.getDate() + n);
  return fmtLocalDate(local);
}

/**
 * Counts the signed-in user's workouts logged in the current Monday-Sunday
 * week (workout_date in [Mon, Sun]) AND returns which days had at least one
 * workout, so the dashboard's week strip can check off the right cells.
 */
export function useThisWeekWorkouts(): State {
  const { user } = useAuth();
  const [data, setData] = useState<ThisWeekWorkouts>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const { start, end } = getWeekRange();
      const { data: rows, error: queryError } = await supabase
        .from('workouts')
        .select('id, workout_date')
        .eq('user_id', user.id)
        .gte('workout_date', start)
        .lte('workout_date', end);
      if (queryError) throw queryError;

      const dayDates = Array.from({ length: 7 }, (_, i) => addDays(start, i));
      const seen = new Set<string>();
      for (const r of rows ?? []) {
        if (r.workout_date) seen.add(r.workout_date as string);
      }
      const completedDays = dayDates.map((d) => seen.has(d));

      setData({
        completed: rows?.length ?? 0,
        target: WEEKLY_TARGET,
        completedDays,
      });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Failed to load workouts';
      console.error('[useThisWeekWorkouts]', message);
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
