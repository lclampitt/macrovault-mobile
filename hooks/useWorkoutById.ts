import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';

export type WorkoutSet = {
  weight: string;
  reps: string;
  notes?: string | null;
};

export type WorkoutExercise = {
  name: string;
  sets: WorkoutSet[];
};

export type WorkoutDetail = {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  notes: string | null;
  exercises: WorkoutExercise[];
};

type State = {
  data: WorkoutDetail | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

type Row = {
  id: string;
  workout_name: string | null;
  workout_date: string | null;
  notes?: string | null;
  exercises: unknown;
};

function normalizeSets(rawSets: unknown): WorkoutSet[] {
  if (!Array.isArray(rawSets)) return [];
  return rawSets
    .map((raw) => {
      const s = raw as Record<string, unknown>;
      const weight =
        s.weight != null && s.weight !== '' ? String(s.weight) : '';
      const reps = s.reps != null && s.reps !== '' ? String(s.reps) : '';
      const notes = typeof s.notes === 'string' ? s.notes : null;
      return { weight, reps, notes };
    })
    .filter((s) => s.weight !== '' || s.reps !== '' || s.notes);
}

function normalizeExercises(raw: unknown): WorkoutExercise[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const ex = item as Record<string, unknown>;
    return {
      name: typeof ex.name === 'string' ? ex.name : 'Exercise',
      sets: normalizeSets(ex.sets),
    };
  });
}

export function useWorkoutById(id: string | null | undefined): State {
  const { user } = useAuth();
  const [data, setData] = useState<WorkoutDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user || !id) {
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { data: row, error: queryError } = await supabase
        .from('workouts')
        .select('id, workout_name, workout_date, notes, exercises')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
      if (queryError) throw queryError;
      const r = row as Row;
      setData({
        id: r.id,
        name: r.workout_name || 'Workout',
        date: r.workout_date ?? '',
        notes: typeof r.notes === 'string' ? r.notes : null,
        exercises: normalizeExercises(r.exercises),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load workout';
      console.error('[useWorkoutById]', msg);
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user, id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
