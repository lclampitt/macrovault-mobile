import FitnessScreen from '../components/fitness/FitnessScreen';

// Fitness tab — the HealthKit / Apple Watch data screen. Sibling of the
// existing /activity logging-consistency calendar, NOT a replacement. Both
// are reachable from the More tab.
export default function FitnessRoute() {
  return <FitnessScreen />;
}
