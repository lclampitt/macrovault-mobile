import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { fmtLocalDate } from '../lib/date';

export type FoodLogEntry = {
  id: string;
  meal_name: string | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  created_at: string;
};

export type FoodLogTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type State = {
  entries: FoodLogEntry[];
  totals: FoodLogTotals;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Fetches today's food_logs for the signed-in user, newest first — mirrors
 * web's NutritionLogger query (logged_date = today, order created_at desc).
 */
export function useTodaysFoodLog(): State {
  const { user } = useAuth();
  const today = useMemo(() => fmtLocalDate(new Date()), []);
  const [entries, setEntries] = useState<FoodLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('food_logs')
        .select('id, meal_name, calories, protein_g, carbs_g, fat_g, created_at')
        .eq('user_id', user.id)
        .eq('logged_date', today)
        .order('created_at', { ascending: false });
      if (queryError) throw queryError;
      setEntries(
        (data ?? []).map((r) => ({
          id: String(r.id),
          meal_name: r.meal_name ?? null,
          calories: toNum(r.calories),
          protein_g: toNum(r.protein_g),
          carbs_g: toNum(r.carbs_g),
          fat_g: toNum(r.fat_g),
          created_at: r.created_at,
        })),
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load log';
      console.error('[useTodaysFoodLog]', message);
      setError(message);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [user, today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const totals = useMemo<FoodLogTotals>(
    () =>
      entries.reduce(
        (acc, e) => ({
          calories: acc.calories + e.calories,
          protein: acc.protein + e.protein_g,
          carbs: acc.carbs + e.carbs_g,
          fat: acc.fat + e.fat_g,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      ),
    [entries],
  );

  return { entries, totals, loading, error, refetch: fetchData };
}
