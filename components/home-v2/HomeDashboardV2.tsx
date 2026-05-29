import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import LogMealSheet from '../meal-log/LogMealSheet';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTodayMacros } from '../../hooks/useTodayMacros';
import { useUserGoals } from '../../hooks/useUserGoals';
import { useThisWeekWorkouts } from '../../hooks/useThisWeekWorkouts';
import { useCurrentWeight } from '../../hooks/useCurrentWeight';
import { useSchedule } from '../../hooks/useSchedule';
import {
  getMonday,
  useMealPlanWeek,
} from '../../hooks/useMealPlanWeek';
import type { MealPeriod } from '../../lib/meal-periods';
import type { ScheduleItem } from '../../lib/schedule-store';
import { fmtLocalDate } from '../../lib/date';
import { DS, Motion } from '../../lib/design-system';
import {
  PERIOD_LABELS_UPPER,
  periodFromDate,
} from '../../lib/meal-periods';
import LiveBanner from './LiveBanner';
import CaloriesHeroCard from './CaloriesHeroCard';
import NextUpWorkoutCard from './NextUpWorkoutCard';
import WeekStrip from './WeekStrip';
import StatsGrid from './StatsGrid';
import type { CaloriesBurnedData } from './CaloriesBurnedTile';
import ScheduleCard from './ScheduleCard';
import AddScheduleItemSheet from './AddScheduleItemSheet';
import QuickToolsStrip from './QuickToolsStrip';

// --------------------------------------------------------------------------
// Mocked data structures
//
// Real hooks are wired for: today's macros, daily goals, this week's workout
// count, current bodyweight. Other tiles need new hooks before they read
// real data — clearly mocked here with realistic values per design spec.
// --------------------------------------------------------------------------

// MOCK: next scheduled workout. Future hook: useNextWorkout() reading
// workout_templates + a rotation schedule. For now: a sensible push day.
const MOCK_NEXT_WORKOUT = {
  dayN: 4,
  dayTotal: 5,
  estimatedMinutes: 52,
  title: 'Push · Chest / Triceps',
  exerciseCount: 6,
  workingSets: 22,
  lastLogged: 'Sunday',
  exercises: [
    'Bench',
    'Incline DB',
    'Dips',
    'Cable Fly',
    'Tri Pushdown',
    'Skullcrusher',
  ],
};

// useThisWeekWorkouts now returns real per-day completion flags — see
// `data.completedDays` (Mon=0 … Sun=6).

// MOCK: calories burned across 3 ranges. Future hook:
// useCaloriesBurned(range) reading workouts in the range (will need a
// kcal_burned column on workouts, or computed via MET tables).
const MOCK_BURNED: CaloriesBurnedData = {
  today: {
    value: 612,
    delta: '+8%',
    deltaLabel: 'vs daily avg',
    bars: [0.3, 0.5, 0.7, 0.9, 0.8, 0.6, 1.0],
    activeIndex: 6,
  },
  '7d': {
    value: 4280,
    delta: '+12%',
    deltaLabel: 'vs prior week',
    bars: [0.5, 0.7, 0.4, 0.85, 0.6, 0.9, 0.75],
    activeIndex: 3,
  },
  '30d': {
    value: 18420,
    delta: '+18%',
    deltaLabel: 'vs prior month',
    bars: [0.4, 0.55, 0.7, 0.85],
    activeIndex: 3,
  },
};

// MOCK: weight history. Future: extend useCurrentWeight with history.
const MOCK_WEIGHT_FALLBACK = {
  valueLb: 170.0,
  deltaLb: -2.4,
  days: 30,
  history: [172.4, 172.0, 171.8, 171.5, 171.2, 170.8, 170.4, 170.2, 170.0],
};

const DEFAULT_GOAL = { calories: 2400, protein: 180, carbs: 240, fat: 80 };

export default function HomeDashboardV2() {
  const router = useRouter();
  const now = useMemo(() => new Date(), []);
  const todayYmd = useMemo(() => fmtLocalDate(now), [now]);
  const { data: todayMacros, refetch: refetchTodayMacros } = useTodayMacros();
  const { data: goals } = useUserGoals();
  const { data: thisWeek } = useThisWeekWorkouts();
  const { data: weight } = useCurrentWeight();
  // User-defined schedule — meals, workouts, weigh-ins, anything else for
  // today. Persisted via AsyncStorage; see `lib/schedule-store.ts`.
  const { items: scheduleItems, add: addSchedule, remove: removeSchedule } =
    useSchedule(todayYmd);
  // Pull today's planned meals from the meal planner so the schedule sheet
  // can offer them as quick picks.
  const weekStart = useMemo(() => getMonday(now), [now]);
  const todayDow = useMemo(() => {
    // useMealPlanWeek uses 0=Mon..6=Sun.
    const js = now.getDay();
    return js === 0 ? 6 : js - 1;
  }, [now]);
  const { entries: planEntries } = useMealPlanWeek(weekStart);
  const todaysPlannedMeals = useMemo(
    () => planEntries.filter((e) => e.day_of_week === todayDow),
    [planEntries, todayDow],
  );
  const [scheduleSheetOpen, setScheduleSheetOpen] = useState(false);
  const [logSheetOpen, setLogSheetOpen] = useState(false);
  const [logSheetPrefill, setLogSheetPrefill] = useState<{
    title?: string;
    period?: MealPeriod | null;
    macros?: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    sourceScheduleId?: string;
  }>({});

  function openLogMeal(item?: ScheduleItem) {
    setLogSheetPrefill({
      title: item?.title,
      period: item?.period ?? null,
      macros: item?.macros,
      sourceScheduleId: item?.id,
    });
    setLogSheetOpen(true);
  }

  const targetCalories = goals?.calories ?? DEFAULT_GOAL.calories;
  const targetProtein = goals?.protein ?? DEFAULT_GOAL.protein;
  const targetCarbs = goals?.carbs ?? DEFAULT_GOAL.carbs;
  const targetFat = goals?.fat ?? DEFAULT_GOAL.fat;

  // Real per-day completion flags (Mon=0 … Sun=6), straight from the hook.
  const weekCompleted = thisWeek.completedDays;

  const todayIdx = useMemo(() => {
    const js = now.getDay(); // 0=Sun..6=Sat
    return js === 0 ? 6 : js - 1; // → 0=Mon..6=Sun
  }, [now]);

  const bodyweightTile = useMemo(() => {
    if (weight.current != null && weight.history.length >= 2) {
      const first = weight.history[0];
      const last = weight.history[weight.history.length - 1];
      const delta = +(last - first).toFixed(1);
      return {
        valueLb: weight.current,
        deltaLb: delta,
        days: Math.min(30, weight.history.length * 3),
        history: weight.history,
      };
    }
    if (weight.current != null) {
      return {
        ...MOCK_WEIGHT_FALLBACK,
        valueLb: weight.current,
      };
    }
    return MOCK_WEIGHT_FALLBACK;
  }, [weight]);

  function comingSoon(label: string) {
    Alert.alert(label, 'Coming soon.');
  }

  const macros = [
    {
      key: 'P' as const,
      label: 'Protein',
      value: todayMacros.protein,
      target: targetProtein,
      color: DS.accent,
    },
    {
      key: 'C' as const,
      label: 'Carbs',
      value: todayMacros.carbs,
      target: targetCarbs,
      color: DS.accentLight,
    },
    {
      key: 'F' as const,
      label: 'Fat',
      value: todayMacros.fat,
      target: targetFat,
      color: DS.accentMid,
    },
  ];

  const sections = [
    <LiveBanner
      key="banner"
      period={PERIOD_LABELS_UPPER[periodFromDate(now)]}
      dayCount={89} // MOCK: days since signup
    />,
    <CaloriesHeroCard
      key="calories"
      consumed={todayMacros.calories}
      target={targetCalories}
      macros={macros}
    />,
    <NextUpWorkoutCard
      key="nextup"
      dayN={MOCK_NEXT_WORKOUT.dayN}
      dayTotal={MOCK_NEXT_WORKOUT.dayTotal}
      estimatedMinutes={MOCK_NEXT_WORKOUT.estimatedMinutes}
      title={MOCK_NEXT_WORKOUT.title}
      exerciseCount={MOCK_NEXT_WORKOUT.exerciseCount}
      workingSets={MOCK_NEXT_WORKOUT.workingSets}
      lastLogged={MOCK_NEXT_WORKOUT.lastLogged}
      exercises={MOCK_NEXT_WORKOUT.exercises}
      onStart={() => router.push('/log-workout')}
      onMore={() => comingSoon('Workout options')}
    />,
    <WeekStrip
      key="week"
      completed={weekCompleted}
      todayIndex={todayIdx}
    />,
    <StatsGrid
      key="stats"
      bodyweight={bodyweightTile}
      burned={MOCK_BURNED}
    />,
    <ScheduleCard
      key="schedule"
      items={scheduleItems}
      onAdd={() => setScheduleSheetOpen(true)}
      onLogMeal={openLogMeal}
      onRemove={(id) => {
        void removeSchedule(id);
      }}
    />,
    <QuickToolsStrip key="tools" onToolPress={(key) => comingSoon(key)} />,
  ];

  return (
    <View style={styles.root}>
      {/* Top emerald spine — subtle radial gradient at the top edge. */}
      <LinearGradient
        colors={['rgba(16, 185, 129, 0.08)', 'transparent']}
        style={styles.topSpine}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((node, i) => (
          <Animated.View
            key={i}
            entering={FadeInDown.duration(Motion.durationRise).delay(
              40 + i * Motion.staggerStep,
            )}
            style={i === 0 ? null : styles.stackGap}
          >
            {node}
          </Animated.View>
        ))}

        {/* Bottom spacer so floating nav doesn't cover content */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <AddScheduleItemSheet
        visible={scheduleSheetOpen}
        plannedMeals={todaysPlannedMeals}
        onClose={() => setScheduleSheetOpen(false)}
        onAdd={async (input) => {
          await addSchedule(input);
        }}
      />

      <LogMealSheet
        visible={logSheetOpen}
        initialPeriod={logSheetPrefill.period ?? null}
        initialTitle={logSheetPrefill.title}
        initialMacros={logSheetPrefill.macros}
        plannedMeals={todaysPlannedMeals}
        onClose={() => setLogSheetOpen(false)}
        onLogged={() => {
          // The food_logs row is the new source of truth — the Calories
          // Today hero card on this screen and the Goal Planner's nutrition
          // logger both read from it. Refetch the dashboard totals manually
          // because the sheet sits on top of this screen, so focus events
          // never fire.
          void refetchTodayMacros();
          // If the user logged a meal that was on the schedule, sweep that
          // schedule item so it doesn't sit around as still-pending.
          if (logSheetPrefill.sourceScheduleId) {
            void removeSchedule(logSheetPrefill.sourceScheduleId);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DS.bg,
  },
  topSpine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  scroll: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  stackGap: {
    marginTop: 12,
  },
  bottomSpacer: {
    height: 140, // clears the floating bottom navbar
  },
});
