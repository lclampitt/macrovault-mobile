// User-defined schedule items — meals, workouts, weigh-ins, anything.
//
// Backed by the `schedule_items` Supabase table (see
// /supabase/migrations/0001_schedule_items.sql). Per-row RLS guarantees a
// user only sees their own rows. We don't paginate — a day rarely has more
// than ~10 items.
//
// The public surface of this file is unchanged from the previous
// AsyncStorage implementation, so `useSchedule` and every UI component
// stayed identical when we cut over.

import { supabase } from './supabase';
import type { MealPeriod } from './meal-periods';

export type ScheduleKind = 'meal' | 'workout' | 'weight' | 'other';

export type ScheduleItem = {
  id: string;
  date: string; // YYYY-MM-DD local
  /** 24-hour HH:MM (e.g. "08:30"). Required — derives the display period. */
  time: string;
  /** Period bucket, derived from `time` at write — kept for fast filtering. */
  period: MealPeriod;
  kind: ScheduleKind;
  title: string;
  notes?: string;
  /**
   * Optional macros snapshot, captured when the user schedules from their
   * existing meal plan. Used to one-tap log later.
   */
  macros?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  /** ISO timestamp the item was created — used as a stable sort tiebreaker. */
  createdAt: string;
};

type Row = {
  id: string;
  date: string;
  time: string;
  period: MealPeriod;
  kind: ScheduleKind;
  title: string;
  notes: string | null;
  macros: ScheduleItem['macros'] | null;
  created_at: string;
};

function fromRow(r: Row): ScheduleItem {
  return {
    id: r.id,
    date: r.date,
    time: r.time,
    period: r.period,
    kind: r.kind,
    title: r.title,
    notes: r.notes ?? undefined,
    macros: r.macros ?? undefined,
    createdAt: r.created_at,
  };
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// --------------------------------------------------------------------------
// CRUD
// --------------------------------------------------------------------------

export async function loadSchedule(ymd: string): Promise<ScheduleItem[]> {
  const uid = await currentUserId();
  if (!uid) return [];
  try {
    const { data, error } = await supabase
      .from('schedule_items')
      .select('id, date, time, period, kind, title, notes, macros, created_at')
      .eq('user_id', uid)
      .eq('date', ymd)
      .order('time', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return ((data as Row[]) ?? []).map(fromRow);
  } catch (e) {
    console.error('[scheduleStore] loadSchedule', e);
    return [];
  }
}

export async function addScheduleItem(
  ymd: string,
  item: Omit<ScheduleItem, 'id' | 'createdAt' | 'date'>,
): Promise<ScheduleItem | null> {
  const uid = await currentUserId();
  if (!uid) return null;
  try {
    const { data, error } = await supabase
      .from('schedule_items')
      .insert({
        user_id: uid,
        date: ymd,
        time: item.time,
        period: item.period,
        kind: item.kind,
        title: item.title,
        notes: item.notes ?? null,
        macros: item.macros ?? null,
      })
      .select('id, date, time, period, kind, title, notes, macros, created_at')
      .single();
    if (error) throw error;
    return fromRow(data as Row);
  } catch (e) {
    console.error('[scheduleStore] addScheduleItem', e);
    return null;
  }
}

export async function removeScheduleItem(
  _ymd: string,
  id: string,
): Promise<void> {
  const uid = await currentUserId();
  if (!uid) return;
  try {
    const { error } = await supabase
      .from('schedule_items')
      .delete()
      .eq('id', id)
      .eq('user_id', uid); // defensive — RLS also enforces ownership
    if (error) throw error;
  } catch (e) {
    console.error('[scheduleStore] removeScheduleItem', e);
  }
}

/** Sort chronologically by time, then by created order. The server-side
 *  query already orders this way; this helper exists for local arrays
 *  built up between fetches (e.g. optimistic UI). */
export function sortSchedule(items: ScheduleItem[]): ScheduleItem[] {
  return [...items].sort((a, b) => {
    const ta = a.time ?? '99:99';
    const tb = b.time ?? '99:99';
    if (ta !== tb) return ta.localeCompare(tb);
    return a.createdAt.localeCompare(b.createdAt);
  });
}
