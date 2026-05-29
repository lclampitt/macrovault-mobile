import { useMemo, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Edit3,
  Flame,
  Target,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react-native';
import { DS, Font, Motion, Radius, Tabular } from '../lib/design-system';
import { useActiveGoal, type PhaseType } from '../hooks/useActiveGoal';
import GoalTimelineCard from '../components/goal-planner/GoalTimelineCard';
import MacroTargetsCard from '../components/goal-planner/MacroTargetsCard';
import LogNutritionCard from '../components/goal-planner/LogNutritionCard';
import GoalEditorModal from '../components/goal-planner/GoalEditorModal';

const PHASE_META: Record<PhaseType, { label: string; tagline: string; Icon: LucideIcon }> = {
  cutting: { label: 'Cut', tagline: 'Calorie deficit', Icon: TrendingDown },
  maintenance: { label: 'Maintain', tagline: 'Hold the line', Icon: Target },
  bulking: { label: 'Bulk', tagline: 'Calorie surplus', Icon: TrendingUp },
};

export default function GoalPlannerScreen() {
  const router = useRouter();
  const { goal, loading, error, refetch } = useActiveGoal();
  const [editorOpen, setEditorOpen] = useState(false);

  function handleBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  const phase = goal?.phaseType ?? 'maintenance';
  const meta = PHASE_META[phase];
  const PhaseIcon = meta.Icon;

  const progressLabel = useMemo(() => {
    if (!goal || !goal.hasTimeframe) return null;
    return `Week ${goal.weekNumber} of ${goal.timeframeWeeks}`;
  }, [goal]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <LinearGradient
        colors={['rgba(16, 185, 129, 0.10)', 'transparent']}
        style={styles.topSpine}
        pointerEvents="none"
      />

      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          hitSlop={10}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeft size={18} color={DS.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Goal Planner</Text>
        <Pressable
          onPress={() => setEditorOpen(true)}
          hitSlop={10}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Edit goal"
        >
          <Edit3 size={16} color={DS.accent} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={DS.accent} />
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>
              Couldn't load your goal. {error}
            </Text>
          </View>
        ) : !goal ? (
          <EmptyGoal onSetUp={() => setEditorOpen(true)} />
        ) : (
          <>
            <Animated.View
              entering={FadeInDown.duration(Motion.durationRise)}
              style={styles.heroOuter}
            >
              <View style={styles.heroCard}>
                <View style={styles.heroHeader}>
                  <View style={styles.heroIcon}>
                    <PhaseIcon size={16} color={DS.accent} strokeWidth={2.5} />
                  </View>
                  <View>
                    <Text style={styles.heroLabel}>PRIMARY GOAL</Text>
                    <Text style={styles.heroTitle}>{meta.label}</Text>
                  </View>
                </View>
                <Text style={styles.heroTagline}>{meta.tagline}</Text>

                <View style={styles.heroMacroRow}>
                  <HeroStat
                    label="DAILY KCAL"
                    value={goal.calories.toLocaleString()}
                  />
                  <View style={styles.heroDivider} />
                  <HeroStat
                    label="PROTEIN"
                    value={`${goal.protein}g`}
                  />
                  <View style={styles.heroDivider} />
                  <HeroStat
                    label="CARBS"
                    value={`${goal.carbs}g`}
                  />
                  <View style={styles.heroDivider} />
                  <HeroStat label="FAT" value={`${goal.fat}g`} />
                </View>

                {progressLabel ? (
                  <View style={styles.heroFooterRow}>
                    <Flame size={11} color={DS.accent} strokeWidth={2} />
                    <Text style={styles.heroFooterText}>
                      {progressLabel} · {goal.daysLeft} days left
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.heroFooterLight}>
                    No timeframe yet — tap edit to set one.
                  </Text>
                )}

                {/* NOTE: Phase coloring (red for cut, blue for bulk) is on the
                    roadmap — for now we stay emerald-on-black to keep the rest
                    of the deltas in the app consistent. The phase type is
                    exposed via `useActiveGoal().phaseType` for any caller
                    that wants to color a delta. */}
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.duration(Motion.durationRise).delay(40)}
            >
              {goal.hasTimeframe ? <GoalTimelineCard goal={goal} /> : null}
            </Animated.View>

            <Animated.View
              entering={FadeInDown.duration(Motion.durationRise).delay(80)}
            >
              <MacroTargetsCard goal={goal} />
            </Animated.View>
          </>
        )}

        <Animated.View
          entering={FadeInDown.duration(Motion.durationRise).delay(120)}
          style={styles.loggerWrap}
        >
          <LogNutritionCard />
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <GoalEditorModal
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

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.heroStat}>
      <Text style={[styles.heroStatValue, Tabular]}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

function EmptyGoal({ onSetUp }: { onSetUp: () => void }) {
  return (
    <View style={styles.emptyCard}>
      <Target size={36} color={DS.accent} strokeWidth={2} />
      <Text style={styles.emptyTitle}>No goal set yet</Text>
      <Text style={styles.emptySub}>
        Pick a phase, set a calorie target, and we'll track week-over-week
        progress for you.
      </Text>
      <Pressable
        onPress={onSetUp}
        style={({ pressed }) => [
          styles.emptyBtn,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Set up a goal"
      >
        <Text style={styles.emptyBtnText}>Set up a goal</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: DS.bg },
  topSpine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Font.bold,
    fontSize: 16,
    color: DS.text,
    letterSpacing: -0.2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
  },
  loadingWrap: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  errorCard: {
    padding: 16,
    backgroundColor: DS.surface,
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
  heroOuter: {
    marginBottom: 14,
  },
  heroCard: {
    backgroundColor: DS.surface,
    borderColor: DS.accentBorder,
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: 16,
    gap: 12,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: DS.accentSoft,
    borderColor: DS.accentBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    fontFamily: Font.bold,
    fontSize: 9,
    color: DS.textTertiary,
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontFamily: Font.extrabold,
    fontSize: 22,
    color: DS.text,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  heroTagline: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.textTertiary,
  },
  heroMacroRow: {
    flexDirection: 'row',
    backgroundColor: DS.bg,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
  heroStat: { flex: 1, alignItems: 'center', gap: 3 },
  heroDivider: {
    width: 1,
    backgroundColor: DS.border,
  },
  heroStatValue: {
    fontFamily: Font.bold,
    fontSize: 15,
    color: DS.text,
  },
  heroStatLabel: {
    fontFamily: Font.bold,
    fontSize: 9,
    color: DS.textTertiary,
    letterSpacing: 0.6,
  },
  heroFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroFooterText: {
    fontFamily: Font.bold,
    fontSize: 11,
    color: DS.accent,
    letterSpacing: 0.2,
  },
  heroFooterLight: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DS.textTertiary,
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
    gap: 10,
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: Radius.card,
  },
  emptyTitle: {
    fontFamily: Font.bold,
    fontSize: 16,
    color: DS.text,
  },
  emptySub: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.textTertiary,
    textAlign: 'center',
    lineHeight: 17,
  },
  emptyBtn: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 12,
    backgroundColor: DS.accent,
  },
  emptyBtnText: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: '#000',
  },
  loggerWrap: {
    marginTop: 14,
  },
  bottomSpacer: { height: 140 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
