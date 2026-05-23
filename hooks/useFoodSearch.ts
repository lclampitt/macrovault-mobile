import { useEffect, useState } from 'react';
import { searchOpenFoodFacts, type OffProduct } from '../lib/foodFacts';

type State = {
  results: OffProduct[];
  loading: boolean;
  searched: boolean;
  error: string | null;
};

/**
 * Debounced (300ms) Open Food Facts search. Mirrors web's FoodSearch behavior:
 * empty query → empty results; cancels in-flight requests on rerun.
 */
export function useFoodSearch(query: string): State {
  const [results, setResults] = useState<OffProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const timer = setTimeout(async () => {
      try {
        const items = await searchOpenFoodFacts(q);
        if (cancelled) return;
        setResults(items);
        setSearched(true);
      } catch (e) {
        if (cancelled) return;
        const message = e instanceof Error ? e.message : 'Search failed';
        console.error('[useFoodSearch]', message);
        setError(message);
        setResults([]);
        setSearched(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return { results, loading, searched, error };
}
