import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useWorkoutTemplates } from '../../hooks/useWorkoutTemplates';
import { useRecentWorkouts } from '../../hooks/useRecentWorkouts';
import QuickStartCard from '../../components/log-workout/QuickStartCard';
import StartCardioCard from '../../components/log-workout/StartCardioCard';
import TemplatesGrid from '../../components/log-workout/TemplatesGrid';
import RecentWorkoutsList from '../../components/log-workout/RecentWorkoutsList';
import {
  RecentWorkoutsSkeleton,
  TemplatesGridSkeleton,
} from '../../components/log-workout/LogWorkoutSkeletons';

export default function LogWorkoutScreen() {
  const { templates, loading: templatesLoading } = useWorkoutTemplates();
  const { workouts, loading: workoutsLoading } = useRecentWorkouts(20);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <QuickStartCard />
        <View style={styles.gap8} />
        <StartCardioCard />

        <Text style={styles.sectionHeader}>Templates</Text>
        {templatesLoading ? (
          <TemplatesGridSkeleton />
        ) : (
          <TemplatesGrid templates={templates} />
        )}

        <Text style={styles.sectionHeader}>Recent Workouts</Text>
        {workoutsLoading ? (
          <RecentWorkoutsSkeleton />
        ) : (
          <RecentWorkoutsList workouts={workouts} />
        )}
      </ScrollView>
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
