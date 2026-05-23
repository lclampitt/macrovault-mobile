import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useSubscription } from '../../hooks/useSubscription';
import { useUserGoals } from '../../hooks/useUserGoals';
import {
  addDays,
  fmtLongDay,
  getMonday,
  MEAL_TYPES,
  useMealPlanWeek,
  type MealPlanEntry,
} from '../../hooks/useMealPlanWeek';
import WeekHeader from '../../components/meal-planner/WeekHeader';
import AISuggestWeekButton from '../../components/meal-planner/AISuggestWeekButton';
import WeekSummaryBar from '../../components/meal-planner/WeekSummaryBar';
import DayPillsRow from '../../components/meal-planner/DayPillsRow';
import SelectedDayHeader from '../../components/meal-planner/SelectedDayHeader';
import DayMacroTotals from '../../components/meal-planner/DayMacroTotals';
import MealSection from '../../components/meal-planner/MealSection';
import DayFooterActions from '../../components/meal-planner/DayFooterActions';
import MealPlannerSkeleton from '../../components/meal-planner/MealPlannerSkeleton';
import MealPlannerGate from '../../components/meal-planner/MealPlannerGate';

function dayIndexInWeek(today: Date, monday: Date): number {
  const ms = today.getTime() - monday.getTime();
  const day = Math.floor(ms / (24 * 60 * 60 * 1000));
  return Math.min(Math.max(day, 0), 6);
}

export default function MealsScreen() {
  const { isPro, loading: subLoading } = useSubscription();
  const today = useMemo(() => new Date(), []);
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(today));

  const { entries, loading, error } = useMealPlanWeek(weekStart);
  const { data: goals } = useUserGoals();

  // Selected day defaults to today when the displayed week IS this week, else
  // Monday. Recomputed whenever the user jumps to a different week.
  const initialDay = useMemo(() => {
    const mondayOfToday = getMonday(today);
    if (mondayOfToday.getTime() === weekStart.getTime()) {
      return dayIndexInWeek(today, weekStart);
    }
    return 0;
  }, [weekStart, today]);

  const [selectedDay, setSelectedDay] = useState<number>(initialDay);
  useEffect(() => {
    setSelectedDay(initialDay);
  }, [initialDay]);

  const selectedDate = addDays(weekStart, selectedDay);
  const selectedLabel = fmtLongDay(selectedDate);

  const dayEntries = useMemo(
    () => entries.filter((e) => e.day_of_week === selectedDay),
    [entries, selectedDay],
  );

  const dayTotals = useMemo(
    () =>
      dayEntries.reduce(
        (acc, e) => ({
          calories: acc.calories + e.calories,
          protein: acc.protein + e.protein,
          carbs: acc.carbs + e.carbs,
          fat: acc.fat + e.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      ),
    [dayEntries],
  );

  const weekLoggedKcal = useMemo(
    () => entries.reduce((acc, e) => acc + e.calories, 0),
    [entries],
  );

  function entryFor(meal: (typeof MEAL_TYPES)[number]): MealPlanEntry | null {
    return dayEntries.find((e) => e.meal_type === meal) ?? null;
  }

  function goPrevWeek() {
    setWeekStart((w) => addDays(w, -7));
  }
  function goNextWeek() {
    setWeekStart((w) => addDays(w, 7));
  }

  if (subLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <MealPlannerSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!isPro) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <MealPlannerGate />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <WeekHeader
          weekStart={weekStart}
          onPrevWeek={goPrevWeek}
          onNextWeek={goNextWeek}
        />
        <AISuggestWeekButton />
        <WeekSummaryBar
          weekStart={weekStart}
          loggedKcal={weekLoggedKcal}
          goalKcalPerDay={goals?.calories ?? null}
        />
        <DayPillsRow
          weekStart={weekStart}
          entries={entries}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
        />

        {loading ? (
          <View style={styles.loadingWrap}>
            <MealPlannerSkeleton />
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>
              Couldn&apos;t load this week. {error}
            </Text>
          </View>
        ) : (
          <>
            <SelectedDayHeader dateLabel={selectedLabel} />
            <DayMacroTotals
              totals={dayTotals}
              goalKcal={goals?.calories ?? null}
            />
            {MEAL_TYPES.map((meal) => (
              <MealSection key={meal} mealType={meal} entry={entryFor(meal)} />
            ))}
            <DayFooterActions />
          </>
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
    paddingTop: 8,
    paddingBottom: 140,
    gap: 12,
  },
  loadingWrap: {
    marginTop: 12,
  },
  errorCard: {
    marginTop: 18,
    backgroundColor: Colors.errorBg,
    borderColor: Colors.errorBorder,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
  },
});
