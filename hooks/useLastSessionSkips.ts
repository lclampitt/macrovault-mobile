import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';

type StoredExercise = {
  name?: unknown;
  skipped?: unknown;
};

/**
 * Returns the set of exercise names that the user's most recent *prior*
 * workout from a given template marked as skipped. Used to seed the
 * inline "Last: skipped" tan hint on the next session.
 *
 * "Most recent" means: highest workout_date with a non-null template_id
 * match. We don't need to deduplicate — only the latest counts per spec
 * ("If the user skipped Bench Press on Monday, did Bench Press normally
 *  on Wednesday, the hint should NOT show on Friday").
 */
export function useLastSessionSkips() {
  const { user } = useAuth();

  const fetchSkips = useCallback(
    async (templateName: string): Promise<Set<string>> => {
      if (!user || !templateName) return new Set();
      try {
        // We key by workout_name because the legacy `workouts` rows don't
        // store a template_id. workout_name preserves the template the user
        // started from on Finish (when they Keep / Update / Save-new). If a
        // future migration adds template_id, prefer matching on that.
        const { data, error } = await supabase
          .from('workouts')
          .select('workout_date, exercises')
          .eq('user_id', user.id)
          .eq('workout_name', templateName)
          .order('workout_date', { ascending: false })
          .limit(1);
        if (error) {
          console.warn('[useLastSessionSkips]', error.message);
          return new Set();
        }
        const row = data?.[0];
        if (!row) return new Set();
        const exs = Array.isArray(row.exercises)
          ? (row.exercises as StoredExercise[])
          : [];
        const skipped = new Set<string>();
        for (const ex of exs) {
          if (ex?.skipped === true && typeof ex.name === 'string') {
            skipped.add(ex.name);
          }
        }
        return skipped;
      } catch (e) {
        console.error('[useLastSessionSkips]', e);
        return new Set();
      }
    },
    [user],
  );

  return { fetchSkips };
}
