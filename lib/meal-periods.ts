// Period-based meal labeling.
//
// The app stores real timestamps internally (so meals sort chronologically and
// can be charted against a clock if ever needed) but every UI surface that
// previously rendered "7:42 AM" now renders one of four period labels:
//
//   • Morning   — 5:00am – 10:59am
//   • Noon      — 11:00am – 3:59pm
//   • Evening   — 4:00pm – 4:59am (wraps midnight)
//   • Snack     — user-tagged; never assigned automatically
//
// Anywhere the legacy `MealType` ('breakfast'|'lunch'|'dinner'|'snack') exists
// we map it 1:1 to a period for display, so the storage schema doesn't have
// to change in lockstep.
//
// NOTE: The web app still uses clock times in places (TimelineModal). When we
//   sync this back to web, decide whether to mirror periods there too or keep
//   it as a mobile-only convention.

import {
  Cookie,
  Moon,
  Sun,
  Sunrise,
  type LucideIcon,
} from 'lucide-react-native';
import type { MealType } from '../hooks/useMealPlanWeek';

export type MealPeriod = 'morning' | 'noon' | 'evening' | 'snack';

/** Display label for the period — title-cased. */
export const PERIOD_LABELS: Record<MealPeriod, string> = {
  morning: 'Morning',
  noon: 'Noon',
  evening: 'Evening',
  snack: 'Snack',
};

/** All-caps label for chrome (slot rows, section headers). */
export const PERIOD_LABELS_UPPER: Record<MealPeriod, string> = {
  morning: 'MORNING',
  noon: 'NOON',
  evening: 'EVENING',
  snack: 'SNACK',
};

/** Icon per period. */
export const PERIOD_ICONS: Record<MealPeriod, LucideIcon> = {
  morning: Sunrise,
  noon: Sun,
  evening: Moon,
  snack: Cookie,
};

/** Empty-state CTA label per period. */
export const PERIOD_CTA: Record<MealPeriod, string> = {
  morning: 'Log morning meal',
  noon: 'Log noon meal',
  evening: 'Log evening meal',
  snack: 'Add a snack',
};

/** Greeting copy used in headers / banners. */
export const PERIOD_GREETING: Record<MealPeriod, string> = {
  morning: 'Good morning',
  noon: 'Good afternoon',
  evening: 'Good evening',
  snack: 'Good evening', // snack is a tag, not a clock period
};

const PERIOD_ORDER: MealPeriod[] = ['morning', 'noon', 'evening', 'snack'];
/** For sorting within a day: morning → noon → evening → snack. */
export function periodSortKey(p: MealPeriod): number {
  return PERIOD_ORDER.indexOf(p);
}

/**
 * Derive the period from a clock time. Snack is never auto-assigned — users
 * tag it manually.
 *
 * Default hours:
 *  - < 11am   → morning
 *  - 11am-4pm → noon
 *  - ≥ 4pm    → evening
 *
 * (Wee-hours 0–4am also fall under evening so a 1am log feels like "last
 *  night" rather than "this morning".)
 */
export function periodFromHour(hour: number): Exclude<MealPeriod, 'snack'> {
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 16) return 'noon';
  return 'evening';
}

/** Convenience wrapper around the current wall-clock time. */
export function periodFromDate(d: Date = new Date()): Exclude<MealPeriod, 'snack'> {
  return periodFromHour(d.getHours());
}

/** Map the legacy MealType field on saved rows to a period. */
export function periodFromMealType(t: MealType | string | null | undefined): MealPeriod {
  switch (t) {
    case 'breakfast':
      return 'morning';
    case 'lunch':
      return 'noon';
    case 'dinner':
      return 'evening';
    case 'snack':
      return 'snack';
    default:
      // Unknown / null — bucket into the current period so something renders.
      return periodFromDate();
  }
}

/**
 * Inverse — when we need to persist to the legacy `meal_type` column from a
 * UI that thinks in periods.
 */
export function mealTypeFromPeriod(p: MealPeriod): MealType {
  switch (p) {
    case 'morning':
      return 'breakfast';
    case 'noon':
      return 'lunch';
    case 'evening':
      return 'dinner';
    case 'snack':
      return 'snack';
  }
}

/** Returns a copy of the array sorted by period (then by created timestamp). */
export function sortByPeriod<T extends { period: MealPeriod; timestamp?: string | number }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const pa = periodSortKey(a.period);
    const pb = periodSortKey(b.period);
    if (pa !== pb) return pa - pb;
    const ta = typeof a.timestamp === 'number' ? a.timestamp : Date.parse(a.timestamp ?? '');
    const tb = typeof b.timestamp === 'number' ? b.timestamp : Date.parse(b.timestamp ?? '');
    return (Number.isFinite(ta) ? ta : 0) - (Number.isFinite(tb) ? tb : 0);
  });
}
