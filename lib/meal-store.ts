// Unified meal-entry shape consumed by both:
//   • Dashboard "Today's Timeline" (today only)
//   • Meals tab "Logged" view (any day)
//
// Internally, this is backed by the existing `food_logs` table — same source
// of truth used by NutritionLogger on web. The "period" field is derived from
// `created_at` until/unless we add a `meal_period text` column to the table.
//
// NOTE: Adding a real `meal_period` column to `food_logs` would make it
//   possible to: (a) preserve user intent if they snack at 11am and want it
//   tagged Snack instead of Morning, (b) query per-period totals cheaply.
//   For now, period is recomputed every read from the timestamp.

import {
  PERIOD_LABELS,
  PERIOD_LABELS_UPPER,
  periodFromHour,
  type MealPeriod,
} from './meal-periods';

/** Raw shape coming back from the `food_logs` table. */
export type FoodLogRow = {
  id: string;
  meal_name: string | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  created_at: string;
  ingredients?: string | null;
};

export type MealEntry = {
  id: string;
  /** UTC ISO timestamp — drives sort order. */
  timestamp: string;
  /** Display bucket. Derived from hour of timestamp unless overridden. */
  period: MealPeriod;
  title: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Optional ingredient string ("150g chicken, 80g rice, …"). */
  ingredients?: string | null;
};

export function fromFoodLog(row: FoodLogRow): MealEntry {
  const d = new Date(row.created_at);
  const period: MealPeriod = Number.isFinite(d.getTime())
    ? periodFromHour(d.getHours())
    : 'noon';
  return {
    id: row.id,
    timestamp: row.created_at,
    period,
    title: row.meal_name?.trim() || 'Logged meal',
    calories: row.calories,
    protein: row.protein_g,
    carbs: row.carbs_g,
    fat: row.fat_g,
    ingredients: row.ingredients ?? null,
  };
}

export function groupByPeriod(entries: MealEntry[]): Record<MealPeriod, MealEntry[]> {
  const out: Record<MealPeriod, MealEntry[]> = {
    morning: [],
    noon: [],
    evening: [],
    snack: [],
  };
  for (const e of entries) {
    out[e.period].push(e);
  }
  return out;
}

/** Sum macros across an entry list. */
export function sumEntries(entries: MealEntry[]) {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

/** Re-exported for callers that only need the labels. */
export { PERIOD_LABELS, PERIOD_LABELS_UPPER };
