import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { API_BASE } from '../lib/api';
import { useAuth } from '../lib/auth-context';

export type UsageSummary = {
  analyzerUsed: number;
  analyzerLimit: number | null; // null for Pro/Pro+
  workoutCount: number;
  workoutLimit: number | null;
  aiSuggestionsUsed: number;
  aiSuggestionsLimit: number;
  plan: 'free' | 'pro' | 'pro_plus' | string;
};

type State = {
  usage: UsageSummary | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

/**
 * Reads the FastAPI usage summary (GET /usage/:user_id). Used by Measurements
 * + any other screen that needs to show the free-tier counter. Refetches on
 * focus so the gauge stays fresh after a run.
 */
export function useAnalyzerUsage(): State {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/usage/${user.id}`);
      if (!res.ok) throw new Error(`Usage fetch failed (${res.status})`);
      const json = (await res.json()) as UsageSummary;
      setUsage(json);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load usage';
      console.error('[useAnalyzerUsage]', message);
      setError(message);
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

  return { usage, loading, error, refetch: fetchData };
}
