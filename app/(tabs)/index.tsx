import { ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '../../lib/theme-context';
import GreetingCard from '../../components/home/GreetingCard';
import StatCardRow from '../../components/home/StatCardRow';
import QuickActions from '../../components/home/QuickActions';
import { useUserGoals } from '../../hooks/useUserGoals';
import { useTodayMacros } from '../../hooks/useTodayMacros';
import { useThisWeekWorkouts } from '../../hooks/useThisWeekWorkouts';
import { useCurrentWeight } from '../../hooks/useCurrentWeight';
import { fmtClock, getNextMealLabel, getPeriodLabel } from '../../lib/date';

const WEIGHT_UNIT = 'lb';

export default function HomeScreen() {
  const { theme: c } = useTheme();
  const goals = useUserGoals();
  const macros = useTodayMacros();
  const workouts = useThisWeekWorkouts();
  const weight = useCurrentWeight();

  // Greeting card data depends on both macros and goals — wait for both.
  const greetingLoading = macros.loading || goals.loading;
  const greetingError = macros.error ?? goals.error ?? null;

  // Quick actions copy depends on macros (kicker/title) and weight (sub).
  const quickLoading = macros.loading || weight.loading;

  const now = new Date();
  const heroKicker = macros.data.calories === 0 ? 'START YOUR DAY' : 'NEXT UP';
  const heroTitle = `Log ${getNextMealLabel(now).toLowerCase()}`;
  const heroSubtitle = 'scan, search, or from your plan';
  const weightSubtitle =
    weight.data.current != null && weight.data.lastAgo
      ? `last ${Math.round(weight.data.current)} ${WEIGHT_UNIT} · ${weight.data.lastAgo}`
      : 'no entries yet';
  const workoutSubtitle = 'pick a template';

  return (
    <View style={[styles.safeArea, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <GreetingCard
          time={fmtClock(now)}
          period={getPeriodLabel(now)}
          macros={macros.data}
          goals={goals.data}
          loading={greetingLoading}
          error={greetingError}
        />
        <StatCardRow
          thisWeek={workouts.data}
          thisWeekLoading={workouts.loading}
          thisWeekError={workouts.error}
          weight={weight.data}
          weightUnit={WEIGHT_UNIT}
          weightLoading={weight.loading}
          weightError={weight.error}
        />
        <View style={styles.actionsSpacer} />
        <QuickActions
          heroKicker={heroKicker}
          heroTitle={heroTitle}
          heroSubtitle={heroSubtitle}
          workoutSubtitle={workoutSubtitle}
          weightSubtitle={weightSubtitle}
          loading={quickLoading}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
