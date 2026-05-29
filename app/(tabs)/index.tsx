import HomeDashboardV2 from '../../components/home-v2/HomeDashboardV2';

/**
 * The Home tab is now the v2 emerald-on-black dashboard. The orchestrator
 * lives in `components/home-v2/HomeDashboardV2.tsx`; this file is just the
 * route hook-up so other screens can `router.replace('/')` cleanly.
 */
export default function HomeScreen() {
  return <HomeDashboardV2 />;
}
