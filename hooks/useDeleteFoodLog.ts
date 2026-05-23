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
 * Deletes a food_logs row by id — mirrors web's handleDelete.
 */
export function useDeleteFoodLog(onSuccess?: () => void): State {
  const { user } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(
    async (id: string): Promise<Result> => {
      if (!user) return { error: 'Not authenticated' };
      setDeletingId(id);
      setError(null);
      try {
        const { error: deleteError } = await supabase
          .from('food_logs')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id); // defensive; RLS also enforces ownership
        if (deleteError) throw deleteError;
        onSuccess?.();
        return { error: null };
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to remove entry';
        console.error('[useDeleteFoodLog]', message);
        setError(message);
        return { error: message };
      } finally {
        setDeletingId(null);
      }
    },
    [user, onSuccess],
  );

  return { remove, deletingId, error };
}
