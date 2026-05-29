import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';

type Result = { error: string | null };

type State = {
  remove: (id: string) => Promise<Result>;
  deletingId: string | null;
  error: string | null;
};

/**
 * Deletes a logged workout (`workouts` table) by id. Used by the recent
 * workouts swipe-to-delete row. RLS scopes the delete to the user too;
 * we also pin user_id defensively.
 */
export function useDeleteWorkout(onSuccess?: () => void): State {
  const { user } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(
    async (id: string): Promise<Result> => {
      if (!user) return { error: 'Not authenticated' };
      setDeletingId(id);
      setError(null);
      try {
        const { error: delErr } = await supabase
          .from('workouts')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
        if (delErr) throw delErr;
        onSuccess?.();
        return { error: null };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to delete workout';
        console.error('[useDeleteWorkout]', msg);
        setError(msg);
        return { error: msg };
      } finally {
        setDeletingId(null);
      }
    },
    [user, onSuccess],
  );

  return { remove, deletingId, error };
}
