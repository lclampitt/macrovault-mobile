import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { fmtLocalDate } from '../lib/date';
import {
  addDays,
  type MealPlanEntry,
  type MealType,
} from './useMealPlanWeek';

export type SwapPayload = {
  meal_name: string;
  ingredients: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type Result<T = undefined> = { error: string | null; data?: T };

type State = {
  saving: boolean;
  deletingId: string | null;
  clearing: boolean;
  /** Lazily creates the meal_plans row for this week and returns its id. */
  getOrCreatePlanId: (weekStart: Date) => Promise<string | null>;
  /** Insert OR replace the entry at (planId, day_of_week, meal_type). */
  addOrReplace: (args: {
    planId: string;
    day_of_week: number;
    meal_type: MealType;
    weekStart: Date;
    meal: SwapPayload;
    existingEntry: MealPlanEntry | null;
  }) => Promise<Result<MealPlanEntry>>;
  /** Delete an entry by id. Cleans up the matching food_log if scheduled today. */
  deleteEntry: (entry: MealPlanEntry, weekStart: Date) => Promise<Result>;
  /** Wipe every entry for this plan + any planner-originated food_logs that week. */
  clearWeek: (planId: string, weekStart: Date) => Promise<Result>;
  /** Replace the entire week's plan in one go (used by AI suggest week). */
  replaceWeek: (
    planId: string,
    weekStart: Date,
    entries: Array<{
      day_of_week: number;
      meal_type: MealType;
      meal_name: string;
      ingredients: string | null;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }>,
  ) => Promise<Result>;
};

export function useMealPlanMutations(): State {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const getOrCreatePlanId = useCallback(
    async (weekStart: Date): Promise<string | null> => {
      if (!user) return null;
      const weekStr = fmtLocalDate(weekStart);
      const { data: existing } = await supabase
        .from('meal_plans')
        .select('id')
        .eq('user_id', user.id)
        .eq('week_start', weekStr)
        .maybeSingle();
      if (existing?.id) return String(existing.id);
      const { data: created, error } = await supabase
        .from('meal_plans')
        .insert({ user_id: user.id, week_start: weekStr })
        .select('id')
        .single();
      if (error || !created?.id) {
        console.error('[useMealPlanMutations.getOrCreatePlanId]', error);
        return null;
      }
      return String(created.id);
    },
    [user],
  );

  const addOrReplace = useCallback(
    async (args: {
      planId: string;
      day_of_week: number;
      meal_type: MealType;
      weekStart: Date;
      meal: SwapPayload;
      existingEntry: MealPlanEntry | null;
    }): Promise<Result<MealPlanEntry>> => {
      if (!user) return { error: 'Not authenticated' };
      setSaving(true);
      try {
        const payload = {
          meal_name: args.meal.meal_name,
          ingredients: args.meal.ingredients,
          calories: args.meal.calories,
          protein: args.meal.protein,
          carbs: args.meal.carbs,
          fat: args.meal.fat,
        };
        if (args.existingEntry) {
          const { error } = await supabase
            .from('meal_plan_entries')
            .update(payload)
            .eq('id', args.existingEntry.id);
          if (error) throw error;
          // Mirror web: if the *old* meal was logged to food_logs, remove it
          // so the day's logged state reflects the replacement.
          if (args.existingEntry.meal_name) {
            const entryDateStr = fmtLocalDate(
              addDays(args.weekStart, args.day_of_week),
            );
            await supabase
              .from('food_logs')
              .delete()
              .eq('user_id', user.id)
              .eq('logged_date', entryDateStr)
              .eq('meal_name', args.existingEntry.meal_name)
              .eq('notes', 'From meal planner');
          }
        } else {
          const { error } = await supabase.from('meal_plan_entries').insert({
            plan_id: args.planId,
            day_of_week: args.day_of_week,
            meal_type: args.meal_type,
            ...payload,
          });
          if (error) throw error;
        }
        return { error: null };
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to save meal';
        console.error('[useMealPlanMutations.addOrReplace]', message);
        return { error: message };
      } finally {
        setSaving(false);
      }
    },
    [user],
  );

  const deleteEntry = useCallback(
    async (entry: MealPlanEntry, weekStart: Date): Promise<Result> => {
      if (!user) return { error: 'Not authenticated' };
      setDeletingId(entry.id);
      try {
        const { error } = await supabase
          .from('meal_plan_entries')
          .delete()
          .eq('id', entry.id);
        if (error) throw error;
        // If the deleted meal was scheduled for today, unlog it from food_logs
        // so the home dashboard's macro totals stay accurate.
        const entryDateStr = fmtLocalDate(addDays(weekStart, entry.day_of_week));
        const todayStr = fmtLocalDate(new Date());
        if (entryDateStr === todayStr && entry.meal_name) {
          await supabase
            .from('food_logs')
            .delete()
            .eq('user_id', user.id)
            .eq('logged_date', todayStr)
            .eq('meal_name', entry.meal_name)
            .eq('notes', 'From meal planner');
        }
        return { error: null };
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to remove meal';
        console.error('[useMealPlanMutations.deleteEntry]', message);
        return { error: message };
      } finally {
        setDeletingId(null);
      }
    },
    [user],
  );

  const clearWeek = useCallback(
    async (planId: string, weekStart: Date): Promise<Result> => {
      if (!user) return { error: 'Not authenticated' };
      setClearing(true);
      try {
        const { error } = await supabase
          .from('meal_plan_entries')
          .delete()
          .eq('plan_id', planId);
        if (error) throw error;
        // Also purge planner-originated food_logs for this week (matches web).
        const dates = Array.from({ length: 7 }, (_, i) =>
          fmtLocalDate(addDays(weekStart, i)),
        );
        await supabase
          .from('food_logs')
          .delete()
          .eq('user_id', user.id)
          .eq('notes', 'From meal planner')
          .in('logged_date', dates);
        return { error: null };
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to clear week';
        console.error('[useMealPlanMutations.clearWeek]', message);
        return { error: message };
      } finally {
        setClearing(false);
      }
    },
    [user],
  );

  const replaceWeek = useCallback(
    async (
      planId: string,
      weekStart: Date,
      newEntries: Array<{
        day_of_week: number;
        meal_type: MealType;
        meal_name: string;
        ingredients: string | null;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
      }>,
    ): Promise<Result> => {
      if (!user) return { error: 'Not authenticated' };
      setClearing(true);
      try {
        // Wipe existing entries for this plan + any planner-tagged food_logs
        // for the week so the new plan starts fresh.
        const { error: delErr } = await supabase
          .from('meal_plan_entries')
          .delete()
          .eq('plan_id', planId);
        if (delErr) throw delErr;
        const dates = Array.from({ length: 7 }, (_, i) =>
          fmtLocalDate(addDays(weekStart, i)),
        );
        await supabase
          .from('food_logs')
          .delete()
          .eq('user_id', user.id)
          .eq('notes', 'From meal planner')
          .in('logged_date', dates);
        // Bulk insert the new rows.
        if (newEntries.length > 0) {
          const rows = newEntries.map((e) => ({
            plan_id: planId,
            day_of_week: e.day_of_week,
            meal_type: e.meal_type,
            meal_name: e.meal_name,
            ingredients: e.ingredients,
            calories: e.calories,
            protein: e.protein,
            carbs: e.carbs,
            fat: e.fat,
          }));
          const { error: insErr } = await supabase
            .from('meal_plan_entries')
            .insert(rows);
          if (insErr) throw insErr;
        }
        return { error: null };
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to replace week';
        console.error('[useMealPlanMutations.replaceWeek]', message);
        return { error: message };
      } finally {
        setClearing(false);
      }
    },
    [user],
  );

  return {
    saving,
    deletingId,
    clearing,
    getOrCreatePlanId,
    addOrReplace,
    deleteEntry,
    clearWeek,
    replaceWeek,
  };
}
