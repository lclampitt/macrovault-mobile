import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Pencil, Target } from 'lucide-react-native';
import { Font, Motion, Radius, Tabular } from '../lib/design-system';
import { useTokens } from '../lib/theme-context';
import { useActiveGoal } from '../hooks/useActiveGoal';
import PrimaryGoalCard from '../components/goal-planner/PrimaryGoalCard';
import GoalTimelineCardV2 from '../components/goal-planner/GoalTimelineCardV2';
import MacroTargetCard from '../components/goal-planner/MacroTargetCard';
import EditGoalSheet from '../components/goal-planner/EditGoalSheet';

export default function GoalPlannerScreen() {
  const t = useTokens();
  const router = useRouter();
  const { goal, loading, error, refetch } = useActiveGoal();
  const [editorOpen, setEditorOpen] = useState(false);

  function handleBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Page header — back / title / edit */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          hitSlop={10}
          style={[styles.iconBtn, { borderColor: t.borderDefault, backgroundColor: t.bgCard }]}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeft size={18} color={t.textPrimary} strokeWidth={2} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Goal Planner</Text>
        </View>
        <Pressable
          onPress={() => setEditorOpen(true)}
          hitSlop={10}
          style={[styles.iconBtn, { borderColor: t.borderDefault, backgroundColor: t.bgCard }]}
          accessibilityRole="button"
          accessibilityLabel="Edit goal"
          disabled={!goal}
        >
          <Pencil
            size={15}
            color={goal ? t.primary : t.textQuaternary}
            strokeWidth={2}
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={t.primary} />
          </View>
        ) : error ? (
          <View style={[styles.errorCard, { backgroundColor: t.bgCard }]}>
            <Text style={styles.errorText}>
              Couldn't load your goal. {error}
            </Text>
          </View>
        ) : !goal ? (
          <EmptyGoal onSetUp={() => setEditorOpen(true)} />
        ) : (
          <>
            {/* Status banner */}
            <View style={[styles.statusBanner, { backgroundColor: t.primaryTintBg, borderColor: t.primaryTintBorder }]}>
              <View style={[styles.statusDot, { backgroundColor: t.primary }]} />
              <Text style={[styles.statusText, { color: t.primary }]}>
                ACTIVE GOAL
                {goal.hasTimeframe ? (
                  <>
                    {' · '}
                    <Text style={[styles.statusStrong, { color: t.primary }, Tabular]}>
                      Day {goal.currentDay} of {goal.totalDays}
                    </Text>
                  </>
                ) : null}
              </Text>
            </View>

            <Animated.View
              entering={FadeInDown.duration(Motion.durationRise)}
              style={styles.section}
            >
              <PrimaryGoalCard goal={goal} />
            </Animated.View>

            {goal.hasTimeframe ? (
              <Animated.View
                entering={FadeInDown.duration(Motion.durationRise).delay(40)}
                style={styles.section}
              >
                <GoalTimelineCardV2 goal={goal} />
              </Animated.View>
            ) : null}

            <Animated.View
              entering={FadeInDown.duration(Motion.durationRise).delay(80)}
              style={styles.section}
            >
              <MacroTargetCard goal={goal} />
            </Animated.View>

            {/* Adjust goal CTA */}
            <Animated.View
              entering={FadeInDown.duration(Motion.durationRise).delay(120)}
              style={styles.section}
            >
              <Pressable
                onPress={() => setEditorOpen(true)}
                style={({ pressed }) => [
                  styles.adjustBtn,
                  { backgroundColor: t.bgCard, borderColor: t.borderDefault },
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Adjust goal"
              >
                <View style={styles.adjustLeft}>
                  <View style={[styles.adjustIcon, { backgroundColor: t.primaryTintBg, borderColor: t.primaryTintBorder }]}>
                    <Pencil size={14} color={t.primary} strokeWidth={2.25} />
                  </View>
                  <View>
                    <Text style={[styles.adjustTitle, { color: t.textPrimary }]}>Adjust goal</Text>
                    <Text style={[styles.adjustSub, { color: t.textTertiary }]}>
                      Tune calories, macros, or timeline
                    </Text>
                  </View>
                </View>
                <ChevronRight
                  size={16}
                  color={t.textTertiary}
                  strokeWidth={2}
                />
              </Pressable>
              <Text style={[styles.helperMicrotype, { color: t.textTertiary }]}>
                Changing your goal type archives the current plan and starts a
                fresh timeline.
              </Text>
            </Animated.View>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <EditGoalSheet
        visible={editorOpen}
        initial={goal}
        onClose={() => setEditorOpen(false)}
        onSaved={async () => {
          await refetch();
        }}
      />
    </SafeAreaView>
  );
}

function EmptyGoal({ onSetUp }: { onSetUp: () => void }) {
  const t = useTokens();
  return (
    <View style={[styles.emptyCard, { backgroundColor: t.bgCard, borderColor: t.borderDefault }]}>
      <View style={[styles.emptyIcon, { backgroundColor: t.primaryTintBg, borderColor: t.primaryTintBorder }]}>
        <Target size={32} color={t.primary} strokeWidth={2} />
      </View>
      <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>No goal set yet</Text>
      <Text style={[styles.emptySub, { color: t.textTertiary }]}>
        Pick a phase, set a calorie target, and we'll track day-over-day
        progress for you.
      </Text>
      <Pressable
        onPress={onSetUp}
        style={({ pressed }) => [styles.emptyBtn, { backgroundColor: t.primary }, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Set up a goal"
      >
        <Text style={[styles.emptyBtnText, { color: t.textOnPrimary }]}>Set up a goal</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Font.bold,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 24,
  },
  loadingWrap: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  errorCard: {
    padding: 16,
    borderColor: 'rgba(229, 115, 106, 0.25)',
    borderWidth: 1,
    borderRadius: Radius.card,
  },
  errorText: {
    fontFamily: Font.medium,
    fontSize: 13,
    color: '#E5736A',
    lineHeight: 18,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 14,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 0.8,
    flex: 1,
  },
  statusStrong: {
    fontFamily: Font.bold,
  },
  section: {
    marginBottom: 14,
  },
  adjustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: Radius.cardCompact,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  adjustLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adjustIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustTitle: {
    fontFamily: Font.bold,
    fontSize: 14,
  },
  adjustSub: {
    fontFamily: Font.medium,
    fontSize: 11,
    marginTop: 2,
  },
  helperMicrotype: {
    fontFamily: Font.medium,
    fontSize: 10,
    marginTop: 8,
    paddingHorizontal: 4,
    lineHeight: 14,
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: Radius.card,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: Font.bold,
    fontSize: 16,
  },
  emptySub: {
    fontFamily: Font.medium,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  emptyBtn: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
  },
  emptyBtnText: {
    fontFamily: Font.bold,
    fontSize: 13,
  },
  bottomSpacer: { height: 140 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
