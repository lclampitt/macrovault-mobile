import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { ChevronLeft, Dumbbell, Flame, Layers } from 'lucide-react-native';
import { DS, Font, Motion, Radius, Tabular } from '../lib/design-system';
import {
  useActivityData,
  type DayCategory,
  type DayState,
} from '../hooks/useActivityData';
import ActivityHeader, {
  type ActivityView,
} from '../components/activity/ActivityHeader';
import YearHeatmap from '../components/activity/YearHeatmap';
import MonthCalendar from '../components/activity/MonthCalendar';
import ActivityTooltip from '../components/activity/ActivityTooltip';
import ActivityLegend from '../components/activity/ActivityLegend';
import { ActivityGridSkeleton } from '../components/activity/ActivitySkeletons';
import type { CellAnchor } from '../components/activity/ActivityCell';

const MONTH_LABELS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Muscle-split is computed in `useActivityData` from the user's logged
// workouts (last 30 days). Each exercise instance gets bucketed by body part
// via the static catalog lookup in `lib/exercises.ts`. Custom exercises that
// aren't in the catalog land in "Other".

type Selected = { dateStr: string; state: DayState; anchor: CellAnchor } | null;

export default function ActivityScreen() {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);

  const [view, setView] = useState<ActivityView>('year');
  const [year, setYear] = useState(today.getFullYear());
  const [displayedMonth, setDisplayedMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<Selected>(null);

  const { byDate, stats, muscleSplit, loading, error } = useActivityData(year);

  const isCurrentYear = year === today.getFullYear();
  const isCurrentMonth = isCurrentYear && displayedMonth === today.getMonth();
  const monthLabel = `${MONTH_LABELS_FULL[displayedMonth]} ${year}`;

  const monthStats = useMemo(() => {
    const prefix = `${year}-${String(displayedMonth + 1).padStart(2, '0')}-`;
    let daysLogged = 0;
    let workouts = 0;
    Object.entries(byDate).forEach(([k, v]) => {
      if (!k.startsWith(prefix)) return;
      if (v.category !== 'none') daysLogged++;
      workouts += v.workouts.length;
    });
    return { daysLogged, workouts };
  }, [byDate, year, displayedMonth]);

  const shownDaysLogged = view === 'year' ? stats.daysLogged : monthStats.daysLogged;
  const shownWorkouts = view === 'year' ? stats.workouts : monthStats.workouts;
  const isEmpty = !loading && !error && Object.keys(byDate).length === 0;

  function handleBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  function goPrev() {
    setSelected(null);
    if (view === 'year') {
      setYear((y) => y - 1);
    } else if (displayedMonth === 0) {
      setYear((y) => y - 1);
      setDisplayedMonth(11);
    } else {
      setDisplayedMonth((m) => m - 1);
    }
  }

  function goNext() {
    setSelected(null);
    if (view === 'year') {
      if (year >= today.getFullYear()) return;
      setYear((y) => y + 1);
    } else if (isCurrentMonth) {
      return;
    } else if (displayedMonth === 11) {
      setYear((y) => y + 1);
      setDisplayedMonth(0);
    } else {
      setDisplayedMonth((m) => m + 1);
    }
  }

  function handleCellPress(dateStr: string, category: DayCategory, anchor: CellAnchor) {
    const state: DayState =
      byDate[dateStr] ?? { workouts: [], meals: [], totalCalories: 0, category };
    setSelected({ dateStr, state, anchor });
  }

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
        <Text style={styles.headerTitle}>Activity</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary stats strip */}
        <Animated.View
          entering={FadeInDown.duration(Motion.durationRise)}
          style={styles.statsRow}
        >
          <StatPill
            label="DAYS LOGGED"
            value={String(shownDaysLogged)}
            Icon={Flame}
          />
          <StatPill
            label="WORKOUTS"
            value={String(shownWorkouts)}
            Icon={Dumbbell}
          />
          <StatPill
            label="STREAK"
            value={String(stats.currentStreak)}
            Icon={Layers}
          />
        </Animated.View>

        <ActivityHeader
          view={view}
          onViewChange={(v) => {
            setSelected(null);
            setView(v);
          }}
          year={year}
          monthLabel={monthLabel}
          isCurrentYear={isCurrentYear}
          isCurrentMonth={isCurrentMonth}
          daysLogged={shownDaysLogged}
          workouts={shownWorkouts}
          currentStreak={stats.currentStreak}
          onPrev={goPrev}
          onNext={goNext}
          onBack={handleBack}
        />

        <View style={styles.card}>
          {loading ? (
            <ActivityGridSkeleton />
          ) : error ? (
            <Text style={styles.errorText}>
              Failed to load activity. {error}
            </Text>
          ) : view === 'year' ? (
            <YearHeatmap
              byDate={byDate}
              year={year}
              today={today}
              onCellPress={handleCellPress}
            />
          ) : (
            <MonthCalendar
              byDate={byDate}
              year={year}
              month={displayedMonth}
              today={today}
              onCellPress={handleCellPress}
            />
          )}

          {isEmpty ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No activity yet.</Text>
              <Text style={styles.emptySub}>
                Start logging meals or workouts to see your patterns here.
              </Text>
            </View>
          ) : null}
        </View>

        {!isEmpty && !loading && !error ? <ActivityLegend /> : null}

        {/* Muscle split — real data from logged workouts (last 30 days). */}
        <Animated.View
          entering={FadeInDown.duration(Motion.durationRise).delay(80)}
          style={styles.muscleCard}
        >
          <View style={styles.muscleHeader}>
            <Text style={styles.muscleHeaderLabel}>MUSCLE SPLIT</Text>
            <Text style={styles.muscleHeaderMeta}>Last 30 days</Text>
          </View>
          {muscleSplit.length === 0 ? (
            <Text style={styles.muscleEmpty}>
              No workouts logged in the last 30 days yet.
            </Text>
          ) : (
            muscleSplit.map((m) => (
              <View key={m.key} style={styles.muscleRow}>
                <Text style={styles.muscleLabel}>{m.label}</Text>
                <View style={styles.muscleBarTrack}>
                  <View
                    style={[
                      styles.muscleBarFill,
                      { width: `${Math.round(m.pct * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={[styles.muscleValue, Tabular]}>{m.count}</Text>
              </View>
            ))
          )}
        </Animated.View>
      </ScrollView>

      {selected ? (
        <ActivityTooltip
          dateStr={selected.dateStr}
          state={selected.state}
          anchor={selected.anchor}
          onDismiss={() => setSelected(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

function StatPill({
  label,
  value,
  Icon,
}: {
  label: string;
  value: string;
  Icon: typeof Flame;
}) {
  return (
    <View style={styles.statPill}>
      <View style={styles.statPillIcon}>
        <Icon size={12} color={DS.accent} strokeWidth={2} />
      </View>
      <View>
        <Text style={[styles.statPillValue, Tabular]}>{value}</Text>
        <Text style={styles.statPillLabel}>{label}</Text>
      </View>
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
    paddingBottom: 140,
    gap: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: Radius.card,
  },
  statPillIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: DS.accentSoft,
    borderColor: DS.accentBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statPillValue: {
    fontFamily: Font.bold,
    fontSize: 15,
    color: DS.text,
    letterSpacing: -0.3,
  },
  statPillLabel: {
    fontFamily: Font.bold,
    fontSize: 8,
    color: DS.textTertiary,
    letterSpacing: 0.6,
    marginTop: 1,
  },
  card: {
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: 16,
  },
  errorText: {
    fontFamily: Font.medium,
    color: '#E5736A',
    fontSize: 13,
    paddingVertical: 24,
    textAlign: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 6,
  },
  emptyTitle: {
    fontFamily: Font.bold,
    color: DS.text,
    fontSize: 14,
  },
  emptySub: {
    fontFamily: Font.medium,
    color: DS.textTertiary,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  muscleCard: {
    padding: 16,
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: Radius.card,
    gap: 8,
  },
  muscleHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  muscleHeaderLabel: {
    fontFamily: Font.bold,
    fontSize: 10,
    color: DS.textTertiary,
    letterSpacing: 0.8,
  },
  muscleHeaderMeta: {
    fontFamily: Font.medium,
    fontSize: 10,
    color: DS.textQuaternary,
  },
  muscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  muscleLabel: {
    fontFamily: Font.semibold,
    fontSize: 12,
    color: DS.text,
    width: 70,
  },
  muscleBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: DS.bg,
    borderWidth: 1,
    borderColor: DS.border,
    overflow: 'hidden',
  },
  muscleBarFill: {
    height: '100%',
    backgroundColor: DS.accent,
  },
  muscleValue: {
    fontFamily: Font.bold,
    fontSize: 12,
    color: DS.text,
    width: 28,
    textAlign: 'right',
  },
  muscleEmpty: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.textTertiary,
    paddingVertical: 8,
    textAlign: 'center',
  },
});
