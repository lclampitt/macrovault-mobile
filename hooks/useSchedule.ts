import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  addScheduleItem,
  loadSchedule,
  removeScheduleItem,
  sortSchedule,
  type ScheduleItem,
  type ScheduleKind,
} from '../lib/schedule-store';
import type { MealPeriod } from '../lib/meal-periods';

type AddInput = {
  time: string;
  period: MealPeriod;
  kind: ScheduleKind;
  title: string;
  notes?: string;
  macros?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
};

type State = {
  items: ScheduleItem[];
  loading: boolean;
  add: (input: AddInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
};

/**
 * Returns the user-defined schedule for a given local date (YYYY-MM-DD).
 * Backed by AsyncStorage today; swap the underlying calls to Supabase to
 * make it multi-device later.
 */
export function useSchedule(ymd: string | null): State {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!ymd) {
      setItems([]);
      setLoading(false);
      return;
    }
    const list = await loadSchedule(ymd);
    setItems(sortSchedule(list));
    setLoading(false);
  }, [ymd]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const add = useCallback(
    async (input: AddInput) => {
      if (!ymd) return;
      await addScheduleItem(ymd, input);
      await refetch();
    },
    [ymd, refetch],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!ymd) return;
      await removeScheduleItem(ymd, id);
      await refetch();
    },
    [ymd, refetch],
  );

  return { items, loading, add, remove, refetch };
}
