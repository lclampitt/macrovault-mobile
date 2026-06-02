import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';

export type PhaseType = 'cutting' | 'bulking' | 'maintenance';
export type WeightUnit = 'kg' | 'lb';

export type ActiveGoal = {
  id: string | null;
  goal: string; // raw column value: 'Cutting' | 'Bulking' | 'Maintenance'
  phaseName: string; // derived: "Cutting Phase"
  phaseType: PhaseType;
  status: 'active'; // web hardcodes "Active"
  createdAt: string | null; // ISO; web uses created_at as the start date
  startDate: string | null; // ISO date — start of the timeline
  targetDate: string | null; // ISO date — end of the timeline
  timeframeWeeks: number;
  hasTimeframe: boolean; // false when saved from the Macro Calculator (no timeframe yet)
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  calorieDelta: number | null;
  // Weight tracking (all optional — may be null on legacy rows)
  startWeight: number | null;
  startWeightUnit: WeightUnit | null;
  targetWeight: number | null;
  targetWeightUnit: WeightUnit | null;
  /** Most recent weight entry (from progress.weight_kg or body_metric_entries) */
  currentWeight: number | null;
  currentWeightUnit: WeightUnit | null;
  // Computed (client-side)
  weekNumber: number;
  totalWeeks: number;
  currentDay: number; // 1-based day index
  totalDays: number;
  daysRemaining: number;
  percentComplete: number; // 0-100
  daysLeft: number; // alias for daysRemaining (kept for backwards compat)
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

function startOfTodayISO(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Fetches the signed-in user's active goal from the `goals` table.
 * Returns null unless the goal is "complete" — matching web's
 * `hasGoal = !!goal && timeframe_weeks > 0 && calories > 0`. A goal saved only
 * via the Macro Calculator (no timeframe) is therefore treated as no goal.
 *
 * Also fetches the most recent weight entry to surface a "Now" milestone
 * in the timeline card.
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
      // 1) Active goal row. Use `.order(created_at desc).limit(1)` instead
      //    of maybeSingle() — once we start archiving by setting
      //    is_active=false, multiple historic rows can exist.
      const { data: goalData, error: queryError } = await supabase
        .from('goals')
        .select(
          'id, goal, calories, protein, carbs, fat, timeframe_weeks, created_at, start_date, target_date, start_weight_value, start_weight_unit, target_weight_value, target_weight_unit, calorie_delta, is_active',
        )
        .eq('user_id', user.id)
        .or('is_active.is.null,is_active.eq.true')
        .order('created_at', { ascending: false })
        .limit(1);
      if (queryError && queryError.code !== 'PGRST116') throw queryError;

      const data = goalData?.[0];
      const rawGoal: string = data?.goal ?? '';
      const calories = Number(data?.calories) || 0;
      const protein = Number(data?.protein) || 0;
      const carbs = Number(data?.carbs) || 0;
      const fat = Number(data?.fat) || 0;
      const timeframeWeeks = Number(data?.timeframe_weeks) || 0;
      const createdAt: string | null = data?.created_at ?? null;
      const startDate: string | null = data?.start_date ?? null;
      const targetDate: string | null = data?.target_date ?? null;
      const calorieDelta =
        data?.calorie_delta != null ? Number(data.calorie_delta) : null;

      const startWeight =
        data?.start_weight_value != null
          ? Number(data.start_weight_value)
          : null;
      const startWeightUnit: WeightUnit | null = data?.start_weight_unit ?? null;
      const targetWeight =
        data?.target_weight_value != null
          ? Number(data.target_weight_value)
          : null;
      const targetWeightUnit: WeightUnit | null =
        data?.target_weight_unit ?? null;

      const hasGoal = !!rawGoal && calories > 0;
      if (!hasGoal) {
        setGoal(null);
        return;
      }
      const hasTimeframe = timeframeWeeks > 0;

      // 2) Latest weight reading — checked from body_metric_entries first
      //    (new system), then progress.weight_kg (legacy web compat).
      let currentWeight: number | null = null;
      let currentWeightUnit: WeightUnit | null = null;
      try {
        const { data: bm } = await supabase
          .from('body_metric_entries')
          .select('value, unit, logged_at')
          .eq('user_id', user.id)
          .eq('metric_id', 'weight')
          .order('logged_at', { ascending: false })
          .limit(1);
        if (bm && bm.length > 0) {
          currentWeight = Number(bm[0].value);
          const u = bm[0].unit;
          if (u === 'kg' || u === 'lb') currentWeightUnit = u;
        }
      } catch {
        // Non-fatal — weight is optional.
      }
      if (currentWeight == null) {
        try {
          const { data: progress } = await supabase
            .from('progress')
            .select('weight_kg, updated_at')
            .eq('user_id', user.id)
            .maybeSingle();
          if (progress?.weight_kg != null) {
            currentWeight = Number(progress.weight_kg);
            currentWeightUnit = 'kg';
          }
        } catch {
          // Non-fatal.
        }
      }

      // 3) Compute timeline math from start_date if present, else fall
      //    back to created_at (legacy rows).
      const startAnchorISO = startDate ?? createdAt;
      const startAnchor = startAnchorISO
        ? new Date(startAnchorISO + (startDate ? 'T00:00:00' : ''))
        : null;
      const today = startOfTodayISO();

      const totalDays = hasTimeframe ? timeframeWeeks * 7 : 0;
      let currentDay = 0;
      if (startAnchor) {
        const diffDays = Math.floor(
          (today.getTime() - startAnchor.getTime()) / (24 * 60 * 60 * 1000),
        );
        currentDay = Math.max(1, diffDays + 1);
        if (totalDays > 0) currentDay = Math.min(currentDay, totalDays);
      }
      const daysRemaining = hasTimeframe
        ? Math.max(totalDays - Math.max(0, currentDay - 1), 0)
        : 0;
      const percentComplete =
        totalDays > 0
          ? Math.min(((currentDay - 1) / totalDays) * 100, 100)
          : 0;

      const weeksElapsed = startAnchor
        ? Math.floor(
            (today.getTime() - startAnchor.getTime()) /
              (7 * 24 * 60 * 60 * 1000),
          )
        : 0;
      const weekNumber = Math.max(
        1,
        Math.min(weeksElapsed + 1, timeframeWeeks || 1),
      );

      setGoal({
        id: data?.id ?? null,
        goal: rawGoal,
        phaseName: `${rawGoal} Phase`,
        phaseType: rawGoal.toLowerCase() as PhaseType,
        status: 'active',
        createdAt,
        startDate,
        targetDate,
        timeframeWeeks,
        hasTimeframe,
        calories,
        protein,
        carbs,
        fat,
        calorieDelta,
        startWeight,
        startWeightUnit,
        targetWeight,
        targetWeightUnit,
        currentWeight,
        currentWeightUnit,
        weekNumber,
        totalWeeks: timeframeWeeks,
        currentDay,
        totalDays,
        daysRemaining,
        percentComplete,
        daysLeft: daysRemaining,
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
