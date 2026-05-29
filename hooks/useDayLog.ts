import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { fromFoodLog, sumEntries, type MealEntry } from '../lib/meal-store';

/**
 * Single source of truth for the canonical "what did I eat today (or on day
 * X)" list. Powers both:
 *  • Dashboard "Today's Timeline"
 *  • Meals tab "Logged" view (for any selected day)
 *
 * Reads from the `food_logs` table; entries are mapped to the unified
 * `MealEntry` shape and sorted by timestamp ascending so the rendered
 * timeline reads top-to-bottom in chronological order.
 *
 * NOTE: `useTodaysFoodLog` still exists and is what existing screens (Goal
 *   Planner's "Today's log", calorie-hero card sums) read. It returns the
 *   raw FoodLogEntry shape. Migrating callers to `useDayLog` is incremental;
 *   both can coexist.
 */
type State = {
  entries: MealEntry[];
  totals: ReturnType<typeof sumEntries>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function useDayLog(ymd: string | null): State {
  const { user } = useAuth();
  const [entries, setEntries] = useState<MealEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user || !ymd) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      // Stick to the column set that exists everywhere — `food_logs` doesn't
      // have an `ingredients` column today; including it 500s the query and
      // wipes the timeline. If/when that column lands, re-add it here.
      const { data, error: queryError } = await supabase
        .from('food_logs')
        .select(
          'id, meal_name, calories, protein_g, carbs_g, fat_g, created_at',
        )
        .eq('user_id', user.id)
        .eq('logged_date', ymd)
        .order('created_at', { ascending: true });
      if (queryError) throw queryError;
      const normalized: MealEntry[] = (data ?? []).map((r) =>
        fromFoodLog({
          id: String(r.id),
          meal_name: r.meal_name ?? null,
          calories: toNum(r.calories),
          protein_g: toNum(r.protein_g),
          carbs_g: toNum(r.carbs_g),
          fat_g: toNum(r.fat_g),
          created_at: r.created_at,
          ingredients: null,
        }),
      );
      setEntries(normalized);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load log';
      console.error('[useDayLog]', message);
      setError(message);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [user, ymd]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const totals = useMemo(() => sumEntries(entries), [entries]);

  return { entries, totals, loading, error, refetch: fetchData };
}
