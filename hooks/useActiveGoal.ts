import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';

export type PhaseType = 'cutting' | 'bulking' | 'maintenance';

export type ActiveGoal = {
  id: string | null;
  goal: string; // raw column value: 'Cutting' | 'Bulking' | 'Maintenance'
  phaseName: string; // derived: "Cutting Phase"
  phaseType: PhaseType;
  status: 'active'; // web hardcodes "Active"
  createdAt: string | null; // ISO; web uses created_at as the start date
  timeframeWeeks: number;
  hasTimeframe: boolean; // false when saved from the Macro Calculator (no timeframe yet)
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  // Computed (client-side, mirrors web goalplanner.jsx:462-475)
  weekNumber: number;
  percentComplete: number; // 0-100
  daysLeft: number; // clamped >= 0
  motivation: string;
};

const MOTIVATIONS: Record<string, string> = {
  Cutting: 'Stay consistent — every deficit counts.',
  Bulking: 'Keep eating and lifting — progress takes time.',
  Maintenance: "Consistency is key. You're doing great.",
};

type State = {
  goal: ActiveGoal | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

/**
 * Fetches the signed-in user's goal from the `goals` table (singleton row).
 * Returns null unless the goal is "complete" — matching web's
 * `hasGoal = !!goal && timeframe_weeks > 0 && calories > 0`. A goal saved only
 * via the Macro Calculator (no timeframe) is therefore treated as no goal.
 */
export function useActiveGoal(): State {
  const { user } = useAuth();
  const [goal, setGoal] = useState<ActiveGoal | null>(null);
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
        .from('goals')
        .select('id, goal, calories, protein, carbs, fat, timeframe_weeks, created_at')
        .eq('user_id', user.id)
        .maybeSingle();
      if (queryError && queryError.code !== 'PGRST116') throw queryError;

      const rawGoal: string = data?.goal ?? '';
      const calories = Number(data?.calories) || 0;
      const protein = Number(data?.protein) || 0;
      const carbs = Number(data?.carbs) || 0;
      const fat = Number(data?.fat) || 0;
      const timeframeWeeks = Number(data?.timeframe_weeks) || 0;
      const createdAt: string | null = data?.created_at ?? null;

      // A goal saved from the Macro Calculator has a goal type + macros but
      // no timeframe yet. We still surface it so the user sees their result
      // under the Goal Planner; the timeline is simply omitted until a
      // timeframe is set (Phase 9c editor).
      const hasGoal = !!rawGoal && calories > 0;
      if (!hasGoal) {
        setGoal(null);
        return;
      }
      const hasTimeframe = timeframeWeeks > 0;

      const weeksElapsed = createdAt
        ? Math.floor(
            (Date.now() - new Date(createdAt).getTime()) /
              (7 * 24 * 60 * 60 * 1000),
          )
        : 0;
      const weekNumber = Math.min(weeksElapsed + 1, timeframeWeeks || 1);
      const percentComplete =
        timeframeWeeks > 0
          ? Math.min((weeksElapsed / timeframeWeeks) * 100, 100)
          : 0;
      const daysLeft =
        timeframeWeeks > 0
          ? Math.max(timeframeWeeks * 7 - weeksElapsed * 7, 0)
          : 0;

      setGoal({
        id: data?.id ?? null,
        goal: rawGoal,
        phaseName: `${rawGoal} Phase`,
        phaseType: rawGoal.toLowerCase() as PhaseType,
        status: 'active',
        createdAt,
        timeframeWeeks,
        hasTimeframe,
        calories,
        protein,
        carbs,
        fat,
        weekNumber,
        percentComplete,
        daysLeft,
        motivation: MOTIVATIONS[rawGoal] ?? "Keep going — you've got this.",
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load goal';
      console.error('[useActiveGoal]', message);
      setError(message);
      setGoal(null);
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

  return { goal, loading, error, refetch: fetchData };
}
