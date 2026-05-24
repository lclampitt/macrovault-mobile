import { useCallback, useState } from 'react';
import { API_BASE } from '../lib/api';
import { useAuth } from '../lib/auth-context';

export type AnalyzerInput = {
  gender: 'male' | 'female';
  age: number;
  heightFt: number;
  heightIn: number;
  weightLbs: number;
  waistIn: number;
  hipIn: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'extra';
  goal:
    | 'aggressive_cut'
    | 'cut'
    | 'maintain'
    | 'bulk'
    | 'aggressive_bulk';
};

export type AnalyzerResult = {
  bodyfat: number;
  category: string;
  goal_suggestion: string;
  suggested_calories: number;
  notes: string[];
  bmr: number | null;
  tdee: number | null;
  deficit_or_surplus: number | null;
  formula: 'katch' | 'mifflin' | null;
};

type Outcome =
  | { result: AnalyzerResult; error: null; limitReached: false }
  | { result: null; error: string; limitReached: boolean };

type State = {
  loading: boolean;
  analyze: (input: AnalyzerInput) => Promise<Outcome>;
};

function decodeError(text: string, status: number): {
  message: string;
  limitReached: boolean;
} {
  try {
    const json = JSON.parse(text);
    if (json?.detail?.error === 'limit_reached') {
      return {
        message:
          'Monthly analyzer limit reached. Free tier includes 3 runs per month — upgrade to Pro for unlimited.',
        limitReached: true,
      };
    }
    if (typeof json?.detail === 'string') {
      return { message: json.detail, limitReached: false };
    }
  } catch {
    /* not JSON */
  }
  if (status === 403)
    return { message: 'This feature requires a Pro subscription.', limitReached: true };
  if (status === 429)
    return { message: 'Rate limited — try again in a moment.', limitReached: false };
  return { message: `Analyzer error (${status}).`, limitReached: false };
}

/**
 * POSTs to /analyze-measurements on the FastAPI backend. The backend gates the
 * analyzer at 3 runs/month for free users; surface that to the UI so it can
 * show the upgrade pitch instead of a generic error.
 */
export function useMeasurementsAnalyzer(): State {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const analyze = useCallback<State['analyze']>(
    async (input) => {
      if (!user) {
        return {
          result: null,
          error: 'Not authenticated',
          limitReached: false,
        };
      }
      setLoading(true);
      try {
        // Imperial → metric, gender → 0/1, matching the web's payload.
        const totalInches = input.heightFt * 12 + input.heightIn;
        const payload = {
          gender: input.gender === 'male' ? 0 : 1,
          age: input.age,
          height_cm: totalInches * 2.54,
          weight_kg: input.weightLbs * 0.453592,
          waist_cm: input.waistIn * 2.54,
          hip_cm: input.hipIn * 2.54,
          activity_level: input.activityLevel,
          goal: input.goal,
          user_id: user.id,
        };
        const res = await fetch(`${API_BASE}/analyze-measurements`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = await res.text();
          const { message, limitReached } = decodeError(body, res.status);
          return { result: null, error: message, limitReached };
        }
        const data = (await res.json()) as AnalyzerResult;
        return { result: data, error: null, limitReached: false };
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Network error';
        console.error('[useMeasurementsAnalyzer]', message);
        return { result: null, error: message, limitReached: false };
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  return { loading, analyze };
}
