// The 8 default body metrics + the shared types for custom metrics.
//
// Weight + Body Fat are also written to the legacy `progress` table so the
// web app's BodyComp views keep working. Every new entry — including new
// Weight / Body Fat entries from the universal Log Sheet — is mirrored into
// `body_metric_entries` (see /supabase/migrations/0002_body_metrics.sql).
//
// The shape here is intentionally narrow:
//   - id: stable string used in routes, query keys, picker selections
//   - storage key: how the row gets written ('progress.weight_kg' or
//     'body_metric_entries.<metric_id>')
//   - direction: drives delta color (down for cuts, up for build markers)

import {
  Activity,
  Ruler,
  Scale,
  type LucideIcon,
} from 'lucide-react-native';

export type MetricId =
  | 'weight'
  | 'bodyfat'
  | 'waist'
  | 'abdomen'
  | 'glutes'
  | 'chest'
  | 'shoulders'
  | 'arms'
  | string; // custom metric ids (UUID)

export type GoodDirection = 'up' | 'down' | 'either';

export type MetricCategory = 'composition' | 'circumference' | 'custom';

export type Metric = {
  id: MetricId;
  name: string;
  icon: LucideIcon;
  category: MetricCategory;
  /** "lb", "%", "in", "kg", "cm" — display unit (user pref). */
  unit: string;
  /** Decimals shown on the hero / value labels. */
  decimals: number;
  /** Direction that counts as progress. 'either' shows emerald deltas. */
  goodDirection: GoodDirection;
  /** True for the 8 hard-coded defaults. */
  isBuiltIn: boolean;
  /**
   * Hint to the storage layer.
   *   'progress.weight_kg'   → legacy column for weight
   *   'progress.body_fat_pct'→ legacy column for body fat
   *   'body_metric_entries'  → new flexible table for everything else
   *
   * NOTE: Once the legacy `progress` columns are backfilled into
   *   `body_metric_entries`, the two `progress.*` entries can switch to
   *   `body_metric_entries` and we deprecate the legacy reads.
   */
  storage:
    | 'progress.weight_kg'
    | 'progress.body_fat_pct'
    | 'body_metric_entries';
  /** Bounds for client-side validation (server enforces too). */
  bounds: { min: number; max: number };
};

export const DEFAULT_METRICS: Metric[] = [
  {
    id: 'weight',
    name: 'Weight',
    icon: Scale,
    category: 'composition',
    unit: 'lb',
    decimals: 1,
    goodDirection: 'either', // depends on goal; v1 colors all green
    isBuiltIn: true,
    storage: 'progress.weight_kg',
    bounds: { min: 50, max: 1000 },
  },
  {
    id: 'bodyfat',
    name: 'Body Fat',
    icon: Activity,
    category: 'composition',
    unit: '%',
    decimals: 1,
    goodDirection: 'down',
    isBuiltIn: true,
    storage: 'progress.body_fat_pct',
    bounds: { min: 1, max: 60 },
  },
  {
    id: 'waist',
    name: 'Waist',
    icon: Ruler,
    category: 'circumference',
    unit: 'in',
    decimals: 1,
    goodDirection: 'down',
    isBuiltIn: true,
    storage: 'body_metric_entries',
    bounds: { min: 5, max: 80 },
  },
  {
    id: 'abdomen',
    name: 'Abdomen',
    icon: Ruler,
    category: 'circumference',
    unit: 'in',
    decimals: 1,
    goodDirection: 'down',
    isBuiltIn: true,
    storage: 'body_metric_entries',
    bounds: { min: 5, max: 80 },
  },
  {
    id: 'glutes',
    name: 'Glutes',
    icon: Ruler,
    category: 'circumference',
    unit: 'in',
    decimals: 1,
    goodDirection: 'either',
    isBuiltIn: true,
    storage: 'body_metric_entries',
    bounds: { min: 5, max: 80 },
  },
  {
    id: 'chest',
    name: 'Chest',
    icon: Ruler,
    category: 'circumference',
    unit: 'in',
    decimals: 1,
    goodDirection: 'up',
    isBuiltIn: true,
    storage: 'body_metric_entries',
    bounds: { min: 5, max: 80 },
  },
  {
    id: 'shoulders',
    name: 'Shoulders',
    icon: Ruler,
    category: 'circumference',
    unit: 'in',
    decimals: 1,
    goodDirection: 'up',
    isBuiltIn: true,
    storage: 'body_metric_entries',
    bounds: { min: 5, max: 80 },
  },
  {
    id: 'arms',
    name: 'Arms',
    icon: Ruler,
    category: 'circumference',
    unit: 'in',
    decimals: 1,
    goodDirection: 'up',
    isBuiltIn: true,
    storage: 'body_metric_entries',
    bounds: { min: 5, max: 80 },
  },
];

export function findMetric(id: MetricId): Metric | null {
  return DEFAULT_METRICS.find((m) => m.id === id) ?? null;
}

/** Round a value to the metric's decimal precision and format with units. */
export function formatMetricValue(
  value: number | null,
  metric: Metric,
): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return value.toFixed(metric.decimals);
}

/** A "good" delta is in the metric's preferred direction. */
export function deltaIsGood(metric: Metric, delta: number): boolean {
  if (metric.goodDirection === 'either') return true;
  if (Math.abs(delta) < 0.001) return true;
  if (metric.goodDirection === 'up') return delta > 0;
  return delta < 0;
}
