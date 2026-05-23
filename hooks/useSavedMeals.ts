import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';

export type SavedMeal = {
  id: string;
  meal_name: string;
  ingredients: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at: string;
};

type State = {
  meals: SavedMeal[];
  /** meal_name (lower-cased) → saved_meals.id, used by the heart toggle. */
  favoriteNameMap: Record<string, string>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  toggleFavorite: (meal: {
    meal_name: string;
    ingredients: string | null;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => Promise<{ error: string | null }>;
  removeSaved: (id: string) => Promise<{ error: string | null }>;
};

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function nameKey(s: string): string {
  return (s || '').trim().toLowerCase();
}

export function useSavedMeals(): State {
  const { user } = useAuth();
  const [meals, setMeals] = useState<SavedMeal[]>([]);
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
        .from('saved_meals')
        .select('id, meal_name, ingredients, calories, protein, carbs, fat, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (queryError) throw queryError;
      setMeals(
        (data ?? []).map((r) => ({
          id: String(r.id),
          meal_name: r.meal_name ?? '',
          ingredients: r.ingredients ?? null,
          calories: toNum(r.calories),
          protein: toNum(r.protein),
          carbs: toNum(r.carbs),
          fat: toNum(r.fat),
          created_at: r.created_at,
        })),
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load saved meals';
      console.error('[useSavedMeals]', message);
      setError(message);
      setMeals([]);
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

  const favoriteNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of meals) map[nameKey(m.meal_name)] = m.id;
    return map;
  }, [meals]);

  const toggleFavorite = useCallback(
    async (meal: {
      meal_name: string;
      ingredients: string | null;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }) => {
      if (!user) return { error: 'Not authenticated' };
      const existingId = favoriteNameMap[nameKey(meal.meal_name)];
      try {
        if (existingId) {
          const { error: delErr } = await supabase
            .from('saved_meals')
            .delete()
            .eq('id', existingId);
          if (delErr) throw delErr;
        } else {
          const { error: insErr } = await supabase.from('saved_meals').insert({
            user_id: user.id,
            meal_name: meal.meal_name,
            ingredients: meal.ingredients,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
          });
          if (insErr) throw insErr;
        }
        await fetchData();
        return { error: null };
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to update favorite';
        console.error('[useSavedMeals.toggleFavorite]', message);
        return { error: message };
      }
    },
    [user, favoriteNameMap, fetchData],
  );

  const removeSaved = useCallback(
    async (id: string) => {
      if (!user) return { error: 'Not authenticated' };
      try {
        const { error: delErr } = await supabase
          .from('saved_meals')
          .delete()
          .eq('id', id);
        if (delErr) throw delErr;
        await fetchData();
        return { error: null };
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to remove saved meal';
        console.error('[useSavedMeals.removeSaved]', message);
        return { error: message };
      }
    },
    [user, fetchData],
  );

  return {
    meals,
    favoriteNameMap,
    loading,
    error,
    refetch: fetchData,
    toggleFavorite,
    removeSaved,
  };
}
