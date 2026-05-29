import WorkoutHubV2 from '../../components/workout-v2/WorkoutHubV2';

/**
 * Workout Hub — the bottom-tab entry point for templates and recent
 * workouts. The orchestrator lives in
 * `components/workout-v2/WorkoutHubV2.tsx`; this file is just the route
 * hook-up.
 */
export default function LogWorkoutScreen() {
  return <WorkoutHubV2 />;
}
