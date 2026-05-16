import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useWorkoutTemplates } from '../../hooks/useWorkoutTemplates';
import { useRecentWorkouts } from '../../hooks/useRecentWorkouts';
import { useSubscription } from '../../hooks/useSubscription';
import { useTemplateActions } from '../../hooks/useTemplateActions';
import { useActiveWorkout } from '../../lib/active-workout-context';
import type { WorkoutTemplate } from '../../hooks/useWorkoutTemplates';
import QuickStartCard from '../../components/log-workout/QuickStartCard';
import StartCardioCard from '../../components/log-workout/StartCardioCard';
import TemplatesGrid from '../../components/log-workout/TemplatesGrid';
import RecentWorkoutsList from '../../components/log-workout/RecentWorkoutsList';
import UpgradeModal from '../../components/UpgradeModal';
import {
  RecentWorkoutsSkeleton,
  TemplatesGridSkeleton,
} from '../../components/log-workout/LogWorkoutSkeletons';

export default function LogWorkoutScreen() {
  const router = useRouter();
  const { templates, loading: templatesLoading } = useWorkoutTemplates();
  const { workouts, loading: workoutsLoading } = useRecentWorkouts(20);
  const { atFreeLimit } = useSubscription();
  const { fetchTemplate } = useTemplateActions();
  const { loadTemplate, start } = useActiveWorkout();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  function startWorkout(seedCardio: boolean) {
    if (atFreeLimit) {
      setUpgradeOpen(true);
      return;
    }
    // Start a fresh empty workout at the entry point. The active-workout
    // screen never resets on its own, so returning to it (e.g. via the
    // "workout in progress" banner) preserves whatever is in progress.
    start();
    router.push(seedCardio ? '/active-workout?seed=cardio' : '/active-workout');
  }

  async function startFromTemplate(template: WorkoutTemplate) {
    if (atFreeLimit) {
      setUpgradeOpen(true);
      return;
    }
    const { data, error } = await fetchTemplate(template.id);
    if (error || !data) return;
    loadTemplate(data);
    router.push('/active-workout');
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <QuickStartCard onPress={() => startWorkout(false)} />
        <View style={styles.gap8} />
        <StartCardioCard onPress={() => startWorkout(true)} />

        <Text style={styles.sectionHeader}>Templates</Text>
        {templatesLoading ? (
          <TemplatesGridSkeleton />
        ) : (
          <TemplatesGrid templates={templates} onSelect={startFromTemplate} />
        )}

        <Text style={styles.sectionHeader}>Recent Workouts</Text>
        {workoutsLoading ? (
          <RecentWorkoutsSkeleton />
        ) : (
          <RecentWorkoutsList workouts={workouts} />
        )}
      </ScrollView>

      <UpgradeModal visible={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24, // clearance below the persistent top bar
    paddingBottom: 120, // clearance for the floating bottom navbar
  },
  gap8: {
    height: 10,
  },
  sectionHeader: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginTop: 24,
    marginBottom: 12,
  },
});
