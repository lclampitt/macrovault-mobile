import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { fmtLocalDate } from '../lib/date';
import {
  addDays,
  MEAL_TYPES,
  type MealPlanEntry,
} from './useMealPlanWeek';

type Result = { error: string | null };

type State = {
  loggedDays: Set<number>;
  busyDay: number | null;
  loading: boolean;
  /** Insert today's planner entries into food_logs (or unlog if already done). */
  toggleLogDay: (
    dayIdx: number,
    dayEntries: MealPlanEntry[],
  ) => Promise<Result>;
  refetch: () => Promise<void>;
};

/**
 * Tracks which days of the current week are already logged to food_logs, and
 * lets the user toggle a day's log on or off. Mirrors web's NOTES='From meal
 * planner' convention so the un-log targets exactly the planner-originated
 * rows, leaving any other food_logs intact.
 */
export function useLogDayToMacros(
  weekStart: Date,
  entries: MealPlanEntry[],
): State {
  const { user } = useAuth();
  const weekStartTime = weekStart.getTime();
  const [loggedDays, setLoggedDays] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busyDay, setBusyDay] = useState<number | null>(null);

  const weekDates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        fmtLocalDate(addDays(new Date(weekStartTime), i)),
      ),
    [weekStartTime],
  );

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Web counts a day as "logged" if any food_log exists for that date —
      // not just planner-tagged ones. Match that.
      const { data, error } = await supabase
        .from('food_logs')
        .select('logged_date')
        .eq('user_id', user.id)
        .in('logged_date', weekDates);
      if (error) throw error;
      const next = new Set<number>();
      (data ?? []).forEach((r: { logged_date: string }) => {
        const idx = weekDates.indexOf(r.logged_date);
        if (idx >= 0) next.add(idx);
      });
      setLoggedDays(next);
    } catch (e) {
      console.error('[useLogDayToMacros.fetch]', e);
      setLoggedDays(new Set());
    } finally {
      setLoading(false);
    }
  }, [user, weekDates]);

  useEffect(() => {
    fetchData();
    // Re-run when entries change so a fresh add bumps the day's "filled" check.
    // (loggedDays itself doesn't depend on entries — only the toggle's guard does.)
  }, [fetchData, entries.length]);

  const toggleLogDay = useCallback(
    async (dayIdx: number, dayEntries: MealPlanEntry[]): Promise<Result> => {
      if (!user) return { error: 'Not authenticated' };
      const dayDate = addDays(new Date(weekStartTime), dayIdx);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dayDate > today) {
        return { error: "Can't log a future date." };
      }
      const dateStr = fmtLocalDate(dayDate);
      const isLogged = loggedDays.has(dayIdx);

      setBusyDay(dayIdx);
      try {
        if (isLogged) {
          // Unlog — remove only planner-originated rows for this day.
          const { error: delErr } = await supabase
            .from('food_logs')
            .delete()
            .eq('user_id', user.id)
            .eq('logged_date', dateStr)
            .eq('notes', 'From meal planner');
          if (delErr) throw delErr;
          await fetchData();
          return { error: null };
        }

        // Log — require all three meal slots filled (matches web).
        const filledTypes = new Set(
          dayEntries
            .filter((e) => !!e.meal_name)
            .map((e) => e.meal_type.toLowerCase()),
        );
        const missing = MEAL_TYPES.filter((m) => !filledTypes.has(m));
        if (missing.length > 0) {
          return { error: 'Fill all meals to log this day.' };
        }

        const rows = dayEntries.map((e) => ({
          user_id: user.id,
          logged_date: dateStr,
          meal_name: e.meal_name,
          calories: e.calories,
          protein_g: e.protein,
          carbs_g: e.carbs,
          fat_g: e.fat,
          notes: 'From meal planner',
        }));

        // Avoid duplicates: clear any existing planner-tagged rows for this day first.
        await supabase
          .from('food_logs')
          .delete()
          .eq('user_id', user.id)
          .eq('logged_date', dateStr)
          .eq('notes', 'From meal planner');

        const { error: insErr } = await supabase
          .from('food_logs')
          .insert(rows);
        if (insErr) throw insErr;
        await fetchData();
        return { error: null };
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to update log';
        console.error('[useLogDayToMacros.toggle]', message);
        return { error: message };
      } finally {
        setBusyDay(null);
      }
    },
    [user, weekStartTime, loggedDays, fetchData],
  );

  return { loggedDays, busyDay, loading, toggleLogDay, refetch: fetchData };
}
