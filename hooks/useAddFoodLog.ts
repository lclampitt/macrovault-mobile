import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { fmtLocalDate } from '../lib/date';

export type AddFoodLogInput = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealName: string;
};

type Result = { error: string | null };

type State = {
  add: (input: AddFoodLogInput) => Promise<Result>;
  submitting: boolean;
  error: string | null;
};

/**
 * Inserts a manual food_logs entry for today — mirrors web's handleAdd
 * (logged_date = today local, meal_name trimmed or null).
 */
export function useAddFoodLog(onSuccess?: () => void): State {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = useCallback(
    async (input: AddFoodLogInput): Promise<Result> => {
      if (!user) return { error: 'Not authenticated' };
      setSubmitting(true);
      setError(null);
      try {
        const { error: insertError } = await supabase.from('food_logs').insert({
          user_id: user.id,
          logged_date: fmtLocalDate(new Date()),
          meal_name: input.mealName.trim() || null,
          calories: input.calories,
          protein_g: input.protein,
          carbs_g: input.carbs,
          fat_g: input.fat,
        });
        if (insertError) throw insertError;
        onSuccess?.();
        return { error: null };
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to log entry';
        console.error('[useAddFoodLog]', message);
        setError(message);
        return { error: message };
      } finally {
        setSubmitting(false);
      }
    },
    [user, onSuccess],
  );

  return { add, submitting, error };
}
