import exercisesJson from './exercises.json';

export type Exercise = {
  id: string;
  name: string;
  bodyPart: string; // category-equivalent: arms/back/cardio/chest/core/full body/legs/shoulders
  targetMuscle: string;
  secondaryMuscles: string[];
  equipment: string;
  difficulty: string;
  instructions: string[];
  formCues?: string[];
  commonMistakes?: string[];
  setsRepsGuidance?: {
    cutting?: string;
    bulking?: string;
    maintenance?: string;
  };
};

export function findExerciseById(id: string): Exercise | null {
  return EXERCISES.find((e) => e.id === id) ?? null;
}

export const EXERCISES = exercisesJson as unknown as Exercise[];

/** Distinct categories from the data, Title-cased, with "All" first. */
export const EXERCISE_CATEGORIES: string[] = [
  'All',
  ...Array.from(new Set(EXERCISES.map((e) => e.bodyPart)))
    .sort()
    .map((c) => c.replace(/\b\w/g, (m) => m.toUpperCase())),
];

export function titleCase(s: string): string {
  return s.replace(/\b\w/g, (m) => m.toUpperCase());
}
