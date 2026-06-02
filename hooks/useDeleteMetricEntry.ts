import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { fmtLocalDate } from '../lib/date';
import { type Metric } from '../lib/metrics-catalog';

export type DeletableEntry = {
  id: string;
  metric: Metric;
  value: number;
  loggedAt: string; // ISO
  notes?: string;
};

type Result = { error: string | null };

/**
 * Deletes a metric entry. For weight/bodyfat we null out the legacy column
 * on the matching `progress` row (and drop the row entirely if no other
 * non-null measurement remains). For body_metric_entries we hard-delete by id.
 *
 * Provides a companion `restore` action that re-creates the entry from the
 * payload captured before deletion — powers the 5-second undo toast.
 *
 * NOTE: Soft-delete with a 60-second restore window (as the spec describes)
 *   would need an `is_deleted` column + a backend tombstone. For v1 we
 *   re-insert on undo. Side effect: the restored entry gets a fresh id —
 *   the data round-trips perfectly, but any in-flight references to the
 *   old id become stale.
 */
export function useDeleteMetricEntry() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(
    async (entry: DeletableEntry): Promise<Result> => {
      if (!user) return { error: 'Not authenticated' };
      setSubmitting(true);
      setError(null);
      try {
        const { metric } = entry;
        if (metric.storage === 'progress.weight_kg') {
          await clearLegacyProgressColumn(
            user.id,
            entry.loggedAt,
            'weight_kg',
          );
        } else if (metric.storage === 'progress.body_fat_pct') {
          await clearLegacyProgressColumn(
            user.id,
            entry.loggedAt,
            'body_fat_pct',
          );
        } else {
          const { error: delErr } = await supabase
            .from('body_metric_entries')
            .delete()
            .eq('id', entry.id)
            .eq('user_id', user.id);
          if (delErr) throw delErr;
        }
        return { error: null };
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to delete';
        console.error('[useDeleteMetricEntry]', message);
        setError(message);
        return { error: message };
      } finally {
        setSubmitting(false);
      }
    },
    [user],
  );

  const restore = useCallback(
    async (entry: DeletableEntry): Promise<Result> => {
      if (!user) return { error: 'Not authenticated' };
      try {
        const at = new Date(entry.loggedAt);
        const ymd = fmtLocalDate(at);
        if (entry.metric.storage === 'progress.weight_kg') {
          const kg = entry.value / 2.2046226218;
          const { error: upErr } = await supabase
            .from('progress')
            .upsert(
              { user_id: user.id, date: ymd, weight_kg: kg },
              { onConflict: 'user_id,date' },
            );
          if (upErr) throw upErr;
        } else if (entry.metric.storage === 'progress.body_fat_pct') {
          const { error: upErr } = await supabase
            .from('progress')
            .upsert(
              { user_id: user.id, date: ymd, body_fat_pct: entry.value },
              { onConflict: 'user_id,date' },
            );
          if (upErr) throw upErr;
        } else {
          const { error: insErr } = await supabase
            .from('body_metric_entries')
            .insert({
              user_id: user.id,
              metric_id: entry.metric.id,
              value: entry.value,
              unit: entry.metric.unit,
              logged_at: entry.loggedAt,
              notes: entry.notes ?? null,
            });
          if (insErr) throw insErr;
        }
        return { error: null };
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to restore';
        console.error('[useDeleteMetricEntry.restore]', message);
        return { error: message };
      }
    },
    [user],
  );

  return { remove, restore, submitting, error };
}

async function clearLegacyProgressColumn(
  userId: string,
  iso: string,
  column: 'weight_kg' | 'body_fat_pct',
): Promise<void> {
  const date = fmtLocalDate(new Date(iso));
  const otherCol = column === 'weight_kg' ? 'body_fat_pct' : 'weight_kg';
  // If the other column is also null, drop the whole row. Otherwise null out
  // just our column so the sibling measurement survives.
  const { data, error: selErr } = await supabase
    .from('progress')
    .select('id, weight_kg, body_fat_pct')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();
  if (selErr) throw selErr;
  if (!data) return;
  const otherValue = (data as Record<string, unknown>)[otherCol];
  if (otherValue == null) {
    const { error: delErr } = await supabase
      .from('progress')
      .delete()
      .eq('user_id', userId)
      .eq('date', date);
    if (delErr) throw delErr;
  } else {
    const { error: upErr } = await supabase
      .from('progress')
      .update({ [column]: null })
      .eq('user_id', userId)
      .eq('date', date);
    if (upErr) throw upErr;
  }
}
