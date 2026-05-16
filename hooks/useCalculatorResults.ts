import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  loadMacroResult,
  loadOneRmResult,
  type StoredMacroResult,
  type StoredOneRmResult,
} from '../lib/calculatorStorage';

type State = {
  macro: StoredMacroResult | null;
  oneRm: StoredOneRmResult | null;
  loading: boolean;
  refetch: () => Promise<void>;
};

/**
 * Reads the last persisted calculator results (AsyncStorage). Refetches on
 * focus so the landing "Last Results" panel updates after the user runs a
 * calculator and navigates back.
 */
export function useCalculatorResults(): State {
  const [macro, setMacro] = useState<StoredMacroResult | null>(null);
  const [oneRm, setOneRm] = useState<StoredOneRmResult | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const [m, o] = await Promise.all([loadMacroResult(), loadOneRmResult()]);
    setMacro(m);
    setOneRm(o);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  return { macro, oneRm, loading, refetch };
}
