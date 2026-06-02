import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

let idCounter = 0;
function localId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

export type ActiveSet = {
  id: string;
  weight: string;
  reps: string;
  completed: boolean;
  /** Optional reference values from the prior session or template load.
   *  Used to render the "Last" column in the active workout. */
  prevWeight?: string;
  prevReps?: string;
};

export type ActiveExercise = {
  id: string;
  name: string;
  sets: ActiveSet[];
  note?: string;
  /**
   * Per-session "skipped" state. Set true when the user taps Skip from the
   * kebab. Skipped exercises stay in the session (and the template); they
   * just don't count toward completion + show a dimmed state. Cleared by
   * tapping the card to resume.
   */
  skipped?: boolean;
  /** ISO timestamp of when the user tapped Skip — used to surface the
   *  "Last: skipped" hint on the next session of this template. */
  skippedAt?: string;
  /** Transient flag (not persisted) set when the previous session of this
   *  template skipped the same exercise. Drives the inline tan hint. */
  skippedLastTime?: boolean;
};

export type ActiveWorkoutState = {
  name: string;
  category: string | null;
  exercises: ActiveExercise[];
  notes: string;
  startedAt: number;
  // Set when the workout was started from a saved template.
  templateId: string | null;
  templateName: string | null;
};

/** Shape of a template row loaded from `workout_templates`. */
export type LoadedTemplate = {
  id: string;
  name: string;
  muscle_group: string | null;
  exercises: { name: string; sets?: { weight?: unknown; reps?: unknown }[] }[];
};

function freshState(): ActiveWorkoutState {
  return {
    name: '',
    category: null,
    exercises: [],
    notes: '',
    startedAt: Date.now(),
    templateId: null,
    templateName: null,
  };
}

function blankSet(): ActiveSet {
  return { id: localId('set'), weight: '', reps: '', completed: false };
}

type SetField = 'weight' | 'reps' | 'completed';

type ContextValue = {
  state: ActiveWorkoutState;
  start: () => void;
  loadTemplate: (
    template: LoadedTemplate,
    skippedLastTimeNames?: ReadonlySet<string>,
  ) => void;
  setName: (name: string) => void;
  setCategory: (category: string | null) => void;
  addExercise: (name: string) => void;
  removeExercise: (exerciseId: string) => void;
  addSet: (exerciseId: string) => void;
  updateSet: (
    exerciseId: string,
    setId: string,
    field: SetField,
    value: string | boolean,
  ) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  setExerciseNote: (exerciseId: string, note: string) => void;
  /** Toggle the per-session skipped flag for an exercise. Idempotent. */
  setExerciseSkipped: (exerciseId: string, skipped: boolean) => void;
  reorderExercises: (fromIndex: number, toIndex: number) => void;
  setNotes: (notes: string) => void;
  reset: () => void;
};

const ActiveWorkoutContext = createContext<ContextValue | null>(null);

export function ActiveWorkoutProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ActiveWorkoutState>(freshState);

  const start = useCallback(() => setState(freshState()), []);
  const reset = useCallback(() => setState(freshState()), []);

  const loadTemplate = useCallback(
    (
      template: LoadedTemplate,
      /**
       * Optional set of exercise names that the most recent prior session
       * of this template marked as skipped. Drives the inline "Last:
       * skipped" hint shown next to the exercise name on the new session.
       */
      skippedLastTimeNames?: ReadonlySet<string>,
    ) => {
      const exercises: ActiveExercise[] = (template.exercises ?? []).map(
        (ex) => {
          const sets: ActiveSet[] =
            Array.isArray(ex.sets) && ex.sets.length > 0
              ? ex.sets.map((s) => {
                  const w = s.weight != null ? String(s.weight) : '';
                  const r = s.reps != null ? String(s.reps) : '';
                  // Pre-fill weight/reps AND remember them as the "previous"
                  // reference so the Last column renders e.g. "135×12" on
                  // next load. Tapping that ref re-fills the inputs if the
                  // user clears them.
                  return {
                    id: localId('set'),
                    weight: w,
                    reps: r,
                    completed: false,
                    prevWeight: w || undefined,
                    prevReps: r || undefined,
                  };
                })
              : [blankSet()];
          return {
            id: localId('ex'),
            name: ex.name,
            sets,
            skippedLastTime: skippedLastTimeNames?.has(ex.name) ?? false,
          };
        },
      );
      setState({
        name: template.name,
        category: template.muscle_group || null,
        exercises,
        notes: '',
        startedAt: Date.now(),
        templateId: template.id,
        templateName: template.name,
      });
    },
    [],
  );

  const setName = useCallback(
    (name: string) => setState((s) => ({ ...s, name })),
    [],
  );
  const setCategory = useCallback(
    (category: string | null) => setState((s) => ({ ...s, category })),
    [],
  );
  const setNotes = useCallback(
    (notes: string) => setState((s) => ({ ...s, notes })),
    [],
  );

  const addExercise = useCallback((name: string) => {
    setState((s) => ({
      ...s,
      exercises: [
        ...s.exercises,
        { id: localId('ex'), name, sets: [blankSet()] },
      ],
    }));
  }, []);

  const removeExercise = useCallback((exerciseId: string) => {
    setState((s) => ({
      ...s,
      exercises: s.exercises.filter((e) => e.id !== exerciseId),
    }));
  }, []);

  const addSet = useCallback((exerciseId: string) => {
    setState((s) => ({
      ...s,
      exercises: s.exercises.map((e) =>
        e.id === exerciseId ? { ...e, sets: [...e.sets, blankSet()] } : e,
      ),
    }));
  }, []);

  const updateSet = useCallback(
    (
      exerciseId: string,
      setId: string,
      field: SetField,
      value: string | boolean,
    ) => {
      setState((s) => ({
        ...s,
        exercises: s.exercises.map((e) => {
          if (e.id !== exerciseId) return e;
          // Marking a set complete is the user's "I'm doing this exercise
          // today" signal — clear the `Last: skipped` hint permanently for
          // the rest of the session, even if the set is later un-completed.
          // Spec: "The hint does NOT reappear during the session even if
          // the user un-logs all their completed sets."
          const clearHint = field === 'completed' && value === true;
          return {
            ...e,
            sets: e.sets.map((set) =>
              set.id !== setId ? set : { ...set, [field]: value },
            ),
            skippedLastTime: clearHint ? false : e.skippedLastTime,
          };
        }),
      }));
    },
    [],
  );

  const removeSet = useCallback((exerciseId: string, setId: string) => {
    setState((s) => ({
      ...s,
      exercises: s.exercises.map((e) =>
        e.id !== exerciseId
          ? e
          : { ...e, sets: e.sets.filter((set) => set.id !== setId) },
      ),
    }));
  }, []);

  const setExerciseNote = useCallback((exerciseId: string, note: string) => {
    setState((s) => ({
      ...s,
      exercises: s.exercises.map((e) =>
        e.id === exerciseId ? { ...e, note } : e,
      ),
    }));
  }, []);

  const setExerciseSkipped = useCallback(
    (exerciseId: string, skipped: boolean) => {
      setState((s) => ({
        ...s,
        exercises: s.exercises.map((e) =>
          e.id === exerciseId
            ? {
                ...e,
                skipped,
                skippedAt: skipped ? new Date().toISOString() : undefined,
                // Tapping skip OR resume clears the "Last: skipped" hint —
                // either the user is acting on it, or they're explicitly
                // re-skipping (in which case the SKIPPED badge takes over).
                skippedLastTime: false,
              }
            : e,
        ),
      }));
    },
    [],
  );

  const reorderExercises = useCallback(
    (fromIndex: number, toIndex: number) => {
      setState((s) => {
        if (
          fromIndex === toIndex ||
          fromIndex < 0 ||
          toIndex < 0 ||
          fromIndex >= s.exercises.length ||
          toIndex >= s.exercises.length
        ) {
          return s;
        }
        const next = s.exercises.slice();
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return { ...s, exercises: next };
      });
    },
    [],
  );

  const value = useMemo<ContextValue>(
    () => ({
      state,
      start,
      loadTemplate,
      setName,
      setCategory,
      addExercise,
      removeExercise,
      addSet,
      updateSet,
      removeSet,
      setExerciseNote,
      setExerciseSkipped,
      reorderExercises,
      setNotes,
      reset,
    }),
    [
      state,
      start,
      loadTemplate,
      setName,
      setCategory,
      addExercise,
      removeExercise,
      addSet,
      updateSet,
      removeSet,
      setExerciseNote,
      setExerciseSkipped,
      reorderExercises,
      setNotes,
      reset,
    ],
  );

  return (
    <ActiveWorkoutContext.Provider value={value}>
      {children}
    </ActiveWorkoutContext.Provider>
  );
}

export function useActiveWorkout(): ContextValue {
  const ctx = useContext(ActiveWorkoutContext);
  if (!ctx) {
    throw new Error('useActiveWorkout must be used within ActiveWorkoutProvider');
  }
  return ctx;
}
