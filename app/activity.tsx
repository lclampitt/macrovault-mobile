import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { useActivityData, type DayCategory, type DayState } from '../hooks/useActivityData';
import ActivityHeader, { type ActivityView } from '../components/activity/ActivityHeader';
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

type Selected = { dateStr: string; state: DayState; anchor: CellAnchor } | null;

export default function ActivityScreen() {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);

  const [view, setView] = useState<ActivityView>('year');
  const [year, setYear] = useState(today.getFullYear());
  const [displayedMonth, setDisplayedMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState<Selected>(null);

  const { byDate, stats, loading, error } = useActivityData(year);

  const isCurrentYear = year === today.getFullYear();
  const isCurrentMonth = isCurrentYear && displayedMonth === today.getMonth();
  const monthLabel = `${MONTH_LABELS_FULL[displayedMonth]} ${year}`;

  // Month-scoped stats derived from the same yearly dataset (matches web).
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
            <Text style={styles.errorText}>Failed to load activity. {error}</Text>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120, // clearance for the floating bottom navbar
  },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  errorText: {
    color: Colors.error,
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
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  emptySub: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
