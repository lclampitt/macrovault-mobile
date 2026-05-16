import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';

// A template is shown as "Favorite" when use_count >= 5 (derived, NOT a
// column — matches WorkoutLogger.jsx mobile card render).
const FAVORITE_THRESHOLD = 5;

export type WorkoutTemplate = {
  id: string;
  name: string;
  exerciseCount: number;
  isFavorite: boolean;
  usageCount: number;
};

type State = {
  templates: WorkoutTemplate[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

type Row = {
  id: string;
  name: string | null;
  exercises: unknown;
  use_count: number | null;
};

export function useWorkoutTemplates(): State {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // Web: from('workout_templates').eq('user_id').order('use_count', desc)
      const { data, error: queryError } = await supabase
        .from('workout_templates')
        .select('id, name, exercises, use_count')
        .eq('user_id', user.id)
        .order('use_count', { ascending: false });
      if (queryError) throw queryError;

      const mapped: WorkoutTemplate[] = (data ?? []).map((raw) => {
        const r = raw as Row;
        const usageCount = r.use_count ?? 0;
        return {
          id: r.id,
          name: r.name || 'Untitled',
          exerciseCount: Array.isArray(r.exercises) ? r.exercises.length : 0,
          usageCount,
          isFavorite: usageCount >= FAVORITE_THRESHOLD,
        };
      });
      setTemplates(mapped);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load templates';
      console.error('[useWorkoutTemplates]', message);
      setError(message);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  return { templates, loading, error, refetch: fetchData };
}
