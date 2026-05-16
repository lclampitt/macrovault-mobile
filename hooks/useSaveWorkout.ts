import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { fmtLocalDate } from '../lib/date';
import { FREE_WORKOUT_LIMIT } from './useSubscription';
import type { ActiveWorkoutState } from '../lib/active-workout-context';

type Result = { error: string | null };

/**
 * Inserts a workout into the `workouts` table. Columns confirmed against
 * WorkoutLogger.jsx saveWorkout + migrations:
 *   user_id, workout_date, workout_name, muscle_group, exercises, notes
 * There is NO `category` or `duration_seconds` column — category pill maps
 * to `muscle_group`; duration is not persisted (web doesn't persist it).
 * Web routes new workouts through a backend free-tier gate; mobile inserts
 * directly to Supabase per the phase brief.
 */
export function useSaveWorkout() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(
    async (state: ActiveWorkoutState): Promise<Result> => {
      if (!user) return { error: 'Not authenticated' };
      setSaving(true);
      setError(null);
      try {
        // Free-tier soft gate backstop (interim, client-side). The
        // tamper-proof server gate is a future Stripe/backend phase.
        const [{ data: profile }, { count }] = await Promise.all([
          supabase
            .from('profiles')
            .select('subscription_tier')
            .eq('id', user.id)
            .maybeSingle(),
          supabase
            .from('workouts')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
        ]);
        const tier = (profile?.subscription_tier as string) || 'free';
        const isPro = tier === 'pro' || tier === 'pro_plus';
        if (!isPro && (count ?? 0) >= FREE_WORKOUT_LIMIT) {
          const msg = `Free plan limit reached — upgrade to Pro to log more than ${FREE_WORKOUT_LIMIT} workouts.`;
          setError(msg);
          return { error: msg };
        }

        const exercises = state.exercises.map((ex) => ({
          name: ex.name,
          sets: ex.sets
            .filter((s) => s.weight.trim() !== '' || s.reps.trim() !== '')
            .map((s) => ({
              weight: s.weight.trim(),
              reps: s.reps.trim(),
              notes: '',
            })),
        }));

        const base = {
          user_id: user.id,
          workout_date: fmtLocalDate(new Date()),
          workout_name: state.name.trim() || 'Untitled Workout',
          muscle_group: state.category || null,
          exercises,
        };
        const notes = state.notes.trim() || null;

        // Try with `notes` (column added by supabase_workout_notes_migration).
        // If that migration was never applied, PostgREST rejects the unknown
        // column — retry with only the columns the web definitely writes so
        // Finish never breaks.
        let { error: insertError } = await supabase
          .from('workouts')
          .insert({ ...base, notes });

        if (insertError) {
          const msg = `${insertError.message ?? ''} ${
            (insertError as { code?: string }).code ?? ''
          }`.toLowerCase();
          const isUnknownNotesColumn =
            msg.includes('notes') &&
            (msg.includes('column') ||
              msg.includes('schema cache') ||
              msg.includes('pgrst204') ||
              msg.includes('42703'));
          if (isUnknownNotesColumn) {
            ({ error: insertError } = await supabase
              .from('workouts')
              .insert(base));
          }
        }
        if (insertError) throw insertError;
        return { error: null };
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to save workout';
        console.error('[useSaveWorkout]', message);
        setError(message);
        return { error: message };
      } finally {
        setSaving(false);
      }
    },
    [user],
  );

  return { save, saving, error };
}
