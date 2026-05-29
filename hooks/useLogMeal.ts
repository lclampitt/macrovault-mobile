import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { fmtLocalDate } from '../lib/date';
import {
  mealTypeFromPeriod,
  periodFromDate,
  type MealPeriod,
} from '../lib/meal-periods';

/**
 * Single shared writer for the meal store. Used by:
 *  • Dashboard "+ Log meal" affordance + +Log → Meal sheet
 *  • Meals tab "Anything else to add?" / empty-slot CTAs / "Add a snack"
 *
 * Period assignment:
 *  - If the caller explicitly supplies a period (e.g. user tapped an empty
 *    "Evening" slot), it's preserved.
 *  - Otherwise the period is derived from the current time at write.
 *
 * NOTE: We don't yet have a `meal_period` column on `food_logs`. Until that
 *   migration lands, the user-supplied period is *implicit*: it's encoded by
 *   choosing the right `created_at` timestamp (e.g. tagging as Evening sets
 *   the timestamp to 6:30pm local). Hacky but it round-trips correctly
 *   through `useDayLog` until we add the column.
 */
export type LogMealInput = {
  title: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** If omitted, derived from now. */
  period?: MealPeriod;
  /** Optional ingredient string. */
  ingredients?: string | null;
};

type Result = { error: string | null };

/** Roughly anchor the timestamp in the middle of each period. */
const PERIOD_ANCHOR_HOUR: Record<MealPeriod, number> = {
  morning: 8,
  noon: 13,
  evening: 19,
  snack: -1, // sentinel — keep "now"
};

function timestampForPeriod(period: MealPeriod, now: Date = new Date()): string {
  if (period === 'snack' || PERIOD_ANCHOR_HOUR[period] === now.getHours()) {
    return now.toISOString();
  }
  // Only nudge the timestamp if the user explicitly overrides the period to a
  // *different* time-of-day. Otherwise log "now" and let derivation match.
  const currentP = periodFromDate(now);
  if (currentP === period) return now.toISOString();
  const stamp = new Date(now);
  stamp.setHours(PERIOD_ANCHOR_HOUR[period], 0, 0, 0);
  return stamp.toISOString();
}

export function useLogMeal(onSuccess?: () => void) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const log = useCallback(
    async (input: LogMealInput): Promise<Result> => {
      if (!user) return { error: 'Not authenticated' };
      setSubmitting(true);
      setError(null);
      try {
        const now = new Date();
        const period = input.period ?? periodFromDate(now);
        // Nudge `created_at` so the timestamp sorts into the correct period —
        // useDayLog derives period from the hour-of-day, so this is how a
        // user-tagged "Evening" snack stays bucketed correctly even when
        // logged at lunchtime.
        const createdAt = timestampForPeriod(period, now);
        // Only insert columns the table is known to have. `meal_type` /
        // `ingredients` are intentionally omitted today — adding them would
        // 500 the insert on schemas that don't have those columns.
        // NOTE: When the schema gains `meal_period` or `meal_type`, add it
        //   here and stop relying on the created_at fudge.
        void mealTypeFromPeriod; // silence unused-import until schema lands
        const { error: insertError } = await supabase.from('food_logs').insert({
          user_id: user.id,
          logged_date: fmtLocalDate(now),
          meal_name: input.title.trim() || null,
          calories: Math.round(input.calories),
          protein_g: Math.round(input.protein * 10) / 10,
          carbs_g: Math.round(input.carbs * 10) / 10,
          fat_g: Math.round(input.fat * 10) / 10,
          created_at: createdAt,
        });
        if (insertError) throw insertError;
        onSuccess?.();
        return { error: null };
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to log meal';
        console.error('[useLogMeal]', message);
        setError(message);
        return { error: message };
      } finally {
        setSubmitting(false);
      }
    },
    [user, onSuccess],
  );

  return { log, submitting, error };
}
