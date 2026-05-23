import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';

export const FREE_WORKOUT_LIMIT = 7;

export type Plan = 'free' | 'pro' | 'pro_plus';

type State = {
  plan: Plan;
  isPro: boolean; // pro OR pro_plus
  isProPlus: boolean; // pro_plus only (AI features)
  workoutCount: number;
  atFreeLimit: boolean; // free tier AND workoutCount >= limit
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

/**
 * Reads the user's subscription tier (SELECT on profiles is allowed by the
 * lockdown migration — writes are backend/Stripe-only) and counts their
 * logged workouts. Used for the interim client-side soft gate: free users
 * can log up to FREE_WORKOUT_LIMIT workouts.
 */
export function useSubscription(): State {
  const { user } = useAuth();
  const [plan, setPlan] = useState<Plan>('free');
  const [workoutCount, setWorkoutCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const [{ data: profile, error: pErr }, { count, error: wErr }] =
        await Promise.all([
          supabase
            .from('profiles')
            .select('subscription_tier')
            .eq('id', user.id)
            .maybeSingle(),
          supabase
            .from('workouts')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
        ]);
      if (pErr) throw pErr;
      if (wErr) throw wErr;

      const tier = (profile?.subscription_tier as string) || 'free';
      setPlan(
        tier === 'pro' || tier === 'pro_plus' ? (tier as Plan) : 'free',
      );
      setWorkoutCount(count ?? 0);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load plan';
      console.error('[useSubscription]', message);
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

  const isPro = plan === 'pro' || plan === 'pro_plus';
  const isProPlus = plan === 'pro_plus';
  const atFreeLimit = !isPro && workoutCount >= FREE_WORKOUT_LIMIT;

  return {
    plan,
    isPro,
    isProPlus,
    workoutCount,
    atFreeLimit,
    loading,
    error,
    refetch: fetchData,
  };
}
