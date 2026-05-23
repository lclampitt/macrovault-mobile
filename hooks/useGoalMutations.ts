import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';

export type GoalSavePayload = {
  goal: 'Cutting' | 'Bulking' | 'Maintenance';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timeframe_weeks: number;
};

type Result = { error: string | null };

type State = {
  save: (payload: GoalSavePayload) => Promise<Result>;
  remove: () => Promise<Result>;
  saving: boolean;
  removing: boolean;
};

/**
 * Mutations for the user's `goals` singleton row. Uses the same
 * update-or-insert pattern proven on profiles/calculator-macro (avoids the
 * ON CONFLICT DO UPDATE class of bug we've hit twice now).
 */
export function useGoalMutations(onSuccess?: () => void): State {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const save = useCallback(
    async (payload: GoalSavePayload): Promise<Result> => {
      if (!user) return { error: 'Not authenticated' };
      setSaving(true);
      try {
        const { data: updated, error: updateError } = await supabase
          .from('goals')
          .update(payload)
          .eq('user_id', user.id)
          .select('id');
        if (updateError) throw updateError;
        if (!updated || updated.length === 0) {
          const { error: insertError } = await supabase
            .from('goals')
            .insert({ user_id: user.id, ...payload });
          if (insertError) throw insertError;
        }
        onSuccess?.();
        return { error: null };
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to save goal';
        console.error('[useGoalMutations.save]', message);
        return { error: message };
      } finally {
        setSaving(false);
      }
    },
    [user, onSuccess],
  );

  const remove = useCallback(async (): Promise<Result> => {
    if (!user) return { error: 'Not authenticated' };
    setRemoving(true);
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('user_id', user.id);
      if (error) throw error;
      onSuccess?.();
      return { error: null };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to delete goal';
      console.error('[useGoalMutations.remove]', message);
      return { error: message };
    } finally {
      setRemoving(false);
    }
  }, [user, onSuccess]);

  return { save, remove, saving, removing };
}
