import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';

export type SaveInput = {
  date: string; // YYYY-MM-DD
  weight: number; // lbs (stored in progress.weight_kg — legacy column name)
  bodyFat: number | null;
};

type Result = { error: string | null };

type State = {
  save: (input: SaveInput) => Promise<Result>;
  remove: (id: string) => Promise<Result>;
  saving: boolean;
  deletingId: string | null;
  error: string | null;
};

export function useBodyCompositionMutations(onSuccess?: () => void): State {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(
    async (input: SaveInput): Promise<Result> => {
      if (!user) return { error: 'Not authenticated' };
      setSaving(true);
      setError(null);
      try {
        // Unique on (user_id, date); existing row for that date is overwritten.
        // Web uses onConflict: ['user_id','date']; supabase-js v2's documented
        // form is the comma-joined string — both target the same unique index.
        const { error: upsertError } = await supabase
          .from('progress')
          .upsert(
            {
              user_id: user.id,
              date: input.date,
              weight_kg: input.weight, // value is lbs, column name is legacy
              body_fat_pct: input.bodyFat,
            },
            { onConflict: 'user_id,date' },
          );
        if (upsertError) throw upsertError;
        onSuccess?.();
        return { error: null };
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to save entry';
        console.error('[useBodyCompositionMutations.save]', message);
        setError(message);
        return { error: message };
      } finally {
        setSaving(false);
      }
    },
    [user, onSuccess],
  );

  const remove = useCallback(
    async (id: string): Promise<Result> => {
      if (!user) return { error: 'Not authenticated' };
      setDeletingId(id);
      setError(null);
      try {
        const { error: deleteError } = await supabase
          .from('progress')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id); // defensive; RLS also enforces ownership
        if (deleteError) throw deleteError;
        onSuccess?.();
        return { error: null };
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to delete entry';
        console.error('[useBodyCompositionMutations.remove]', message);
        setError(message);
        return { error: message };
      } finally {
        setDeletingId(null);
      }
    },
    [user, onSuccess],
  );

  return { save, remove, saving, deletingId, error };
}
