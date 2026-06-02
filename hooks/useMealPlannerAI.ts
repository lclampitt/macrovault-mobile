import { useCallback, useState } from 'react';
import { API_BASE } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import type { MealType } from './useMealPlanWeek';

export type AISuggestion = {
  meal_name: string;
  ingredients: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type AIWeekEntry = {
  day_of_week: number; // 0-4 from /suggest-week; 5-6 filled in by mobile via /suggest
  meal_type: MealType;
  meal_name: string;
  ingredients: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type SingleResult = { suggestions: AISuggestion[] | null; error: string | null };
type WeekResult = { entries: AIWeekEntry[] | null; error: string | null };

type State = {
  loading: boolean;
  loadingWeek: boolean;
  weekProgress: { done: number; total: number }; // 0/7 → 7/7
  /** /meal-planner/suggest — 5 options for one slot. */
  suggestForSlot: (args: {
    /** 0=Mon … 6=Sun — converted to a day-name string for the backend. */
    dayOfWeek: number;
    mealType: MealType;
    remaining: { calories: number; protein: number; carbs: number; fat: number };
    goal: string; // 'cutting' | 'bulking' | 'maintenance'
    dietPreference?: string;
  }) => Promise<SingleResult>;
  /** /meal-planner/suggest-week + 6 single-slot calls for Sat/Sun → 21 entries. */
  suggestFullWeek: (args: {
    goal: string;
    dietPreference?: string;
    dailyTargets: { calories: number; protein: number; carbs: number; fat: number };
  }) => Promise<WeekResult>;
};

function normalizeMealType(s: string): MealType {
  const v = s.toLowerCase();
  if (v === 'breakfast' || v === 'lunch' || v === 'dinner') return v;
  return 'lunch';
}

// Mobile's day_of_week is 0=Mon … 6=Sun (matches DAY_LABELS in useMealPlanWeek).
// The FastAPI /meal-planner/suggest endpoint now requires `day` as a string —
// the web app sends full English weekday names, so we match that here.
const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

function dayNameFromIndex(i: number): string {
  if (i < 0 || i > 6 || !Number.isFinite(i)) return 'Monday';
  return DAY_NAMES[i];
}

function normalizeSuggestion(m: any): AISuggestion {
  // Backend usually returns {meal_name, ingredients, calories, protein, carbs, fat}
  // but a few fallback paths use protein_g/etc. Normalize.
  const ing = Array.isArray(m.ingredients)
    ? m.ingredients.join(', ')
    : String(m.ingredients ?? '');
  return {
    meal_name: String(m.meal_name ?? ''),
    ingredients: ing,
    calories: Number(m.calories ?? 0) || 0,
    protein: Number(m.protein ?? m.protein_g ?? 0) || 0,
    carbs: Number(m.carbs ?? m.carbs_g ?? 0) || 0,
    fat: Number(m.fat ?? m.fat_g ?? 0) || 0,
  };
}

function decodeErrorBody(text: string, status: number): string {
  try {
    const json = JSON.parse(text);
    if (typeof json.detail === 'string') return json.detail;
    if (json.detail?.error === 'limit_reached')
      return 'Monthly AI suggestion limit reached.';
  } catch {
    /* not JSON */
  }
  if (status === 403) return 'AI suggestions require a Pro+ subscription.';
  if (status === 429) return 'Monthly AI suggestion limit reached (300/month).';
  return `AI service error (${status}).`;
}

/**
 * Mobile wrapper around the FastAPI /meal-planner/suggest and /suggest-week
 * endpoints. Both endpoints enforce Pro+ + 300/month server-side; this hook
 * surfaces those errors as inline strings rather than letting them fall
 * through as fetch failures.
 */
export function useMealPlannerAI(): State {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingWeek, setLoadingWeek] = useState(false);
  const [weekProgress, setWeekProgress] = useState({ done: 0, total: 0 });

  const suggestForSlot = useCallback<State['suggestForSlot']>(
    async ({ dayOfWeek, mealType, remaining, goal, dietPreference }) => {
      if (!user) return { suggestions: null, error: 'Not authenticated' };
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/meal-planner/suggest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            // Required by MealSuggestRequest — full English weekday name.
            // Backend treats this as the prompt's "what day are we planning"
            // hint so meals get a bit of natural variety across the week.
            day: dayNameFromIndex(dayOfWeek),
            meal_type: mealType,
            remaining_calories: Math.max(0, Math.round(remaining.calories)),
            remaining_protein: Math.max(0, Math.round(remaining.protein)),
            remaining_carbs: Math.max(0, Math.round(remaining.carbs)),
            remaining_fat: Math.max(0, Math.round(remaining.fat)),
            goal,
            diet_preference: dietPreference || 'standard',
          }),
        });
        if (!res.ok) {
          const body = await res.text();
          return { suggestions: null, error: decodeErrorBody(body, res.status) };
        }
        const json = await res.json();
        const list = Array.isArray(json?.suggestions)
          ? json.suggestions.map(normalizeSuggestion)
          : [];
        return { suggestions: list, error: null };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Network error';
        console.error('[useMealPlannerAI.suggestForSlot]', msg);
        return { suggestions: null, error: msg };
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  const suggestFullWeek = useCallback<State['suggestFullWeek']>(
    async ({ goal, dietPreference, dailyTargets }) => {
      if (!user) return { entries: null, error: 'Not authenticated' };
      setLoadingWeek(true);
      // Total: 1 week call (counts as 15 uses) + 6 single calls = 7 HTTP calls.
      setWeekProgress({ done: 0, total: 7 });
      try {
        // 1) Mon-Fri bulk
        const weekRes = await fetch(`${API_BASE}/meal-planner/suggest-week`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            goal,
            diet_preference: dietPreference || 'standard',
            daily_targets: dailyTargets,
          }),
        });
        if (!weekRes.ok) {
          const body = await weekRes.text();
          return { entries: null, error: decodeErrorBody(body, weekRes.status) };
        }
        const weekJson = await weekRes.json();
        const weekEntries: AIWeekEntry[] = Array.isArray(weekJson?.entries)
          ? weekJson.entries.map((e: any) => {
              const s = normalizeSuggestion(e);
              return {
                day_of_week: Number(e.day_of_week) || 0,
                meal_type: normalizeMealType(String(e.meal_type ?? 'lunch')),
                meal_name: s.meal_name,
                ingredients: s.ingredients,
                calories: s.calories,
                protein: s.protein,
                carbs: s.carbs,
                fat: s.fat,
              };
            })
          : [];
        setWeekProgress({ done: 1, total: 7 });

        // 2) Sat (5) + Sun (6) — one /suggest call per meal type. Sequential so
        // the rate limit + counter stay sane.
        const weekendEntries: AIWeekEntry[] = [];
        const weekendDays: Array<{ day: number; mt: MealType }> = [
          { day: 5, mt: 'breakfast' },
          { day: 5, mt: 'lunch' },
          { day: 5, mt: 'dinner' },
          { day: 6, mt: 'breakfast' },
          { day: 6, mt: 'lunch' },
          { day: 6, mt: 'dinner' },
        ];
        for (let i = 0; i < weekendDays.length; i++) {
          const slot = weekendDays[i];
          // Compute "remaining" macros for that day = full daily target divided
          // by 3 with a slight bias for the meal type. Backend just needs a
          // ballpark for the prompt.
          const split = {
            calories: Math.round(dailyTargets.calories / 3),
            protein: Math.round(dailyTargets.protein / 3),
            carbs: Math.round(dailyTargets.carbs / 3),
            fat: Math.round(dailyTargets.fat / 3),
          };
          const r = await fetch(`${API_BASE}/meal-planner/suggest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user.id,
              // /suggest now requires `day` — Sat=5, Sun=6 → "Saturday"/"Sunday".
              day: dayNameFromIndex(slot.day),
              meal_type: slot.mt,
              remaining_calories: split.calories,
              remaining_protein: split.protein,
              remaining_carbs: split.carbs,
              remaining_fat: split.fat,
              goal,
              diet_preference: dietPreference || 'standard',
            }),
          });
          if (!r.ok) {
            const body = await r.text();
            // Return what we have so far — let the caller decide to commit.
            return {
              entries: weekEntries.concat(weekendEntries),
              error: decodeErrorBody(body, r.status),
            };
          }
          const j = await r.json();
          const list = Array.isArray(j?.suggestions)
            ? j.suggestions.map(normalizeSuggestion)
            : [];
          const pick = list[0];
          if (pick) {
            weekendEntries.push({
              day_of_week: slot.day,
              meal_type: slot.mt,
              meal_name: pick.meal_name,
              ingredients: pick.ingredients,
              calories: pick.calories,
              protein: pick.protein,
              carbs: pick.carbs,
              fat: pick.fat,
            });
          }
          setWeekProgress({ done: i + 2, total: 7 });
        }

        return {
          entries: weekEntries.concat(weekendEntries),
          error: null,
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Network error';
        console.error('[useMealPlannerAI.suggestFullWeek]', msg);
        return { entries: null, error: msg };
      } finally {
        setLoadingWeek(false);
      }
    },
    [user],
  );

  return {
    loading,
    loadingWeek,
    weekProgress,
    suggestForSlot,
    suggestFullWeek,
  };
}
