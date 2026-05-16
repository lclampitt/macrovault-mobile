// Pure helpers for the Progress > Body Composition section.
// Ported from gainlytics-v2 progress.jsx + ProgressCharts.jsx.

export type TimeRange = '2W' | '1M' | '3M' | '6M' | 'All';

export type BodyCompEntry = {
  id: string; // progress.id (needed for delete)
  date: string; // YYYY-MM-DD
  weight: number | null; // lbs (stored in progress.weight_kg)
  bodyFat: number | null; // progress.body_fat_pct
};

export type BodyCompStats = {
  currentWeight: number | null;
  currentBodyFat: number | null;
  weightChange: number | null;
  bodyFatChange: number | null;
};

export const TIME_RANGES: { key: TimeRange; label: string; days: number }[] = [
  { key: '2W', label: '2W', days: 14 },
  { key: '1M', label: '1M', days: 30 },
  { key: '3M', label: '3M', days: 90 },
  { key: '6M', label: '6M', days: 180 },
  { key: 'All', label: 'All', days: Infinity },
];

/** Local-time YYYY-MM-DD (consistent with the rest of the mobile app). */
function fmtLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Sort ascending by date (does not mutate input). */
export function sortByDate(entries: BodyCompEntry[]): BodyCompEntry[] {
  return [...entries].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Range-filter for the CHART only. Stats are computed from the full set
 * (matching the web, where the range pills never affect the stat cards).
 */
export function filterByRange(
  sortedAsc: BodyCompEntry[],
  range: TimeRange,
): BodyCompEntry[] {
  const tr = TIME_RANGES.find((t) => t.key === range);
  if (!tr || tr.days === Infinity) return sortedAsc;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - tr.days);
  const cutoffStr = fmtLocal(cutoff);
  return sortedAsc.filter((d) => d.date >= cutoffStr);
}

/**
 * Stats use the absolute-earliest entry vs. the latest entry across ALL data
 * (a faithful port of progress.jsx — the time-range pills do not affect these).
 */
export function deriveStats(sortedAsc: BodyCompEntry[]): BodyCompStats {
  if (sortedAsc.length === 0) {
    return {
      currentWeight: null,
      currentBodyFat: null,
      weightChange: null,
      bodyFatChange: null,
    };
  }
  const first = sortedAsc[0];
  const latest = sortedAsc[sortedAsc.length - 1];

  const currentWeight = latest.weight ?? null;
  const currentBodyFat = latest.bodyFat ?? null;

  const weightChange =
    first.weight != null && latest.weight != null && sortedAsc.length > 1
      ? Number((latest.weight - first.weight).toFixed(1))
      : null;
  const bodyFatChange =
    first.bodyFat != null && latest.bodyFat != null && sortedAsc.length > 1
      ? Number((latest.bodyFat - first.bodyFat).toFixed(1))
      : null;

  return { currentWeight, currentBodyFat, weightChange, bodyFatChange };
}

/** Signed display string: "+170.0 lbs", "-1.0%", or "—" (port of StatChip). */
export function formatStat(
  value: number | null,
  suffix: string,
  decimals = 1,
): string {
  if (value == null) return '—';
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${Math.abs(value).toFixed(decimals)}${suffix}`;
}

/** Compact x-axis label, e.g. "Apr 20" (or "Apr" for very long ranges). */
export function formatDateLabel(dateStr: string, spanDays: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  if (spanDays < 60) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString('en-US', { month: 'short' });
}

/** "Nice" rounded step (exact port of ProgressCharts.jsx calculateStepSize). */
export function calculateStepSize(min: number, max: number, targetTicks: number): number {
  const range = max - min;
  if (range <= 0) return 1;
  const rawStep = range / targetTicks;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalised = rawStep / magnitude;
  let niceStep: number;
  if (normalised < 1.5) niceStep = 1;
  else if (normalised < 3) niceStep = 2;
  else if (normalised < 7) niceStep = 5;
  else niceStep = 10;
  return niceStep * magnitude;
}

export type AxisBounds = { min: number; max: number };

/**
 * Exact port of ProgressCharts.jsx calculateChartBounds — the authoritative
 * web visual. Weight padded by max(15% of range, 5) and snapped to /5;
 * body fat padded by max(20% of range, 2).
 */
export function calculateChartBounds(
  weightData: number[],
  bfData: number[],
): { weight: AxisBounds; bf: AxisBounds } {
  const result = { weight: { min: 0, max: 200 }, bf: { min: 0, max: 40 } };

  if (weightData.length > 0) {
    const wMin = Math.min(...weightData);
    const wMax = Math.max(...weightData);
    const wRange = wMax - wMin;
    const wPad = Math.max(wRange * 0.15, 5);
    result.weight.min = Math.max(0, Math.floor((wMin - wPad) / 5) * 5);
    result.weight.max = Math.ceil((wMax + wPad) / 5) * 5;
  }

  if (bfData.length > 0) {
    const bMin = Math.min(...bfData);
    const bMax = Math.max(...bfData);
    const bRange = bMax - bMin;
    const bPad = Math.max(bRange * 0.2, 2);
    result.bf.min = Math.max(0, Math.floor(bMin - bPad));
    result.bf.max = Math.ceil(bMax + bPad);
  }

  return result;
}

/** Tick array across [min,max] using a nice step (port of web tick gen, target 6). */
export function makeTicks(min: number, max: number, targetTicks = 6): number[] {
  const step = calculateStepSize(min, max, targetTicks);
  const ticks: number[] = [];
  for (let v = min; v <= max + 1e-9; v += step) {
    ticks.push(Math.round(v * 10) / 10);
  }
  return ticks;
}
