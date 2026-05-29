import MealsDashboardV2 from '../../components/meals-v2/MealsDashboardV2';

/**
 * The Meals tab is now the v2 emerald-on-black redesign. The orchestrator
 * lives in `components/meals-v2/MealsDashboardV2.tsx`; this file is just
 * the route hook-up.
 */
export default function MealsScreen() {
  return <MealsDashboardV2 />;
}
