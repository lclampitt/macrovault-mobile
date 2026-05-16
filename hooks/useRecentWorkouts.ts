import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';

export type RecentWorkout = {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  exerciseCount: number;
};

type State = {
  workouts: RecentWorkout[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

type Row = {
  id: string;
  workout_name: string | null;
  workout_date: string | null;
  exercises: unknown;
};

export function useRecentWorkouts(limit = 20): State {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<RecentWorkout[]>([]);
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
      // Web: from('workouts').eq('user_id').order('workout_date', desc).
      // Templates are a separate table, so no filtering needed here.
      const { data, error: queryError } = await supabase
        .from('workouts')
        .select('id, workout_name, workout_date, exercises')
        .eq('user_id', user.id)
        .order('workout_date', { ascending: false })
        .limit(limit);
      if (queryError) throw queryError;

      const mapped: RecentWorkout[] = (data ?? [])
        .map((raw) => {
          const r = raw as Row;
          return {
            id: r.id,
            name: r.workout_name || 'Workout',
            date: r.workout_date ?? '',
            exerciseCount: Array.isArray(r.exercises) ? r.exercises.length : 0,
          };
        })
        .filter((w) => w.date);
      setWorkouts(mapped);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load workouts';
      console.error('[useRecentWorkouts]', message);
      setError(message);
      setWorkouts([]);
    } finally {
      setLoading(false);
    }
  }, [user, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  return { workouts, loading, error, refetch: fetchData };
}
