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
import { useMealPlannerAI } from '../../hooks/useMealPlannerAI';
import { useActiveGoal } from '../../hooks/useActiveGoal';
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
  type SlotAIContext,
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
  const { goal: activeGoal } = useActiveGoal();
  const {
    saving,
    deletingId,
    clearing,
    getOrCreatePlanId,
    addOrReplace,
    deleteEntry,
    clearWeek,
    replaceWeek,
  } = useMealPlanMutations();
  const { favoriteNameMap, toggleFavorite } = useSavedMeals();
  const { loggedDays, busyDay, toggleLogDay, refetch: refetchLog } =
    useLogDayToMacros(weekStart, entries);
  const {
    loadingWeek,
    weekProgress,
    suggestFullWeek,
  } = useMealPlannerAI();

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
  // -------- Confirm-replace-week (AI suggest week) state --------
  const [confirmReplaceWeek, setConfirmReplaceWeek] = useState(false);
  const [aiWeekError, setAiWeekError] = useState<string | null>(null);

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

  // -------- AI context for the swap modal's AI Suggest tab --------
  // "Remaining" = day's macro target minus what's already planned for that
  // day, excluding the slot being swapped. Falls back to 1/3 of the daily
  // target if there are no goals yet.
  const aiContext: SlotAIContext | null = useMemo(() => {
    if (!swapSlot) return null;
    const goalCals = goals?.calories ?? 2000;
    const goalProtein = goals?.protein ?? 150;
    const goalCarbs = goals?.carbs ?? 250;
    const goalFat = goals?.fat ?? 65;
    const otherSlotsForDay = dayEntries.filter(
      (e) => e.meal_type !== swapSlot.meal_type,
    );
    const usedCals = otherSlotsForDay.reduce((s, e) => s + e.calories, 0);
    const usedProtein = otherSlotsForDay.reduce((s, e) => s + e.protein, 0);
    const usedCarbs = otherSlotsForDay.reduce((s, e) => s + e.carbs, 0);
    const usedFat = otherSlotsForDay.reduce((s, e) => s + e.fat, 0);
    const remaining = {
      calories: Math.max(50, goalCals - usedCals),
      protein: Math.max(5, goalProtein - usedProtein),
      carbs: Math.max(5, goalCarbs - usedCarbs),
      fat: Math.max(5, goalFat - usedFat),
    };
    const goal =
      activeGoal?.phaseType ?? 'maintenance'; // 'cutting' | 'bulking' | 'maintenance'
    return { remaining, goal };
  }, [swapSlot, dayEntries, goals, activeGoal]);

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

  // -------- AI Suggest Week orchestration --------
  function handleAISuggestWeekTap() {
    setAiWeekError(null);
    if (entries.length > 0) {
      setConfirmReplaceWeek(true);
    } else {
      runAISuggestWeek();
    }
  }

  async function runAISuggestWeek() {
    setConfirmReplaceWeek(false);
    setAiWeekError(null);
    const pid = planId ?? (await getOrCreatePlanId(weekStart));
    if (!pid) {
      setAiWeekError('Could not create this week’s plan.');
      return;
    }
    const dailyTargets = {
      calories: goals?.calories ?? 2000,
      protein: goals?.protein ?? 150,
      carbs: goals?.carbs ?? 250,
      fat: goals?.fat ?? 65,
    };
    const goal = activeGoal?.phaseType ?? 'maintenance';
    const result = await suggestFullWeek({
      goal,
      dietPreference: 'standard',
      dailyTargets,
    });
    if (!result.entries || result.entries.length === 0) {
      setAiWeekError(result.error ?? 'AI returned no entries.');
      return;
    }
    const writeRes = await replaceWeek(
      pid,
      weekStart,
      result.entries.map((e) => ({
        day_of_week: e.day_of_week,
        meal_type: e.meal_type,
        meal_name: e.meal_name,
        ingredients: e.ingredients || null,
        calories: Math.round(e.calories),
        protein: Math.round(e.protein * 10) / 10,
        carbs: Math.round(e.carbs * 10) / 10,
        fat: Math.round(e.fat * 10) / 10,
      })),
    );
    if (writeRes.error) {
      setAiWeekError(writeRes.error);
      return;
    }
    if (result.error) {
      // Partial success — wrote what we got but a later /suggest call failed.
      setAiWeekError(
        `Saved ${result.entries.length} meals. ${result.error}`,
      );
    }
    await refetch();
    await refetchLog();
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
        <AISuggestWeekButton
          loading={loadingWeek}
          progress={weekProgress}
          onPress={handleAISuggestWeekTap}
        />
        {aiWeekError ? (
          <View style={styles.aiErrorCard}>
            <Text style={styles.aiErrorText}>{aiWeekError}</Text>
          </View>
        ) : null}
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
        aiContext={aiContext}
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

      <DeleteConfirmModal
        visible={confirmReplaceWeek}
        title="Replace this week's plan?"
        message="AI Suggest Week will wipe every meal currently on this week and replace it with a fresh AI-generated plan. This can't be undone."
        confirmLabel="Generate"
        loading={loadingWeek}
        onCancel={() => setConfirmReplaceWeek(false)}
        onConfirm={runAISuggestWeek}
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
  aiErrorCard: {
    backgroundColor: Colors.errorBg,
    borderColor: Colors.errorBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  aiErrorText: {
    color: Colors.error,
    fontSize: 12,
    lineHeight: 17,
  },
});
