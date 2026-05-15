import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { fmtLocalDate } from '../lib/date';

export type TodayMacros = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type State = {
  data: TodayMacros;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

const EMPTY: TodayMacros = { calories: 0, protein: 0, carbs: 0, fat: 0 };

type Row = {
  calories: number | null;
  protein_g: number | string | null;
  carbs_g: number | string | null;
  fat_g: number | string | null;
};

function toNumber(v: number | string | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === 'string' ? Number(v) : v;
  return Number.isFinite(n) ? n : 0;
}

/**
 * Sums today's food_logs rows for the signed-in user.
 * "Today" is the local-time calendar day, matching the web app.
 */
export function useTodayMacros(): State {
  const { user } = useAuth();
  const [data, setData] = useState<TodayMacros>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const today = fmtLocalDate(new Date());
      const { data: rows, error: queryError } = await supabase
        .from('food_logs')
        .select('calories, protein_g, carbs_g, fat_g')
        .eq('user_id', user.id)
        .eq('logged_date', today);
      if (queryError) throw queryError;

      const totals: TodayMacros = (rows ?? []).reduce(
        (acc, raw) => {
          const r = raw as Row;
          acc.calories += toNumber(r.calories);
          acc.protein += toNumber(r.protein_g);
          acc.carbs += toNumber(r.carbs_g);
          acc.fat += toNumber(r.fat_g);
          return acc;
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      );

      setData({
        calories: Math.round(totals.calories),
        protein: Math.round(totals.protein),
        carbs: Math.round(totals.carbs),
        fat: Math.round(totals.fat),
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load macros';
      console.error('[useTodayMacros]', message);
      setError(message);
      setData(EMPTY);
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

  return { data, loading, error, refetch: fetchData };
}
