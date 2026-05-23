import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { fmtLocalDate } from '../lib/date';

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export type MealPlanEntry = {
  id: string;
  plan_id: string;
  day_of_week: number; // 0=Mon … 6=Sun
  meal_type: MealType;
  meal_name: string;
  ingredients: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type State = {
  planId: string | null;
  entries: MealPlanEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * READ-ONLY fetch for Phase 10a:
 *  - Looks up `meal_plans` by (user_id, week_start) with maybeSingle — does NOT
 *    upsert a new row just because the user is browsing.
 *  - If a row exists, fetches `meal_plan_entries` for it.
 *  - Editing / clearing / inserts come in Phase 10b.
 */
export function useMealPlanWeek(weekStart: Date): State {
  const { user } = useAuth();
  const weekStartStr = useMemo(() => fmtLocalDate(weekStart), [weekStart]);
  const [planId, setPlanId] = useState<string | null>(null);
  const [entries, setEntries] = useState<MealPlanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: plan, error: planErr } = await supabase
        .from('meal_plans')
        .select('id')
        .eq('user_id', user.id)
        .eq('week_start', weekStartStr)
        .maybeSingle();
      if (planErr && planErr.code !== 'PGRST116') throw planErr;
      if (!plan) {
        setPlanId(null);
        setEntries([]);
        return;
      }
      setPlanId(plan.id);
      const { data: rows, error: entriesErr } = await supabase
        .from('meal_plan_entries')
        .select(
          'id, plan_id, day_of_week, meal_type, meal_name, ingredients, calories, protein, carbs, fat',
        )
        .eq('plan_id', plan.id)
        .order('day_of_week', { ascending: true });
      if (entriesErr) throw entriesErr;
      setEntries(
        (rows ?? []).map((r) => ({
          id: String(r.id),
          plan_id: String(r.plan_id),
          day_of_week: Number(r.day_of_week) || 0,
          meal_type: (r.meal_type as MealType) || 'breakfast',
          meal_name: r.meal_name ?? '',
          ingredients: r.ingredients ?? null,
          calories: toNum(r.calories),
          protein: toNum(r.protein),
          carbs: toNum(r.carbs),
          fat: toNum(r.fat),
        })),
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load plan';
      console.error('[useMealPlanWeek]', message);
      setError(message);
      setPlanId(null);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [user, weekStartStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  return { planId, entries, loading, error, refetch: fetchData };
}

// --------------------------------------------------------------------------
// Date helpers (shared by the screen + sub-components)
// --------------------------------------------------------------------------

/** Monday of the week containing `d` (00:00 local). */
export function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function fmtShort(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function fmtLongDay(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];
export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'BREAKFAST',
  lunch: 'LUNCH',
  dinner: 'DINNER',
};
