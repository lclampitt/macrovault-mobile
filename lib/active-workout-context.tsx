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
};

export type ActiveExercise = {
  id: string;
  name: string;
  sets: ActiveSet[];
  note?: string;
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
  loadTemplate: (template: LoadedTemplate) => void;
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
  reorderExercises: (fromIndex: number, toIndex: number) => void;
  setNotes: (notes: string) => void;
  reset: () => void;
};

const ActiveWorkoutContext = createContext<ContextValue | null>(null);

export function ActiveWorkoutProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ActiveWorkoutState>(freshState);

  const start = useCallback(() => setState(freshState()), []);
  const reset = useCallback(() => setState(freshState()), []);

  const loadTemplate = useCallback((template: LoadedTemplate) => {
    const exercises: ActiveExercise[] = (template.exercises ?? []).map((ex) => {
      const sets: ActiveSet[] =
        Array.isArray(ex.sets) && ex.sets.length > 0
          ? ex.sets.map((s) => ({
              id: localId('set'),
              weight: s.weight != null ? String(s.weight) : '',
              reps: s.reps != null ? String(s.reps) : '',
              completed: false,
            }))
          : [blankSet()];
      return { id: localId('ex'), name: ex.name, sets };
    });
    setState({
      name: template.name,
      category: template.muscle_group || null,
      exercises,
      notes: '',
      startedAt: Date.now(),
      templateId: template.id,
      templateName: template.name,
    });
  }, []);

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
        exercises: s.exercises.map((e) =>
          e.id !== exerciseId
            ? e
            : {
                ...e,
                sets: e.sets.map((set) =>
                  set.id !== setId ? set : { ...set, [field]: value },
                ),
              },
        ),
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
