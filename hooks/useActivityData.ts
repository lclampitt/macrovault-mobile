import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { fmtLocalDate } from '../lib/date';
import {
  BODY_PART_LABELS,
  BODY_PART_ORDER,
  bodyPartForExerciseName,
} from '../lib/exercises';

export type DayCategory = 'workout-only' | 'meals-only' | 'both' | 'none';

export type DayState = {
  workouts: { name: string; exerciseCount: number }[];
  meals: { name: string; calories: number }[];
  totalCalories: number;
  category: DayCategory;
};

export type ActivityStats = {
  daysLogged: number;
  workouts: number;
  currentStreak: number;
};

export type MuscleSplitEntry = {
  /** Catalog key (e.g. "chest", "back"). */
  key: string;
  /** Title-cased label for display. */
  label: string;
  /** Number of exercise instances logged in the window. */
  count: number;
  /** count / max(count) — useful for bar widths in the UI. */
  pct: number;
};

type State = {
  byDate: Record<string, DayState>;
  stats: ActivityStats;
  /** Body-part counts from logged workouts, last 30 days. Sorted desc by count. */
  muscleSplit: MuscleSplitEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

type FoodRow = { logged_date: string | null; meal_name: string | null; calories: number | string | null };
type WorkoutRow = {
  workout_date: string | null;
  workout_name: string | null;
  exercises: unknown;
};

function categoryFor(hasW: boolean, hasM: boolean): DayCategory {
  if (hasW && hasM) return 'both';
  if (hasW) return 'workout-only';
  if (hasM) return 'meals-only';
  return 'none';
}

/**
 * Aggregate body-part counts from logged workouts in the last 30 days.
 * Each exercise instance counts once; sets within an exercise don't compound.
 */
function buildMuscleSplit(workouts: WorkoutRow[]): MuscleSplitEntry[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  cutoff.setHours(0, 0, 0, 0);
  const cutoffStr = (() => {
    const y = cutoff.getFullYear();
    const m = String(cutoff.getMonth() + 1).padStart(2, '0');
    const d = String(cutoff.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  })();

  const counts: Record<string, number> = {};
  for (const w of workouts) {
    if (!w.workout_date || w.workout_date < cutoffStr) continue;
    const exs = Array.isArray(w.exercises) ? (w.exercises as Array<{ name?: unknown }>) : [];
    for (const ex of exs) {
      const name = typeof ex?.name === 'string' ? ex.name : '';
      if (!name) continue;
      const part = bodyPartForExerciseName(name);
      counts[part] = (counts[part] ?? 0) + 1;
    }
  }

  const max = Math.max(0, ...Object.values(counts));
  return Object.entries(counts)
    .map(([key, count]) => ({
      key,
      label: BODY_PART_LABELS[key] ?? key.replace(/\b\w/g, (c) => c.toUpperCase()),
      count,
      pct: max > 0 ? count / max : 0,
    }))
    .sort((a, b) => {
      // Primary: descending count. Tiebreak: catalog order so the chart
      // doesn't flicker between equal-count parts on refetch.
      if (b.count !== a.count) return b.count - a.count;
      return BODY_PART_ORDER.indexOf(a.key) - BODY_PART_ORDER.indexOf(b.key);
    });
}

/** Port of buildDayStates() from gainlytics-v2/src/pages/activity.jsx. */
function buildDayStates(
  workouts: WorkoutRow[],
  foodLogs: FoodRow[],
): Record<string, DayState> {
  const map: Record<string, DayState> = {};

  workouts.forEach((w) => {
    const date = w.workout_date;
    if (!date) return;
    if (!map[date]) map[date] = { workouts: [], meals: [], totalCalories: 0, category: 'none' };
    map[date].workouts.push({
      name: w.workout_name || 'Workout',
      exerciseCount: Array.isArray(w.exercises) ? w.exercises.length : 0,
    });
  });

  foodLogs.forEach((f) => {
    const date = f.logged_date;
    if (!date) return;
    if (!map[date]) map[date] = { workouts: [], meals: [], totalCalories: 0, category: 'none' };
    const cal = Number(f.calories) || 0;
    map[date].meals.push({ name: f.meal_name || 'Meal', calories: cal });
    map[date].totalCalories += cal;
  });

  Object.keys(map).forEach((k) => {
    map[k].category = categoryFor(map[k].workouts.length > 0, map[k].meals.length > 0);
  });

  return map;
}

/**
 * Streak = consecutive days (ending today, or yesterday if nothing today) that
 * have at least one workout, progress entry, or food log. Ported from
 * gainlytics-v2/src/lib/streak.js, but using LOCAL dates for consistency with
 * the rest of the mobile app (web's streak.js used UTC — minor divergence).
 */
async function computeStreak(userId: string): Promise<number> {
  const [{ data: workouts }, { data: progress }, { data: foodLogs }] = await Promise.all([
    supabase.from('workouts').select('workout_date').eq('user_id', userId),
    supabase.from('progress').select('date').eq('user_id', userId),
    supabase.from('food_logs').select('logged_date').eq('user_id', userId),
  ]);

  const active = new Set<string>();
  (workouts ?? []).forEach((r: { workout_date: string | null }) => {
    if (r.workout_date) active.add(r.workout_date);
  });
  (progress ?? []).forEach((r: { date: string | null }) => {
    if (r.date) active.add(r.date);
  });
  (foodLogs ?? []).forEach((r: { logged_date: string | null }) => {
    if (r.logged_date) active.add(r.logged_date);
  });

  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  if (!active.has(fmtLocalDate(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!active.has(fmtLocalDate(cursor))) return 0;
  }

  let streak = 0;
  while (active.has(fmtLocalDate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/**
 * Fetches a full calendar year of workouts + food logs and aggregates them
 * per-day. The web fetches the whole year regardless of view mode and derives
 * month stats from the same dataset — we do the same.
 */
export function useActivityData(year: number): State {
  const { user } = useAuth();
  const [byDate, setByDate] = useState<Record<string, DayState>>({});
  const [currentStreak, setCurrentStreak] = useState(0);
  const [muscleSplit, setMuscleSplit] = useState<MuscleSplitEntry[]>([]);
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
      const first = `${year}-01-01`;
      const last = `${year}-12-31`;
      const [{ data: foods, error: foodErr }, { data: workouts, error: woErr }] =
        await Promise.all([
          supabase
            .from('food_logs')
            .select('logged_date, meal_name, calories')
            .eq('user_id', user.id)
            .gte('logged_date', first)
            .lte('logged_date', last),
          supabase
            .from('workouts')
            .select('workout_date, workout_name, exercises')
            .eq('user_id', user.id)
            .gte('workout_date', first)
            .lte('workout_date', last),
        ]);
      if (foodErr) throw foodErr;
      if (woErr) throw woErr;

      const workoutRows = (workouts ?? []) as WorkoutRow[];
      setByDate(
        buildDayStates(workoutRows, (foods ?? []) as FoodRow[]),
      );
      setMuscleSplit(buildMuscleSplit(workoutRows));

      try {
        setCurrentStreak(await computeStreak(user.id));
      } catch (streakErr) {
        // Streak is non-critical — log and continue with 0.
        console.error('[useActivityData.streak]', streakErr);
        setCurrentStreak(0);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load activity';
      console.error('[useActivityData]', message);
      setError(message);
      setByDate({});
    } finally {
      setLoading(false);
    }
  }, [user, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const stats = useMemo<ActivityStats>(() => {
    let daysLogged = 0;
    let workouts = 0;
    Object.values(byDate).forEach((d) => {
      if (d.category !== 'none') daysLogged++;
      workouts += d.workouts.length;
    });
    return { daysLogged, workouts, currentStreak };
  }, [byDate, currentStreak]);

  return { byDate, stats, muscleSplit, loading, error, refetch: fetchData };
}
