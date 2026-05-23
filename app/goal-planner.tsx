import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useActiveGoal } from '../hooks/useActiveGoal';
import ActiveGoalCard from '../components/goal-planner/ActiveGoalCard';
import GoalTimelineCard from '../components/goal-planner/GoalTimelineCard';
import MacroTargetsCard from '../components/goal-planner/MacroTargetsCard';
import LogNutritionCard from '../components/goal-planner/LogNutritionCard';
import { GoalCardsSkeleton } from '../components/goal-planner/GoalPlannerSkeletons';

function comingSoonPhase9c() {
  Alert.alert(
    'Edit goal',
    'Coming soon — Phase 9c. The goal editor will arrive in a future update.',
  );
}

export default function GoalPlannerScreen() {
  const router = useRouter();
  const { goal, loading, error } = useActiveGoal();

  function handleBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          hitSlop={10}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="chevron-left" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Goal Planner</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <GoalCardsSkeleton />
        ) : error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>
              Couldn&apos;t load your goal. {error}
            </Text>
          </View>
        ) : goal ? (
          <View style={styles.stack}>
            <ActiveGoalCard goal={goal} onEditGoal={comingSoonPhase9c} />
            {goal.hasTimeframe ? <GoalTimelineCard goal={goal} /> : null}
            <MacroTargetsCard goal={goal} />
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Feather name="target" size={36} color={Colors.accentLight} />
            <Text style={styles.emptyTitle}>No goal set yet.</Text>
            <Text style={styles.emptySub}>
              Set a calorie and macro goal to track your progress over time.
            </Text>
            <Pressable
              style={styles.emptyBtn}
              onPress={comingSoonPhase9c}
              accessibilityRole="button"
            >
              <Text style={styles.emptyBtnText}>Set up a goal</Text>
            </Pressable>
          </View>
        )}

        {/* Nutrition logger renders whenever signed in — independent of goal,
            matching web's NutritionLogger placement. */}
        <View style={styles.loggerWrap}>
          <LogNutritionCard />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },
  stack: {
    gap: 14,
  },
  loggerWrap: {
    marginTop: 14,
  },
  errorCard: {
    backgroundColor: Colors.errorBg,
    borderColor: Colors.errorBorder,
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  emptySub: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  emptyBtn: {
    marginTop: 8,
    borderColor: Colors.borderAccent,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 22,
  },
  emptyBtnText: {
    color: Colors.accentLight,
    fontSize: 14,
    fontWeight: '600',
  },
});
