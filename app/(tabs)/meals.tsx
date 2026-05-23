import { useCallback, useEffect, useMemo, useState } from 'react';
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
  type MealType,
} from '../../hooks/useMealPlanWeek';
import { useMealPlanMutations } from '../../hooks/useMealPlanMutations';
import { useSavedMeals } from '../../hooks/useSavedMeals';
import { useLogDayToMacros } from '../../hooks/useLogDayToMacros';
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
import SwapMealModal, {
  type SwapSlot,
} from '../../components/meal-planner/SwapMealModal';
import DeleteConfirmModal from '../../components/progress/DeleteConfirmModal';

function dayIndexInWeek(today: Date, monday: Date): number {
  const ms = today.getTime() - monday.getTime();
  const day = Math.floor(ms / (24 * 60 * 60 * 1000));
  return Math.min(Math.max(day, 0), 6);
}

function fmtShortDay(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function nameKey(s: string): string {
  return (s || '').trim().toLowerCase();
}

export default function MealsScreen() {
  const { isPro, loading: subLoading } = useSubscription();
  const today = useMemo(() => new Date(), []);
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(today));

  const { entries, planId, loading, error, refetch } = useMealPlanWeek(weekStart);
  const { data: goals } = useUserGoals();
  const {
    saving,
    deletingId,
    clearing,
    getOrCreatePlanId,
    addOrReplace,
    deleteEntry,
    clearWeek,
  } = useMealPlanMutations();
  const { favoriteNameMap, toggleFavorite } = useSavedMeals();
  const { loggedDays, busyDay, toggleLogDay, refetch: refetchLog } =
    useLogDayToMacros(weekStart, entries);

  // Selected day defaults to today when viewing this week, else Monday.
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

  // -------- Swap modal state --------
  const [swapSlot, setSwapSlot] = useState<SwapSlot | null>(null);
  const swapVisible = swapSlot !== null;

  const openSwap = useCallback(
    (dayIdx: number, mealType: MealType) => {
      setSwapSlot({
        day_of_week: dayIdx,
        meal_type: mealType,
        dateLabel: fmtShortDay(addDays(weekStart, dayIdx)),
      });
    },
    [weekStart],
  );
  const closeSwap = useCallback(() => setSwapSlot(null), []);

  // -------- Confirm-clear modal state --------
  const [confirmClear, setConfirmClear] = useState(false);

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

  function entryFor(meal: MealType): MealPlanEntry | null {
    return dayEntries.find((e) => e.meal_type === meal) ?? null;
  }

  function goPrevWeek() {
    setWeekStart((w) => addDays(w, -7));
  }
  function goNextWeek() {
    setWeekStart((w) => addDays(w, 7));
  }

  // -------- Handlers wired into the children --------
  async function handleAddMeal(meal: Parameters<typeof addOrReplace>[0]['meal']) {
    if (!swapSlot) return;
    const pid = planId ?? (await getOrCreatePlanId(weekStart));
    if (!pid) return;
    const existing = entries.find(
      (e) =>
        e.day_of_week === swapSlot.day_of_week &&
        e.meal_type === swapSlot.meal_type,
    ) ?? null;
    const result = await addOrReplace({
      planId: pid,
      day_of_week: swapSlot.day_of_week,
      meal_type: swapSlot.meal_type,
      weekStart,
      meal,
      existingEntry: existing,
    });
    if (!result.error) {
      closeSwap();
      await refetch();
      await refetchLog();
    }
  }

  async function handleDelete(entry: MealPlanEntry) {
    const r = await deleteEntry(entry, weekStart);
    if (!r.error) {
      await refetch();
      await refetchLog();
    }
  }

  async function handleToggleFavorite(entry: MealPlanEntry) {
    await toggleFavorite({
      meal_name: entry.meal_name,
      ingredients: entry.ingredients,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
    });
  }

  async function handleLogDay() {
    await toggleLogDay(selectedDay, dayEntries);
  }

  async function handleClearWeek() {
    if (!planId) {
      setConfirmClear(false);
      return;
    }
    const r = await clearWeek(planId, weekStart);
    setConfirmClear(false);
    if (!r.error) {
      await refetch();
      await refetchLog();
    }
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
        keyboardShouldPersistTaps="handled"
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
            <SelectedDayHeader
              dateLabel={selectedLabel}
              isLogged={loggedDays.has(selectedDay)}
              busy={busyDay === selectedDay}
              onToggleLogDay={handleLogDay}
            />
            <DayMacroTotals
              totals={dayTotals}
              goalKcal={goals?.calories ?? null}
            />
            {MEAL_TYPES.map((meal) => {
              const e = entryFor(meal);
              return (
                <MealSection
                  key={meal}
                  mealType={meal}
                  entry={e}
                  isFavorite={e ? !!favoriteNameMap[nameKey(e.meal_name)] : false}
                  deleting={!!e && deletingId === e.id}
                  onOpenSwap={(mt) => openSwap(selectedDay, mt)}
                  onToggleFavorite={handleToggleFavorite}
                  onDelete={handleDelete}
                />
              );
            })}
            <DayFooterActions
              hasEntries={entries.length > 0}
              clearing={clearing}
              onClearWeek={() => setConfirmClear(true)}
            />
          </>
        )}
      </ScrollView>

      <SwapMealModal
        visible={swapVisible}
        slot={swapSlot}
        saving={saving}
        onClose={closeSwap}
        onAdd={handleAddMeal}
      />

      <DeleteConfirmModal
        visible={confirmClear}
        title="Clear week?"
        message="This removes every meal from this week's plan and unlogs any planner-logged days. This can't be undone."
        confirmLabel="Clear week"
        loading={clearing}
        onCancel={() => setConfirmClear(false)}
        onConfirm={handleClearWeek}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 130,
    gap: 10,
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
