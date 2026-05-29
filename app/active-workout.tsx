import ActiveWorkoutV2 from '../components/workout-v2/ActiveWorkoutV2';

/**
 * In-session workout logger. The orchestrator lives in
 * `components/workout-v2/ActiveWorkoutV2.tsx`; this file is just the route
 * hook-up.
 */
export default function ActiveWorkoutScreen() {
  return <ActiveWorkoutV2 />;
}
