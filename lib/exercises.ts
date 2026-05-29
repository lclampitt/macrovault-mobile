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

// --------------------------------------------------------------------------
// Name → body part lookup (used by Activity's muscle split)
//
// Workouts store exercises as { name, sets }. To bucket logged exercises into
// muscle groups we normalize the name (lowercase, trim, strip punctuation)
// and look it up against the static catalog. Custom exercises that aren't in
// the catalog fall back to "Other" so the chart still shows them.
// --------------------------------------------------------------------------

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Display-cased body parts. Keys are catalog names ("chest", "back", …). */
export const BODY_PART_LABELS: Record<string, string> = {
  chest: 'Chest',
  back: 'Back',
  legs: 'Legs',
  shoulders: 'Shoulders',
  arms: 'Arms',
  core: 'Core',
  cardio: 'Cardio',
  'full body': 'Full body',
  other: 'Other',
};

const NAME_TO_BODY_PART: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const e of EXERCISES) {
    const key = normalizeName(e.name);
    if (key) map[key] = e.bodyPart;
  }
  return map;
})();

/** Returns the catalog body part for a given exercise name, or "other". */
export function bodyPartForExerciseName(name: string): string {
  if (!name) return 'other';
  const key = normalizeName(name);
  const exact = NAME_TO_BODY_PART[key];
  if (exact) return exact;
  // Loose contains-fallback: catches "Barbell Bench Press" → "bench press".
  for (const [catalogKey, part] of Object.entries(NAME_TO_BODY_PART)) {
    if (key.includes(catalogKey)) return part;
  }
  return 'other';
}

/** Stable ordering for the muscle-split chart. */
export const BODY_PART_ORDER: string[] = [
  'chest',
  'back',
  'legs',
  'shoulders',
  'arms',
  'core',
  'cardio',
  'full body',
  'other',
];
