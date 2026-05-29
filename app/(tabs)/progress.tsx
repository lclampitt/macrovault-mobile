import StatsDashboardV2 from '../../components/stats-v2/StatsDashboardV2';

/**
 * The Stats tab is now the v2 emerald-on-black redesign with the Body /
 * Strength / Nutrition sub-nav. The orchestrator lives in
 * `components/stats-v2/StatsDashboardV2.tsx`; this file is just the
 * route hook-up.
 */
export default function ProgressScreen() {
  return <StatsDashboardV2 />;
}
