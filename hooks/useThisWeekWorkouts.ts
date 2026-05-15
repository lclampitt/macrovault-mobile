import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { getWeekRange } from '../lib/date';

export type ThisWeekWorkouts = {
  completed: number;
  target: number;
};

type State = {
  data: ThisWeekWorkouts;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

// Web hardcodes /4 as the weekly target in the mobile dashboard.
const WEEKLY_TARGET = 4;
const EMPTY: ThisWeekWorkouts = { completed: 0, target: WEEKLY_TARGET };

/**
 * Counts the signed-in user's workouts logged in the current Monday-Sunday
 * week (workout_date in [Mon, Sun]).
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
        .select('id')
        .eq('user_id', user.id)
        .gte('workout_date', start)
        .lte('workout_date', end);
      if (queryError) throw queryError;

      setData({ completed: rows?.length ?? 0, target: WEEKLY_TARGET });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load workouts';
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
