import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import HomeHeader from '../../components/home/HomeHeader';
import GreetingCard from '../../components/home/GreetingCard';
import StatCardRow from '../../components/home/StatCardRow';
import QuickActions from '../../components/home/QuickActions';

// Mock data for Phase 3b. Real Supabase queries land in Phase 3c.
// Values intentionally match reference-screenshots/home-1.png and home-2.png.
const MOCK_DATA = {
  timeOfDay: '4:22 PM',
  period: 'AFTERNOON', // MORNING / AFTERNOON / EVENING
  calories: {
    remaining: 2180,
    consumed: 0,
    goal: 2180,
  },
  macros: {
    protein: { current: 0, goal: 120, unit: 'g' },
    carbs: { current: 0, goal: 288, unit: 'g' },
    fat: { current: 0, goal: 61, unit: 'g' },
  },
  thisWeek: {
    completed: 0,
    target: 4,
    status: 'starting fresh',
  },
  weight: {
    current: 170.0,
    unit: 'lb',
    lastUpdated: 'last 2 wk ago',
    history: [172, 171.5, 171, 170.5, 170, 170.2, 170],
  },
  heroKicker: 'START YOUR DAY',
  heroTitle: 'Log snack',
  heroSubtitle: 'scan, search, or from your plan',
  workoutSubtitle: 'pick a template',
  weightSubtitle: 'last 170 lb · 2 wk ago',
};

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <HomeHeader />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <GreetingCard
          time={MOCK_DATA.timeOfDay}
          period={MOCK_DATA.period}
          calories={MOCK_DATA.calories}
          macros={MOCK_DATA.macros}
        />
        <StatCardRow thisWeek={MOCK_DATA.thisWeek} weight={MOCK_DATA.weight} />
        <View style={styles.actionsSpacer} />
        <QuickActions
          heroKicker={MOCK_DATA.heroKicker}
          heroTitle={MOCK_DATA.heroTitle}
          heroSubtitle={MOCK_DATA.heroSubtitle}
          workoutSubtitle={MOCK_DATA.workoutSubtitle}
          weightSubtitle={MOCK_DATA.weightSubtitle}
        />
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
    paddingTop: 4,
    paddingBottom: 120, // clearance for the floating tab bar
    gap: 14,
  },
  actionsSpacer: {
    height: 2,
  },
});
