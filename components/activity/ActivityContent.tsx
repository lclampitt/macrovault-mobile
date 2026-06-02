import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Dumbbell, Flame, Layers } from 'lucide-react-native';
import { Font, Motion, Radius, Tabular } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import {
  useActivityData,
  type DayCategory,
  type DayState,
} from '../../hooks/useActivityData';
import ActivityHeader, { type ActivityView } from './ActivityHeader';
import YearHeatmap from './YearHeatmap';
import MonthCalendar from './MonthCalendar';
import ActivityTooltip from './ActivityTooltip';
import ActivityLegend from './ActivityLegend';
import { ActivityGridSkeleton } from './ActivitySkeletons';
import type { CellAnchor } from './ActivityCell';

const MONTH_LABELS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type Selected = { dateStr: string; state: DayState; anchor: CellAnchor } | null;

/**
 * Body of the Activity feature, with NO SafeAreaView, scroll wrapper, or
 * back-button header — just the stat pills, calendar, legend, and muscle
 * split. This shape lets the same component mount both as:
 *
 *   • the embedded body of the Stats > Activity sub-tab (no chrome)
 *   • the body of /activity for backward-compat deep links (wrapped in
 *     SafeAreaView + back button by the route)
 *
 * Layout matches `app/activity.tsx` exactly — only the outermost
 * SafeAreaView + back header have been peeled off here.
 */
export default function ActivityContent() {
  const t = useTokens();
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

  function handleCellPress(
    dateStr: string,
    category: DayCategory,
    anchor: CellAnchor,
  ) {
    const state: DayState =
      byDate[dateStr] ?? { workouts: [], meals: [], totalCalories: 0, category };
    setSelected({ dateStr, state, anchor });
  }

  return (
    <View style={styles.wrap}>
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
        // No-op — the embed and the route both render their own back
        // affordance (the route's chevron, Stats' sub-tab toggle).
        onBack={() => {}}
      />

      <View style={[styles.card, { backgroundColor: t.bgCard, borderColor: t.borderDefault }]}>
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
            <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>No activity yet.</Text>
            <Text style={[styles.emptySub, { color: t.textTertiary }]}>
              Start logging meals or workouts to see your patterns here.
            </Text>
          </View>
        ) : null}
      </View>

      {!isEmpty && !loading && !error ? <ActivityLegend /> : null}

      {/* Muscle split — real data from logged workouts (last 30 days). */}
      <Animated.View
        entering={FadeInDown.duration(Motion.durationRise).delay(80)}
        style={[styles.muscleCard, { backgroundColor: t.bgCard, borderColor: t.borderDefault }]}
      >
        <View style={styles.muscleHeader}>
          <Text style={[styles.muscleHeaderLabel, { color: t.textTertiary }]}>MUSCLE SPLIT</Text>
          <Text style={[styles.muscleHeaderMeta, { color: t.textQuaternary }]}>Last 30 days</Text>
        </View>
        {muscleSplit.length === 0 ? (
          <Text style={[styles.muscleEmpty, { color: t.textTertiary }]}>
            No workouts logged in the last 30 days yet.
          </Text>
        ) : (
          muscleSplit.map((m) => (
            <View key={m.key} style={styles.muscleRow}>
              <Text style={[styles.muscleLabel, { color: t.textPrimary }]}>{m.label}</Text>
              <View
                style={[
                  styles.muscleBarTrack,
                  { backgroundColor: t.bgPage, borderColor: t.borderDefault },
                ]}
              >
                <View
                  style={[
                    styles.muscleBarFill,
                    { backgroundColor: t.primary, width: `${Math.round(m.pct * 100)}%` },
                  ]}
                />
              </View>
              <Text style={[styles.muscleValue, Tabular, { color: t.textPrimary }]}>{m.count}</Text>
            </View>
          ))
        )}
      </Animated.View>

      {selected ? (
        <ActivityTooltip
          dateStr={selected.dateStr}
          state={selected.state}
          anchor={selected.anchor}
          onDismiss={() => setSelected(null)}
        />
      ) : null}
    </View>
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
  const t = useTokens();
  return (
    <View style={[styles.statPill, { backgroundColor: t.bgCard, borderColor: t.borderDefault }]}>
      <View
        style={[
          styles.statPillIcon,
          { backgroundColor: t.primaryTintBg, borderColor: t.primaryTintBorder },
        ]}
      >
        <Icon size={12} color={t.primary} strokeWidth={2} />
      </View>
      <View>
        <Text style={[styles.statPillValue, Tabular, { color: t.textPrimary }]}>{value}</Text>
        <Text style={[styles.statPillLabel, { color: t.textTertiary }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: Radius.card,
  },
  statPillIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statPillValue: {
    fontFamily: Font.bold,
    fontSize: 15,
    letterSpacing: -0.3,
  },
  statPillLabel: {
    fontFamily: Font.bold,
    fontSize: 8,
    letterSpacing: 0.6,
    marginTop: 1,
  },
  card: {
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
  empty: { alignItems: 'center', paddingVertical: 28, gap: 6 },
  emptyTitle: { fontFamily: Font.bold, fontSize: 14 },
  emptySub: {
    fontFamily: Font.medium,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  muscleCard: {
    padding: 16,
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
    letterSpacing: 0.8,
  },
  muscleHeaderMeta: {
    fontFamily: Font.medium,
    fontSize: 10,
  },
  muscleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  muscleLabel: {
    fontFamily: Font.semibold,
    fontSize: 12,
    width: 70,
  },
  muscleBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    overflow: 'hidden',
  },
  muscleBarFill: { height: '100%' },
  muscleValue: {
    fontFamily: Font.bold,
    fontSize: 12,
    width: 28,
    textAlign: 'right',
  },
  muscleEmpty: {
    fontFamily: Font.medium,
    fontSize: 12,
    paddingVertical: 8,
    textAlign: 'center',
  },
});
