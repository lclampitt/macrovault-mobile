import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import {
  BODY_PART_LABELS,
  BODY_PART_ORDER,
  bodyPartForExerciseName,
} from '../lib/exercises';
import type {
  BurnRange,
  DailyBurnDay,
  FitnessData,
  HealthKitStatus,
  HRZoneBucket,
  MuscleSplitRow,
} from '../lib/healthkit-types';

// --------------------------------------------------------------------------
// HealthKit module — soft-required so the app works without it
//
// To actually wire HealthKit:
//   1. `npx expo install @kingstinct/react-native-healthkit`
//   2. Add the HealthKit capability to the iOS target in Xcode
//   3. Add NSHealthShareUsageDescription + NSHealthUpdateUsageDescription
//      to ios/<App>/Info.plist (see /docs/healthkit-setup.md)
//   4. Rebuild with `eas build --profile development` or `npx expo run:ios`
//
// Until those steps are done this hook returns status: 'unavailable' and the
// Fitness screen renders empty-state cards.
// --------------------------------------------------------------------------

// The package uses flat named exports. We pull only what we need and keep
// everything `any`-typed at the boundary so the hook stays compileable on
// Android / web (where the module isn't present).
type AuthRequest = { toRead?: readonly string[]; toShare?: readonly string[] };

type HealthKitModule = {
  isHealthDataAvailable?: () => boolean;
  requestAuthorization?: (req: AuthRequest) => Promise<boolean>;
  queryStatisticsForQuantity?: (
    identifier: string,
    statistics: readonly string[],
    options?: { filter?: { startDate?: Date; endDate?: Date }; unit?: string },
  ) => Promise<{
    sumQuantity?: { quantity: number };
    averageQuantity?: { quantity: number };
    minimumQuantity?: { quantity: number };
    maximumQuantity?: { quantity: number };
  }>;
  queryQuantitySamples?: (
    identifier: string,
    options: { filter?: { startDate?: Date; endDate?: Date }; limit?: number; unit?: string; ascending?: boolean },
  ) => Promise<ReadonlyArray<{ quantity: number; startDate: Date; endDate: Date }>>;
  queryWorkoutSamples?: (options: {
    filter?: { startDate?: Date; endDate?: Date };
    limit?: number;
    ascending?: boolean;
  }) => Promise<ReadonlyArray<{ startDate: Date; endDate: Date; totalEnergyBurned?: { quantity: number } }>>;
};

let HealthKit: HealthKitModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@kingstinct/react-native-healthkit');
  // Flat named exports — copy the functions we use onto a small surface.
  HealthKit = {
    isHealthDataAvailable: mod.isHealthDataAvailable,
    requestAuthorization: mod.requestAuthorization,
    queryStatisticsForQuantity: mod.queryStatisticsForQuantity,
    queryQuantitySamples: mod.queryQuantitySamples,
    queryWorkoutSamples: mod.queryWorkoutSamples,
  };
} catch {
  HealthKit = null;
}

const STORAGE_KEY = 'macrovault_fitness_range_v1';

// Read / write permission sets ----------------------------------------------
const READ_PERMS = [
  'HKQuantityTypeIdentifierHeartRate',
  'HKQuantityTypeIdentifierRestingHeartRate',
  'HKQuantityTypeIdentifierActiveEnergyBurned',
  'HKQuantityTypeIdentifierBasalEnergyBurned',
  'HKWorkoutTypeIdentifier',
];

const WRITE_PERMS = [
  'HKWorkoutTypeIdentifier',
  'HKQuantityTypeIdentifierDietaryEnergyConsumed',
  'HKQuantityTypeIdentifierDietaryProtein',
  'HKQuantityTypeIdentifierDietaryCarbohydrates',
  'HKQuantityTypeIdentifierDietaryFatTotal',
];

// --------------------------------------------------------------------------
// Date helpers
// --------------------------------------------------------------------------

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function shortLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// --------------------------------------------------------------------------
// Empty data shape — used until permission is granted or while loading.
// --------------------------------------------------------------------------

function emptyData(month: Date, range: BurnRange, status: HealthKitStatus): FitnessData {
  const n = range === '7d' ? 7 : range === '14d' ? 14 : 30;
  const today = new Date();
  const days: DailyBurnDay[] = Array.from({ length: n }, (_, i) => {
    const d = addDays(today, -(n - 1 - i));
    return {
      date: ymd(d),
      cal: 0,
      isWorkout: false,
      isToday: i === n - 1,
      label: shortLabel(d),
    };
  });
  return {
    month,
    workouts: { count: 0, prevMonthCount: 0, deltaPct: null },
    totalTime: { seconds: 0, avgSeconds: 0 },
    calories: { active: 0, total: 0 },
    dailyBurn: { range, days },
    heartRate: {
      avg: 0,
      min: 0,
      max: 0,
      resting: 0,
      restingDelta: 0,
      rangeFloor: 40,
      rangeCeil: 200,
      zones: [
        { name: 'Z1', label: 'Recovery', seconds: 0, pct: 0 },
        { name: 'Z2', label: 'Endurance', seconds: 0, pct: 0 },
        { name: 'Z3', label: 'Tempo', seconds: 0, pct: 0 },
        { name: 'Z4', label: 'Threshold', seconds: 0, pct: 0 },
        { name: 'Z5', label: 'Max', seconds: 0, pct: 0 },
      ],
    },
    consistency: {
      streak: 0,
      activeDays: 0,
      heatmap: Array.from({ length: 13 }, () => Array(7).fill(0) as number[]),
    },
    muscleSplit: [],
    status,
    lastSyncedAt: null,
  };
}

// --------------------------------------------------------------------------
// Supabase reads — used to fill workouts + muscle-split + isWorkout flags
// even when HealthKit is unavailable.
// --------------------------------------------------------------------------

type SupaWorkoutRow = {
  workout_date: string | null;
  workout_name: string | null;
  exercises: unknown;
};

async function loadMonthWorkouts(
  userId: string,
  month: Date,
): Promise<SupaWorkoutRow[]> {
  const first = ymd(startOfMonth(month));
  const last = ymd(endOfMonth(month));
  const { data, error } = await supabase
    .from('workouts')
    .select('workout_date, workout_name, exercises')
    .eq('user_id', userId)
    .gte('workout_date', first)
    .lte('workout_date', last);
  if (error) {
    console.error('[useHealthKit.loadMonthWorkouts]', error.message);
    return [];
  }
  return (data ?? []) as SupaWorkoutRow[];
}

async function loadRangeWorkoutDays(
  userId: string,
  range: BurnRange,
): Promise<Set<string>> {
  const n = range === '7d' ? 7 : range === '14d' ? 14 : 30;
  const today = new Date();
  const start = addDays(today, -(n - 1));
  const { data, error } = await supabase
    .from('workouts')
    .select('workout_date')
    .eq('user_id', userId)
    .gte('workout_date', ymd(start))
    .lte('workout_date', ymd(today));
  if (error) {
    console.error('[useHealthKit.loadRangeWorkoutDays]', error.message);
    return new Set();
  }
  return new Set(
    (data ?? [])
      .map((r) => r.workout_date)
      .filter((s): s is string => !!s),
  );
}

function buildMuscleSplit(rows: SupaWorkoutRow[]): MuscleSplitRow[] {
  // Volume = Σ(weight × reps) across exercises bucketed by body part.
  const volByPart: Record<string, number> = {};
  for (const w of rows) {
    const exs = Array.isArray(w.exercises) ? (w.exercises as Array<{ name?: unknown; sets?: unknown }>) : [];
    for (const ex of exs) {
      const name = typeof ex?.name === 'string' ? ex.name : '';
      if (!name) continue;
      const part = bodyPartForExerciseName(name);
      const sets = Array.isArray(ex.sets) ? (ex.sets as Array<{ weight?: unknown; reps?: unknown }>) : [];
      let exVol = 0;
      for (const s of sets) {
        const wt = Number(s?.weight) || 0;
        const rp = Number(s?.reps) || 0;
        exVol += wt * rp;
      }
      volByPart[part] = (volByPart[part] ?? 0) + exVol;
    }
  }
  const max = Math.max(0, ...Object.values(volByPart));
  return Object.entries(volByPart)
    .filter(([, v]) => v > 0)
    .map(([key, volume]) => ({
      name: BODY_PART_LABELS[key] ?? key.replace(/\b\w/g, (c) => c.toUpperCase()),
      volume,
      pct: max > 0 ? (volume / max) * 100 : 0,
    }))
    .sort((a, b) => {
      if (b.volume !== a.volume) return b.volume - a.volume;
      return BODY_PART_ORDER.indexOf(a.name.toLowerCase()) - BODY_PART_ORDER.indexOf(b.name.toLowerCase());
    });
}

function buildConsistencyHeatmap(rows: SupaWorkoutRow[]): number[][] {
  // 13 weeks × 7 days, Sunday-anchored to match the rest of the app's week math.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = addDays(today, -(13 * 7 - 1));
  const datesWithWorkouts = new Set(rows.map((r) => r.workout_date).filter(Boolean) as string[]);
  const grid: number[][] = Array.from({ length: 13 }, () => Array(7).fill(0) as number[]);
  for (let i = 0; i < 13 * 7; i++) {
    const d = addDays(start, i);
    const w = Math.floor(i / 7);
    const dow = d.getDay(); // 0=Sun
    if (datesWithWorkouts.has(ymd(d))) {
      // Intensity = 3 for "logged workout". Could later read HKWorkout duration
      // to grade 1–4. Stick with 3 for now so the chart pops without over-claiming.
      grid[w][dow] = 3;
    }
  }
  return grid;
}

function computeStreak(rows: SupaWorkoutRow[]): { streak: number; activeDays: number } {
  const set = new Set(rows.map((r) => r.workout_date).filter(Boolean) as string[]);
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  // If today has no workout, walk back to yesterday before counting.
  if (!set.has(ymd(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (set.has(ymd(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { streak, activeDays: set.size };
}

// --------------------------------------------------------------------------
// HealthKit query helpers — only called when HealthKit is available + granted.
// --------------------------------------------------------------------------

async function fetchHealthKit(month: Date, range: BurnRange): Promise<Partial<FitnessData> | null> {
  if (!HealthKit) return null;
  try {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const monthFilter = { startDate: monthStart, endDate: monthEnd };

    // Active + basal monthly totals
    const [active, basal] = await Promise.all([
      HealthKit.queryStatisticsForQuantity?.(
        'HKQuantityTypeIdentifierActiveEnergyBurned',
        ['cumulativeSum'],
        { filter: monthFilter },
      ),
      HealthKit.queryStatisticsForQuantity?.(
        'HKQuantityTypeIdentifierBasalEnergyBurned',
        ['cumulativeSum'],
        { filter: monthFilter },
      ),
    ]);
    const activeCal = Math.round(active?.sumQuantity?.quantity ?? 0);
    const basalCal = Math.round(basal?.sumQuantity?.quantity ?? 0);

    // Workouts
    const hkWorkouts =
      (await HealthKit.queryWorkoutSamples?.({ filter: monthFilter, ascending: true })) ?? [];
    const totalSeconds = hkWorkouts.reduce(
      (sum, w) => sum + Math.max(0, (w.endDate.getTime() - w.startDate.getTime()) / 1000),
      0,
    );

    // Resting HR — latest sample + 30-day-prior sample for delta
    const restingSamples =
      (await HealthKit.queryQuantitySamples?.('HKQuantityTypeIdentifierRestingHeartRate', {
        filter: { startDate: addDays(new Date(), -45), endDate: new Date() },
        limit: 50,
        ascending: true,
      })) ?? [];
    const latestResting = restingSamples[restingSamples.length - 1]?.quantity ?? 0;
    const earliest = restingSamples[0]?.quantity ?? latestResting;
    const restingDelta = Math.round(latestResting - earliest);

    // Daily burn over the selected range
    const n = range === '7d' ? 7 : range === '14d' ? 14 : 30;
    const today = new Date();
    const dailyDays: DailyBurnDay[] = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = addDays(today, -i);
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);
      const dayFilter = { startDate: dayStart, endDate: dayEnd };
      const [a, b] = await Promise.all([
        HealthKit.queryStatisticsForQuantity?.(
          'HKQuantityTypeIdentifierActiveEnergyBurned',
          ['cumulativeSum'],
          { filter: dayFilter },
        ),
        HealthKit.queryStatisticsForQuantity?.(
          'HKQuantityTypeIdentifierBasalEnergyBurned',
          ['cumulativeSum'],
          { filter: dayFilter },
        ),
      ]);
      const total = Math.round((a?.sumQuantity?.quantity ?? 0) + (b?.sumQuantity?.quantity ?? 0));
      const hasHkWorkout = hkWorkouts.some(
        (w) => w.startDate >= dayStart && w.startDate <= dayEnd,
      );
      dailyDays.push({
        date: ymd(d),
        cal: total,
        isWorkout: hasHkWorkout,
        isToday: i === 0,
        label: shortLabel(d),
      });
    }

    // Heart-rate aggregates during workout windows
    const hrSamples: number[] = [];
    for (const w of hkWorkouts) {
      const samples =
        (await HealthKit.queryQuantitySamples?.('HKQuantityTypeIdentifierHeartRate', {
          filter: { startDate: w.startDate, endDate: w.endDate },
          limit: 5000,
          ascending: true,
        })) ?? [];
      for (const s of samples) hrSamples.push(s.quantity);
    }
    const hrMin = hrSamples.length ? Math.round(Math.min(...hrSamples)) : 0;
    const hrMax = hrSamples.length ? Math.round(Math.max(...hrSamples)) : 0;
    const hrAvg = hrSamples.length
      ? Math.round(hrSamples.reduce((a, b) => a + b, 0) / hrSamples.length)
      : 0;

    // Zones — naive 5-bucket split based on hrMax. NOTE: replace with real
    // max-HR formula once a birthdate field exists on the profile.
    const zoneSeconds = [0, 0, 0, 0, 0];
    const effectiveMax = hrMax || 190;
    for (const v of hrSamples) {
      const pct = v / effectiveMax;
      let z = 0;
      if (pct >= 0.9) z = 4;
      else if (pct >= 0.8) z = 3;
      else if (pct >= 0.7) z = 2;
      else if (pct >= 0.6) z = 1;
      else z = 0;
      // Assume 1-second-per-sample resolution; HealthKit samples are typically 5s.
      zoneSeconds[z] += 5;
    }
    const zonesTotal = zoneSeconds.reduce((a, b) => a + b, 0) || 1;
    const zoneNames = [
      { name: 'Z1', label: 'Recovery' },
      { name: 'Z2', label: 'Endurance' },
      { name: 'Z3', label: 'Tempo' },
      { name: 'Z4', label: 'Threshold' },
      { name: 'Z5', label: 'Max' },
    ];
    const zones: HRZoneBucket[] = zoneNames.map((z, i) => ({
      ...z,
      seconds: zoneSeconds[i],
      pct: Math.round((zoneSeconds[i] / zonesTotal) * 100),
    }));

    return {
      workouts: {
        count: hkWorkouts.length,
        prevMonthCount: 0, // NOTE: query prior month separately to populate
        deltaPct: null,
      },
      totalTime: {
        seconds: Math.round(totalSeconds),
        avgSeconds: hkWorkouts.length ? Math.round(totalSeconds / hkWorkouts.length) : 0,
      },
      calories: { active: activeCal, total: activeCal + basalCal },
      dailyBurn: { range, days: dailyDays },
      heartRate: {
        avg: hrAvg,
        min: hrMin,
        max: hrMax,
        resting: Math.round(latestResting),
        restingDelta,
        rangeFloor: 40,
        rangeCeil: 200,
        zones,
      },
    };
  } catch (e) {
    console.error('[useHealthKit.fetchHealthKit]', e);
    return null;
  }
}

// --------------------------------------------------------------------------
// Public hook
// --------------------------------------------------------------------------

type State = {
  data: FitnessData;
  loading: boolean;
  refetch: () => Promise<void>;
  /** Triggers the system permission sheet (first time) or re-asks if denied. */
  requestPermissions: () => Promise<HealthKitStatus>;
  setRange: (r: BurnRange) => void;
  setMonth: (m: Date) => void;
};

export function useHealthKit(): State {
  const { user } = useAuth();
  const [month, setMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [range, setRangeState] = useState<BurnRange>('14d');
  const [status, setStatus] = useState<HealthKitStatus>(() =>
    Platform.OS === 'ios' && HealthKit ? 'disconnected' : 'unavailable',
  );
  const [data, setData] = useState<FitnessData>(() =>
    emptyData(startOfMonth(new Date()), '14d', Platform.OS === 'ios' && HealthKit ? 'disconnected' : 'unavailable'),
  );
  const [loading, setLoading] = useState(false);
  const lastFetchKey = useRef<string>('');

  // Restore persisted range pref on first render.
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === '7d' || stored === '14d' || stored === '30d') {
          setRangeState(stored);
        }
      } catch (e) {
        console.error('[useHealthKit.restoreRange]', e);
      }
    })();
  }, []);

  const setRange = useCallback((r: BurnRange) => {
    setRangeState(r);
    void AsyncStorage.setItem(STORAGE_KEY, r).catch((e) =>
      console.error('[useHealthKit.persistRange]', e),
    );
  }, []);

  const requestPermissions = useCallback(async (): Promise<HealthKitStatus> => {
    if (!HealthKit?.requestAuthorization || Platform.OS !== 'ios') {
      setStatus('unavailable');
      return 'unavailable';
    }
    try {
      // `isHealthDataAvailable` is synchronous in this package.
      const ok = HealthKit.isHealthDataAvailable?.() ?? true;
      if (!ok) {
        setStatus('unavailable');
        return 'unavailable';
      }
      const granted = await HealthKit.requestAuthorization({
        toRead: READ_PERMS,
        toShare: WRITE_PERMS,
      });
      // HealthKit deliberately doesn't tell us if READ was denied. Treat the
      // boolean as write-grant only; we'll know reads work when the query
      // either returns samples or stays empty.
      const next: HealthKitStatus = granted ? 'connected' : 'partial';
      setStatus(next);
      return next;
    } catch (e) {
      console.error('[useHealthKit.request]', e);
      setStatus('denied');
      return 'denied';
    }
  }, []);

  const refetch = useCallback(async () => {
    if (!user) return;
    const key = `${user.id}-${ymd(month)}-${range}-${status}`;
    if (lastFetchKey.current === key && data.status === status) return;
    lastFetchKey.current = key;
    setLoading(true);
    try {
      // Supabase reads always work regardless of HealthKit availability.
      const [monthRows, rangeWorkoutDays] = await Promise.all([
        loadMonthWorkouts(user.id, month),
        loadRangeWorkoutDays(user.id, range),
      ]);

      const muscleSplit = buildMuscleSplit(monthRows);
      const heatmap = buildConsistencyHeatmap(monthRows);
      const { streak, activeDays } = computeStreak(monthRows);

      // Start from a blank shell. HealthKit will fill the heart-rate / calorie
      // numbers if connected; otherwise we leave them at 0 and show empty
      // states in the UI.
      const next: FitnessData = {
        ...emptyData(month, range, status),
        workouts: {
          count: monthRows.length,
          prevMonthCount: 0,
          deltaPct: null,
        },
        consistency: { streak, activeDays, heatmap },
        muscleSplit,
      };

      // Apply the range's isWorkout flag using MacroVault's own workouts.
      next.dailyBurn.days = next.dailyBurn.days.map((d) => ({
        ...d,
        isWorkout: rangeWorkoutDays.has(d.date),
      }));

      // Layer HealthKit data on top when available.
      if (status === 'connected' || status === 'partial') {
        const hk = await fetchHealthKit(month, range);
        if (hk) {
          Object.assign(next, hk);
          // Union HK workout days with Supabase workout days for the chart.
          next.dailyBurn.days = next.dailyBurn.days.map((d) => ({
            ...d,
            isWorkout: rangeWorkoutDays.has(d.date) || d.isWorkout,
          }));
          next.lastSyncedAt = new Date();
        }
      }

      setData(next);
    } finally {
      setLoading(false);
    }
  }, [user, month, range, status, data.status]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  return useMemo(
    () => ({
      data,
      loading,
      refetch,
      requestPermissions,
      setRange,
      setMonth,
    }),
    [data, loading, refetch, requestPermissions, setRange],
  );
}
