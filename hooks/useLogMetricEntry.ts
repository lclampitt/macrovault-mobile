import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { fmtLocalDate } from '../lib/date';
import { type Metric } from '../lib/metrics-catalog';

type Input = {
  metric: Metric;
  value: number;
  loggedAt?: Date;
  notes?: string;
};

type Result = { error: string | null };

/**
 * Writes a single metric entry. Routes to the right backing table per
 * metric.storage hint:
 *
 *   Weight    → progress.weight_kg upsert by (user_id, date)
 *               + mirror into body_metric_entries
 *   Body Fat  → progress.body_fat_pct upsert + mirror
 *   Others    → body_metric_entries insert
 *
 * The mirror keeps a single read path consistent for the upcoming Stats /
 * future graph layers, while letting the legacy web app keep functioning.
 */
export function useLogMetricEntry(onSuccess?: () => void) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const log = useCallback(
    async (input: Input): Promise<Result> => {
      if (!user) return { error: 'Not authenticated' };
      const { metric } = input;
      // Client-side bounds check — server has matching constraint.
      if (
        input.value < metric.bounds.min ||
        input.value > metric.bounds.max
      ) {
        const msg = `Value out of range (${metric.bounds.min}–${metric.bounds.max} ${metric.unit}).`;
        setError(msg);
        return { error: msg };
      }
      setSubmitting(true);
      setError(null);
      try {
        const at = input.loggedAt ?? new Date();
        const ymd = fmtLocalDate(at);
        const notes = input.notes?.trim() || null;

        if (metric.storage === 'progress.weight_kg') {
          const kg = input.value / 2.2046226218;
          const { error: upsertErr } = await supabase
            .from('progress')
            .upsert(
              { user_id: user.id, date: ymd, weight_kg: kg },
              { onConflict: 'user_id,date' },
            );
          if (upsertErr) throw upsertErr;
          await mirror('weight', input.value, metric.unit, at, notes, user.id);
        } else if (metric.storage === 'progress.body_fat_pct') {
          const { error: upsertErr } = await supabase
            .from('progress')
            .upsert(
              { user_id: user.id, date: ymd, body_fat_pct: input.value },
              { onConflict: 'user_id,date' },
            );
          if (upsertErr) throw upsertErr;
          await mirror('bodyfat', input.value, metric.unit, at, notes, user.id);
        } else {
          const { error: insertErr } = await supabase
            .from('body_metric_entries')
            .insert({
              user_id: user.id,
              metric_id: metric.id,
              value: input.value,
              unit: metric.unit,
              logged_at: at.toISOString(),
              notes,
            });
          if (insertErr) throw insertErr;
        }

        onSuccess?.();
        return { error: null };
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to save';
        console.error('[useLogMetricEntry]', message);
        setError(message);
        return { error: message };
      } finally {
        setSubmitting(false);
      }
    },
    [user, onSuccess],
  );

  return { log, submitting, error };
}

async function mirror(
  metricId: string,
  value: number,
  unit: string,
  at: Date,
  notes: string | null,
  userId: string,
) {
  // NOTE: Best-effort. If the `body_metric_entries` migration hasn't been
  //   applied, this silently fails and the entry only lives in `progress`.
  //   That's acceptable for v1 — the migration is the user's next step.
  try {
    await supabase.from('body_metric_entries').insert({
      user_id: userId,
      metric_id: metricId,
      value,
      unit,
      logged_at: at.toISOString(),
      notes,
    });
  } catch (e) {
    console.warn('[useLogMetricEntry.mirror] skipped', e);
  }
}
