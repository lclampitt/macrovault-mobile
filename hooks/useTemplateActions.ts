import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import type { LoadedTemplate } from '../lib/active-workout-context';
import type { ActiveExercise } from '../lib/active-workout-context';

type Result<T> = { data: T | null; error: string | null };

/** Map active exercises → template `exercises` JSON (web shape). */
function toTemplateExercises(exercises: ActiveExercise[]) {
  return exercises.map((ex) => ({
    name: ex.name,
    sets: ex.sets.map((s, idx) => ({
      set_number: idx + 1,
      weight: s.weight || '',
      reps: s.reps || '',
    })),
  }));
}

export function useTemplateActions() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  /** Fetch a full template row to load into the active workout. */
  const fetchTemplate = useCallback(
    async (id: string): Promise<Result<LoadedTemplate>> => {
      if (!user) return { data: null, error: 'Not authenticated' };
      try {
        const { data, error } = await supabase
          .from('workout_templates')
          .select('id, name, muscle_group, exercises')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
        if (error) throw error;
        return { data: data as LoadedTemplate, error: null };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load template';
        console.error('[useTemplateActions.fetch]', msg);
        return { data: null, error: msg };
      }
    },
    [user],
  );

  const readUseCount = useCallback(
    async (templateId: string): Promise<number> => {
      const { data } = await supabase
        .from('workout_templates')
        .select('use_count')
        .eq('id', templateId)
        .maybeSingle();
      return (data?.use_count as number) ?? 0;
    },
    [],
  );

  /** Overwrite an existing template's exercises (+ bump use_count). */
  const updateTemplate = useCallback(
    async (
      templateId: string,
      exercises: ActiveExercise[],
    ): Promise<Result<true>> => {
      if (!user) return { data: null, error: 'Not authenticated' };
      setBusy(true);
      try {
        const currentUseCount = await readUseCount(templateId);
        const { error } = await supabase
          .from('workout_templates')
          .update({
            exercises: toTemplateExercises(exercises),
            use_count: currentUseCount + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', templateId)
          .eq('user_id', user.id);
        if (error) throw error;
        return { data: true, error: null };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to update template';
        console.error('[useTemplateActions.update]', msg);
        return { data: null, error: msg };
      } finally {
        setBusy(false);
      }
    },
    [user],
  );

  /** Insert a brand-new template from the finished workout. */
  const createTemplate = useCallback(
    async (
      name: string,
      muscleGroup: string | null,
      exercises: ActiveExercise[],
    ): Promise<Result<true>> => {
      if (!user) return { data: null, error: 'Not authenticated' };
      setBusy(true);
      try {
        const { error } = await supabase.from('workout_templates').insert({
          user_id: user.id,
          name: name.trim() || 'Untitled Template',
          muscle_group: muscleGroup || '',
          exercises: toTemplateExercises(exercises),
        });
        if (error) throw error;
        return { data: true, error: null };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to save template';
        console.error('[useTemplateActions.create]', msg);
        return { data: null, error: msg };
      } finally {
        setBusy(false);
      }
    },
    [user, readUseCount],
  );

  /** Bump use_count only (template otherwise untouched — "keep original"). */
  const incrementUseCount = useCallback(
    async (templateId: string): Promise<Result<true>> => {
      if (!user) return { data: null, error: 'Not authenticated' };
      try {
        const currentUseCount = await readUseCount(templateId);
        const { error } = await supabase
          .from('workout_templates')
          .update({
            use_count: currentUseCount + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', templateId)
          .eq('user_id', user.id);
        if (error) throw error;
        return { data: true, error: null };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to update template';
        console.error('[useTemplateActions.useCount]', msg);
        return { data: null, error: msg };
      }
    },
    [user, readUseCount],
  );

  return { fetchTemplate, updateTemplate, createTemplate, incrementUseCount, busy };
}
