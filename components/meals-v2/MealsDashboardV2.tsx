import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { DS, Font, Motion } from '../../lib/design-system';
import { fmtLocalDate } from '../../lib/date';
import {
  addDays,
  DAY_LABELS,
  getMonday,
  useMealPlanWeek,
  type MealPlanEntry,
  type MealType,
} from '../../hooks/useMealPlanWeek';
import { useMealPlanMutations } from '../../hooks/useMealPlanMutations';
import { useSavedMeals } from '../../hooks/useSavedMeals';
import { useUserGoals } from '../../hooks/useUserGoals';
import { useMealPlannerAI } from '../../hooks/useMealPlannerAI';
import { useActiveGoal } from '../../hooks/useActiveGoal';
import {
  periodFromDate,
  periodFromMealType,
  type MealPeriod,
} from '../../lib/meal-periods';
import LogMealSheet from '../meal-log/LogMealSheet';

import WeekNavigator from './WeekNavigator';
import AISuggestWeekBanner from './AISuggestWeekBanner';
import DayStrip, { type DayCell } from './DayStrip';
import DayHeader from './DayHeader';
import DayTotalsCard from './DayTotalsCard';
import MealCard from './MealCard';
import EmptyMealSlot from './EmptyMealSlot';
import AnythingElseFooter from './AnythingElseFooter';
import SwapMealModal, {
  type SlotAIContext,
  type SwapSlot,
} from '../meal-planner/SwapMealModal';
import DeleteConfirmModal from '../progress/DeleteConfirmModal';

const DEFAULT_TARGETS = { calories: 2230, protein: 165, carbs: 220, fat: 70 };

const SLOTS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function sumMacros(entries: MealPlanEntry[]) {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

function dayIndexInWeek(date: Date, monday: Date): number {
  const ms = date.getTime() - monday.getTime();
  const day = Math.floor(ms / (24 * 60 * 60 * 1000));
  return Math.min(Math.max(day, 0), 6);
}

function fmtFullDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function fmtShortDay(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function relativeLabel(selected: Date, today: Date): string {
  const a = new Date(selected);
  a.setHours(0, 0, 0, 0);
  const b = new Date(today);
  b.setHours(0, 0, 0, 0);
  const diffDays = Math.round((a.getTime() - b.getTime()) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays > 1 && diffDays <= 6)
    return selected.toLocaleDateString('en-US', { weekday: 'long' });
  if (diffDays < -1 && diffDays >= -6)
    return `Logged ${Math.abs(diffDays)} days ago`;
  return selected.toLocaleDateString('en-US', { weekday: 'long' });
}

function nameKey(s: string): string {
  return (s || '').trim().toLowerCase();
}

// --------------------------------------------------------------------------
// Dashboard
// --------------------------------------------------------------------------

export default function MealsDashboardV2() {
  const today = useMemo(() => new Date(), []);

  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(today));
  const [selectedDay, setSelectedDay] = useState<number>(() =>
    dayIndexInWeek(today, getMonday(today)),
  );
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [swapSlot, setSwapSlot] = useState<SwapSlot | null>(null);
  // Period passed to the shared LogMealSheet when opened from a Meals-tab CTA.
  // `null` here means "let the sheet derive from the current hour".
  const [logSheetPeriod, setLogSheetPeriod] = useState<MealPeriod | null>(null);
  const [logSheetOpen, setLogSheetOpen] = useState(false);
  // Pre-fill payload when logging straight from a planned MealCard
  // (clipboard tap). Null means "blank Quick add".
  const [logSheetPrefill, setLogSheetPrefill] = useState<{
    title?: string;
    macros?: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
  }>({});

  function handleLogPlanned(entry: MealPlanEntry) {
    setOpenMenuId(null);
    setLogSheetPeriod(periodFromMealType(entry.meal_type));
    setLogSheetPrefill({
      title: entry.meal_name,
      macros: {
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
      },
    });
    setLogSheetOpen(true);
  }
  const [confirmRemove, setConfirmRemove] = useState<MealPlanEntry | null>(null);
  const [confirmReplaceWeek, setConfirmReplaceWeek] = useState(false);
  const [aiWeekError, setAiWeekError] = useState<string | null>(null);
  const [refreshingDay, setRefreshingDay] = useState(false);

  // Data
  const { entries, planId, refetch } = useMealPlanWeek(weekStart);
  const { data: goals } = useUserGoals();
  const { goal: activeGoal } = useActiveGoal();
  const { favoriteNameMap, toggleFavorite } = useSavedMeals();
  const {
    saving,
    deletingId,
    getOrCreatePlanId,
    addOrReplace,
    deleteEntry,
    replaceWeek,
    duplicateEntry,
  } = useMealPlanMutations();
  const {
    loadingWeek,
    weekProgress,
    suggestFullWeek,
    suggestForSlot,
  } = useMealPlannerAI();

  const targetKcal = goals?.calories ?? DEFAULT_TARGETS.calories;
  const targetProtein = goals?.protein ?? DEFAULT_TARGETS.protein;
  const targetCarbs = goals?.carbs ?? DEFAULT_TARGETS.carbs;
  const targetFat = goals?.fat ?? DEFAULT_TARGETS.fat;

  // Per-day kcal totals
  const dayKcalTotals = useMemo(() => {
    const arr = Array.from({ length: 7 }, () => 0);
    for (const e of entries) arr[e.day_of_week] += e.calories;
    return arr;
  }, [entries]);

  // Day strip cells
  const todayStr = fmtLocalDate(today);
  const weekDays: DayCell[] = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const kcal = dayKcalTotals[i] > 0 ? dayKcalTotals[i] : null;
      return {
        letter: DAY_LABELS[i],
        dateNum: date.getDate(),
        kcal,
        logged: kcal != null,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart.getTime(), dayKcalTotals]);

  const selectedDate = addDays(weekStart, selectedDay);
  const selectedDateStr = fmtLocalDate(selectedDate);
  const isTodaySelected = selectedDateStr === todayStr;

  // Per-day entries grouped by slot
  const mealsBySlot = useMemo(() => {
    const out: Record<MealType, MealPlanEntry[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };
    for (const e of entries) {
      if (e.day_of_week !== selectedDay) continue;
      const slot: MealType =
        SLOTS.includes(e.meal_type as MealType) ? e.meal_type : 'snack';
      out[slot].push(e);
    }
    return out;
  }, [entries, selectedDay]);

  // Flat list of the selected day's planned meals — powers the "From plan"
  // tab inside the shared LogMealSheet.
  const selectedDayPlannedMeals = useMemo(
    () => entries.filter((e) => e.day_of_week === selectedDay),
    [entries, selectedDay],
  );

  const dayTotals = useMemo(() => {
    const flat: MealPlanEntry[] = [];
    for (const k of SLOTS) flat.push(...mealsBySlot[k]);
    return sumMacros(flat);
  }, [mealsBySlot]);

  const mealCount =
    mealsBySlot.breakfast.length +
    mealsBySlot.lunch.length +
    mealsBySlot.dinner.length;
  const snackCount = mealsBySlot.snack.length;

  const weekKcalLogged = useMemo(
    () => entries.reduce((sum, e) => sum + e.calories, 0),
    [entries],
  );

  // --------- Handlers ---------

  function goPrevWeek() {
    setWeekStart((w) => addDays(w, -7));
    setExpandedMeal(null);
    setOpenMenuId(null);
  }

  function goNextWeek() {
    setWeekStart((w) => addDays(w, 7));
    setExpandedMeal(null);
    setOpenMenuId(null);
  }

  function handleSelectDay(i: number) {
    setSelectedDay(i);
    setExpandedMeal(null);
    setOpenMenuId(null);
  }

  function handleToggleExpand(id: string) {
    setExpandedMeal((prev) => (prev === id ? null : id));
    setOpenMenuId(null);
  }

  function handleOpenMenu(id: string) {
    setOpenMenuId((prev) => (prev === id ? null : id));
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

  function openSwap(slot: MealType) {
    setOpenMenuId(null);
    setSwapSlot({
      day_of_week: selectedDay,
      meal_type: slot,
      dateLabel: fmtShortDay(selectedDate),
    });
  }

  function handleSwapMeal(entry: MealPlanEntry) {
    setOpenMenuId(null);
    setSwapSlot({
      day_of_week: entry.day_of_week,
      meal_type: entry.meal_type as SwapSlot['meal_type'],
      dateLabel: fmtShortDay(addDays(weekStart, entry.day_of_week)),
    });
  }

  async function handleDuplicate(entry: MealPlanEntry) {
    setOpenMenuId(null);
    await duplicateEntry(entry);
    await refetch();
  }

  function handleRequestRemove(entry: MealPlanEntry) {
    setOpenMenuId(null);
    setConfirmRemove(entry);
  }

  async function performRemove() {
    if (!confirmRemove) return;
    const r = await deleteEntry(confirmRemove, weekStart);
    setConfirmRemove(null);
    if (!r.error) await refetch();
  }

  // SwapMealModal expects an `onAdd(meal)` that handles the upsert via
  // useMealPlanMutations.addOrReplace.
  async function handleAddMeal(meal: Parameters<typeof addOrReplace>[0]['meal']) {
    if (!swapSlot) return;
    const pid = planId ?? (await getOrCreatePlanId(weekStart));
    if (!pid) return;
    const existing =
      entries.find(
        (e) =>
          e.day_of_week === swapSlot.day_of_week &&
          e.meal_type === swapSlot.meal_type,
      ) ?? null;
    const r = await addOrReplace({
      planId: pid,
      day_of_week: swapSlot.day_of_week,
      meal_type: swapSlot.meal_type,
      weekStart,
      meal,
      existingEntry: existing,
    });
    if (!r.error) {
      setSwapSlot(null);
      await refetch();
    }
  }

  // AI Suggest Week
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
      setAiWeekError("Couldn't create this week's plan.");
      return;
    }
    const result = await suggestFullWeek({
      goal: activeGoal?.phaseType ?? 'maintenance',
      dietPreference: 'standard',
      dailyTargets: {
        calories: targetKcal,
        protein: targetProtein,
        carbs: targetCarbs,
        fat: targetFat,
      },
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
      setAiWeekError(`Saved ${result.entries.length} meals. ${result.error}`);
    }
    await refetch();
  }

  // Refresh day — re-generate today's 3 main slots via AI
  const handleRefreshDay = useCallback(async () => {
    setRefreshingDay(true);
    const pid = planId ?? (await getOrCreatePlanId(weekStart));
    if (!pid) {
      setRefreshingDay(false);
      return;
    }
    const goalKey = activeGoal?.phaseType ?? 'maintenance';
    const split = {
      calories: Math.round(targetKcal / 3),
      protein: Math.round(targetProtein / 3),
      carbs: Math.round(targetCarbs / 3),
      fat: Math.round(targetFat / 3),
    };
    for (const slot of ['breakfast', 'lunch', 'dinner'] as const) {
      const r = await suggestForSlot({
        mealType: slot,
        remaining: split,
        goal: goalKey,
        dietPreference: 'standard',
      });
      const pick = r.suggestions?.[0];
      if (!pick) break;
      const existing =
        entries.find(
          (e) => e.day_of_week === selectedDay && e.meal_type === slot,
        ) ?? null;
      await addOrReplace({
        planId: pid,
        day_of_week: selectedDay,
        meal_type: slot,
        weekStart,
        meal: {
          meal_name: pick.meal_name,
          ingredients: pick.ingredients,
          calories: Math.round(pick.calories),
          protein: Math.round(pick.protein * 10) / 10,
          carbs: Math.round(pick.carbs * 10) / 10,
          fat: Math.round(pick.fat * 10) / 10,
        },
        existingEntry: existing,
      });
    }
    await refetch();
    setRefreshingDay(false);
  }, [
    planId,
    weekStart,
    selectedDay,
    entries,
    activeGoal,
    targetKcal,
    targetProtein,
    targetCarbs,
    targetFat,
    addOrReplace,
    getOrCreatePlanId,
    refetch,
    suggestForSlot,
  ]);

  function handleCopyDay() {
    // Day-picker sheet is a follow-up — for now, surface so the icon isn't dead.
    setOpenMenuId(null);
    setAiWeekError('Copy day is coming soon.');
  }

  // ----------- AI context for the swap modal -----------
  const aiContext: SlotAIContext | null = useMemo(() => {
    if (!swapSlot) return null;
    const otherSlotsForDay = entries.filter(
      (e) =>
        e.day_of_week === swapSlot.day_of_week &&
        e.meal_type !== swapSlot.meal_type,
    );
    const usedCals = otherSlotsForDay.reduce((s, e) => s + e.calories, 0);
    const usedProtein = otherSlotsForDay.reduce((s, e) => s + e.protein, 0);
    const usedCarbs = otherSlotsForDay.reduce((s, e) => s + e.carbs, 0);
    const usedFat = otherSlotsForDay.reduce((s, e) => s + e.fat, 0);
    return {
      remaining: {
        calories: Math.max(50, targetKcal - usedCals),
        protein: Math.max(5, targetProtein - usedProtein),
        carbs: Math.max(5, targetCarbs - usedCarbs),
        fat: Math.max(5, targetFat - usedFat),
      },
      goal: activeGoal?.phaseType ?? 'maintenance',
    };
  }, [
    swapSlot,
    entries,
    activeGoal,
    targetKcal,
    targetProtein,
    targetCarbs,
    targetFat,
  ]);

  // Stagger key — replays the day section's entrance animation per day swap.
  const dayKey = `${weekStart.getTime()}-${selectedDay}`;

  // ----------- Render -----------
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* Emerald top spine to match dashboard chrome */}
      <LinearGradient
        colors={['rgba(16, 185, 129, 0.08)', 'transparent']}
        style={styles.topSpine}
        pointerEvents="none"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <WeekNavigator
          weekStart={weekStart}
          loggedKcal={weekKcalLogged}
          targetKcalPerDay={targetKcal}
          onPrev={goPrevWeek}
          onNext={goNextWeek}
        />

        <AISuggestWeekBanner
          onPress={handleAISuggestWeekTap}
          loading={loadingWeek}
          progress={weekProgress}
        />

        {aiWeekError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{aiWeekError}</Text>
          </View>
        ) : null}

        <DayStrip
          days={weekDays}
          selectedIndex={selectedDay}
          onSelect={handleSelectDay}
        />

        {/* Day section — keyed so animations replay on day/week change. */}
        <Animated.View
          key={dayKey}
          entering={FadeInDown.duration(Motion.durationRise).delay(40)}
        >
          <DayHeader
            fullDate={fmtFullDate(selectedDate)}
            relativeLabel={relativeLabel(selectedDate, today)}
            isToday={isTodaySelected}
            mealCount={mealCount}
            snackCount={snackCount}
            refreshing={refreshingDay}
            onRefresh={handleRefreshDay}
            onCopy={handleCopyDay}
          />

          <DayTotalsCard
            reanimateKey={dayKey}
            consumed={dayTotals.calories}
            target={targetKcal}
            macros={[
              {
                key: 'protein',
                label: 'Protein',
                value: Math.round(dayTotals.protein),
                target: targetProtein,
                color: DS.accent,
              },
              {
                key: 'carbs',
                label: 'Carbs',
                value: Math.round(dayTotals.carbs),
                target: targetCarbs,
                color: DS.accentLight,
              },
              {
                key: 'fat',
                label: 'Fat',
                value: Math.round(dayTotals.fat),
                target: targetFat,
                color: DS.accentMid,
              },
            ]}
          />

          {SLOTS.map((slot) => {
            const items = mealsBySlot[slot];
            if (items.length === 0) {
              return (
                <EmptyMealSlot
                  key={slot}
                  mealType={slot}
                  // Empty-slot CTAs now open the shared LogMealSheet — this
                  // logs actual consumption pre-tagged to the right period.
                  // NOTE: To re-route empty slots to the planner instead,
                  // swap onPress back to `openSwap(slot)`.
                  onPress={() => {
                    setLogSheetPeriod(periodFromMealType(slot));
                    setLogSheetOpen(true);
                  }}
                />
              );
            }
            return items.map((entry) => (
              <MealCard
                key={entry.id}
                entry={entry}
                isFavorite={
                  !!favoriteNameMap[nameKey(entry.meal_name)]
                }
                isExpanded={expandedMeal === entry.id}
                isMenuOpen={openMenuId === entry.id}
                onToggleExpand={() => handleToggleExpand(entry.id)}
                onToggleFavorite={() => handleToggleFavorite(entry)}
                onOpenMenu={() => handleOpenMenu(entry.id)}
                onSwap={() => handleSwapMeal(entry)}
                onDuplicate={() => handleDuplicate(entry)}
                onRemove={() => handleRequestRemove(entry)}
                onLog={() => handleLogPlanned(entry)}
              />
            ));
          })}

          {/* "Anything else to add?" routes to the shared log sheet — this
              records actual consumption (not a plan slot). */}
          <AnythingElseFooter
            onPress={() => {
              setLogSheetPeriod(periodFromDate());
              setLogSheetOpen(true);
            }}
          />
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <SwapMealModal
        visible={!!swapSlot}
        slot={swapSlot}
        saving={saving}
        aiContext={aiContext}
        onClose={() => setSwapSlot(null)}
        onAdd={handleAddMeal}
      />

      <DeleteConfirmModal
        visible={!!confirmRemove}
        title="Remove meal?"
        message="This removes the meal from your plan. If it was logged today, the food-log entry is also removed."
        confirmLabel="Remove"
        loading={!!deletingId}
        onCancel={() => setConfirmRemove(null)}
        onConfirm={performRemove}
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

      <LogMealSheet
        visible={logSheetOpen}
        initialPeriod={logSheetPeriod}
        initialTitle={logSheetPrefill.title}
        initialMacros={logSheetPrefill.macros}
        plannedMeals={selectedDayPlannedMeals}
        onClose={() => {
          setLogSheetOpen(false);
          // Clear the prefill after the modal animates out so it doesn't
          // flash into the next open.
          setTimeout(() => setLogSheetPrefill({}), 250);
        }}
        onLogged={() => {
          // The food_logs row is the source of truth for actual consumption.
          // It feeds the Calories Today hero on the dashboard and the Goal
          // Planner's nutrition logger — both refresh on focus.
          void refetch();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 0,
  },
  errorBanner: {
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#1A1010',
    borderColor: 'rgba(229, 115, 106, 0.3)',
    borderWidth: 1,
    borderRadius: 10,
  },
  errorText: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: '#E5736A',
    lineHeight: 17,
  },
  bottomSpacer: {
    height: 140,
  },
});
