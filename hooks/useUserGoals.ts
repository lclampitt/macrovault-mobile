import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';

export type UserGoals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type State = {
  data: UserGoals | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

/**
 * Fetches the signed-in user's macro/calorie goals from the `goals` table.
 * Returns null if the user has no goals row yet (web treats this as
 * "Set a calorie goal to get started").
 */
export function useUserGoals(): State {
  const { user } = useAuth();
  const [data, setData] = useState<UserGoals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const { data: row, error: queryError } = await supabase
        .from('goals')
        .select('calories, protein, carbs, fat')
        .eq('user_id', user.id)
        .maybeSingle();
      if (queryError) throw queryError;
      setData(row ?? null);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load goals';
      console.error('[useUserGoals]', message);
      setError(message);
      setData(null);
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
