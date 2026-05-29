// Shapes consumed by the Fitness tab. Mirrors the spec in the Fitness brief.
//
// NOTE: HealthKit is iOS-only and requires a native module
//   (@kingstinct/react-native-healthkit). The visual screen renders identical
//   skeletons / empty states on Android and on iOS builds that don't include
//   the module — so the page is always usable, just data-empty.

export type BurnRange = '7d' | '14d' | '30d';

export type HealthKitStatus =
  /** Native module not present, not iOS, or otherwise unavailable. */
  | 'unavailable'
  /** First-time visit — user hasn't been asked yet. */
  | 'disconnected'
  /** Partial read access — some types granted, others not. */
  | 'partial'
  /** Asked, user denied write at least; reads may still work silently. */
  | 'denied'
  /** Fully connected and reading. */
  | 'connected';

export type DailyBurnDay = {
  date: string; // YYYY-MM-DD local
  /** Total kcal (active + basal) for the day. */
  cal: number;
  /** True when the user logged a workout in MacroVault OR HealthKit has an HKWorkout on the day. */
  isWorkout: boolean;
  isToday: boolean;
  /** Short label like "May 7" — caller can compute or accept as-is. */
  label: string;
};

export type HRZoneBucket = {
  /** "Z1" through "Z5" */
  name: string;
  /** "Recovery" / "Endurance" / "Tempo" / "Threshold" / "Max" */
  label: string;
  /** Seconds spent in this zone across the month. */
  seconds: number;
  /** 0–100 percentage of total workout time. */
  pct: number;
};

export type MuscleSplitRow = {
  name: string;
  /** Total volume in lb (sum of weight × reps). */
  volume: number;
  /** 0–100 normalized vs the top muscle for the month. */
  pct: number;
};

export type FitnessData = {
  /** First day of the displayed month, local time. */
  month: Date;
  workouts: {
    count: number;
    prevMonthCount: number;
    /** Integer percentage delta vs prior month. null when prior month had 0. */
    deltaPct: number | null;
  };
  totalTime: {
    /** Total workout seconds this month. */
    seconds: number;
    /** Average seconds per session (= seconds / count). */
    avgSeconds: number;
  };
  calories: {
    /** activeEnergyBurned cumulative for the month. */
    active: number;
    /** active + basal cumulative for the month. */
    total: number;
  };
  dailyBurn: {
    range: BurnRange;
    days: DailyBurnDay[];
  };
  heartRate: {
    /** Average bpm during workouts. */
    avg: number;
    /** Min bpm sampled during workouts. */
    min: number;
    /** Max bpm sampled during workouts. */
    max: number;
    /** Most-recent resting HR sample. */
    resting: number;
    /** Resting HR delta vs 30 days ago, in bpm. Negative = improved. */
    restingDelta: number;
    /** 0–200 bpm range used to position the dots on the gradient bar. */
    rangeFloor: number;
    rangeCeil: number;
    zones: HRZoneBucket[];
  };
  consistency: {
    /** Current streak length in days. */
    streak: number;
    /** Active days in the visible heatmap window. */
    activeDays: number;
    /** 13 weeks × 7 days (Mon=0..Sun=6), 0–4 intensity. */
    heatmap: number[][];
  };
  muscleSplit: MuscleSplitRow[];
  status: HealthKitStatus;
  /** When the last successful sync happened, for the status row. */
  lastSyncedAt: Date | null;
};
