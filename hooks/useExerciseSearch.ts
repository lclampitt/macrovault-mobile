import { useMemo } from 'react';
import { EXERCISES, type Exercise } from '../lib/exercises';

export type ExerciseSection = {
  letter: string;
  items: Exercise[];
};

/**
 * Filters exercises.json by free-text query + category (matched against
 * `bodyPart`), then groups alphabetically by first letter of name.
 */
export function useExerciseSearch(
  query: string,
  category: string,
): ExerciseSection[] {
  return useMemo(() => {
    let filtered = EXERCISES;

    if (category && category !== 'All') {
      const c = category.toLowerCase();
      filtered = filtered.filter((e) => e.bodyPart.toLowerCase() === c);
    }

    const q = query.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((e) => e.name.toLowerCase().includes(q));
    }

    const grouped = new Map<string, Exercise[]>();
    for (const ex of filtered) {
      const letter = (ex.name[0] ?? '#').toUpperCase();
      const bucket = grouped.get(letter);
      if (bucket) bucket.push(ex);
      else grouped.set(letter, [ex]);
    }

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([letter, items]) => ({
        letter,
        items: items.sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [query, category]);
}
