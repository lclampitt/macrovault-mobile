import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { fmtLocalDate } from '../lib/date';
import { type Metric } from '../lib/metrics-catalog';

type Input = {
  entryId: string;
  metric: Metric;
  value: number;
  loggedAt: Date;
  notes?: string;
};

type Result = { error: string | null };

/**
 * Updates an existing metric entry. Routes the write based on the metric's
 * storage hint, the same way useLogMetricEntry chooses where to write.
 *
 *   Weight / Body Fat → updates the legacy `progress` row by date
 *   Everything else   → updates the `body_metric_entries` row by id
 *
 * NOTE: For weight/bodyfat we identify the row by `(user_id, date)` not the
 *   passed entry id. That means changing the date of an existing weight
 *   entry is best-effort — we delete the old date row first, then upsert
 *   the new one. For body_metric_entries we can do a clean update-by-id.
 */
export function useUpdateMetricEntry() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(
    async (input: Input): Promise<Result> => {
      if (!user) return { error: 'Not authenticated' };
      const { metric, value, loggedAt } = input;
      if (value < metric.bounds.min || value > metric.bounds.max) {
        const msg = `Value out of range (${metric.bounds.min}–${metric.bounds.max} ${metric.unit}).`;
        setError(msg);
        return { error: msg };
      }
      setSubmitting(true);
      setError(null);
      try {
        const notes = input.notes?.trim() || null;

        if (metric.storage === 'progress.weight_kg') {
          // Update the legacy row, then mirror to body_metric_entries.
          const kg = value / 2.2046226218;
          const { error: upErr } = await supabase
            .from('progress')
            .upsert(
              { user_id: user.id, date: fmtLocalDate(loggedAt), weight_kg: kg },
              { onConflict: 'user_id,date' },
            );
          if (upErr) throw upErr;
        } else if (metric.storage === 'progress.body_fat_pct') {
          const { error: upErr } = await supabase
            .from('progress')
            .upsert(
              {
                user_id: user.id,
                date: fmtLocalDate(loggedAt),
                body_fat_pct: value,
              },
              { onConflict: 'user_id,date' },
            );
          if (upErr) throw upErr;
        } else {
          // Flexible table — clean update by id.
          const { error: upErr } = await supabase
            .from('body_metric_entries')
            .update({
              value,
              unit: metric.unit,
              logged_at: loggedAt.toISOString(),
              notes,
            })
            .eq('id', input.entryId)
            .eq('user_id', user.id);
          if (upErr) throw upErr;
        }
        return { error: null };
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to update';
        console.error('[useUpdateMetricEntry]', message);
        setError(message);
        return { error: message };
      } finally {
        setSubmitting(false);
      }
    },
    [user],
  );

  return { update, submitting, error };
}
