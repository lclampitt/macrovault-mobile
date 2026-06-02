import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import type { WeightUnit } from './useActiveGoal';

export type GoalType = 'Cutting' | 'Bulking' | 'Maintenance';

export type GoalSavePayload = {
  goal: GoalType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timeframe_weeks: number;
  start_date?: string | null;
  target_date?: string | null;
  calorie_delta?: number | null;
  start_weight_value?: number | null;
  start_weight_unit?: WeightUnit | null;
  target_weight_value?: number | null;
  target_weight_unit?: WeightUnit | null;
};

type Result = { error: string | null };

type State = {
  /**
   * Update-or-insert the user's active goal. If the user is changing the
   * goal *type* (Cutting → Bulking, etc.) the existing active row is
   * archived first so we keep a paper trail in history.
   */
  save: (payload: GoalSavePayload) => Promise<Result>;
  remove: () => Promise<Result>;
  saving: boolean;
  removing: boolean;
};

/**
 * Mutations for the user's active `goals` row. Uses update-or-insert to
 * avoid the ON CONFLICT DO UPDATE class of bug.
 *
 * When the goal *type* changes (e.g. Cutting → Bulking), the existing
 * active row is archived (is_active=false, archived_at=now,
 * archive_reason='type-change') and a fresh row is inserted with today's
 * start_date so the timeline restarts cleanly.
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
        // Look up the current active goal (if any) so we can detect a
        // type change and decide between update vs archive+insert.
        const { data: existingRows, error: fetchErr } = await supabase
          .from('goals')
          .select('id, goal')
          .eq('user_id', user.id)
          .or('is_active.is.null,is_active.eq.true')
          .order('created_at', { ascending: false })
          .limit(1);
        if (fetchErr) throw fetchErr;
        const existing = existingRows?.[0];

        const typeChanged =
          existing && existing.goal && existing.goal !== payload.goal;

        if (existing && !typeChanged) {
          // Same goal type — update the existing row in place.
          const { error: updErr } = await supabase
            .from('goals')
            .update({
              ...payload,
              is_active: true,
            })
            .eq('id', existing.id);
          if (updErr) throw updErr;
        } else {
          // Either no existing row, or the type changed. Archive the
          // existing one first (if any), then insert a fresh row.
          if (existing) {
            const { error: archErr } = await supabase
              .from('goals')
              .update({
                is_active: false,
                archived_at: new Date().toISOString(),
                archive_reason: 'type-change',
              })
              .eq('id', existing.id);
            if (archErr) throw archErr;
          }
          const { error: insertError } = await supabase
            .from('goals')
            .insert({
              user_id: user.id,
              ...payload,
              is_active: true,
            });
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
      // Soft-archive rather than hard delete so the user can see goal
      // history later. The active-goal query filters on is_active so this
      // is effectively a delete from the user's perspective.
      const { error } = await supabase
        .from('goals')
        .update({
          is_active: false,
          archived_at: new Date().toISOString(),
          archive_reason: 'manual',
        })
        .eq('user_id', user.id)
        .or('is_active.is.null,is_active.eq.true');
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
