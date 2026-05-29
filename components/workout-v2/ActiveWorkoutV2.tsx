import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from 'react-native-draggable-flatlist';
import { Plus } from 'lucide-react-native';
import { DS, Font } from '../../lib/design-system';
import {
  useActiveWorkout,
  type ActiveExercise,
} from '../../lib/active-workout-context';
import { useSaveWorkout } from '../../hooks/useSaveWorkout';
import { useTemplateActions } from '../../hooks/useTemplateActions';
import { useWorkoutTimer, formatWorkoutDuration } from '../../hooks/useWorkoutTimer';

import ActiveStickyHeader from './ActiveStickyHeader';
import RestTimerBar from './RestTimerBar';
import ExerciseCard from './ExerciseCard';
import FinishModal, { type FinishOption } from './FinishModal';
import AddExerciseSheet from './AddExerciseSheet';
import RestTimerEditModal from './RestTimerEditModal';
import ExerciseMetricsModal from './ExerciseMetricsModal';

const REST_DEFAULT = 120; // seconds — spec default
const DESTRUCTIVE = '#E5736A';

function parseNum(s: string): number {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export default function ActiveWorkoutV2() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    state,
    setName,
    addExercise,
    removeExercise,
    addSet,
    removeSet,
    updateSet,
    reorderExercises,
    reset,
  } = useActiveWorkout();
  const { save, saving } = useSaveWorkout();
  const { updateTemplate, createTemplate, incrementUseCount } =
    useTemplateActions();

  const elapsed = useWorkoutTimer(state.startedAt);

  // -------- Modal / sheet state --------
  const [showFinish, setShowFinish] = useState(false);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [openMenuExId, setOpenMenuExId] = useState<string | null>(null);
  const [metricsExId, setMetricsExId] = useState<string | null>(null);

  // -------- Rest timer state --------
  // `restDefault` is the user's chosen default for this session — every new
  // set's rest timer starts from this. `restTarget` is the active target for
  // the *current* timer (which may have been bumped with +15s).
  const [restDefault, setRestDefault] = useState(REST_DEFAULT);
  const [restTarget, setRestTarget] = useState(REST_DEFAULT);
  const [restStartedAt, setRestStartedAt] = useState<number | null>(null);

  // Bottom spacer = clearance under the floating tab bar, plus an extra
  // ~80px when the rest timer is on screen (it eats vertical room in the
  // sticky header). 240 base keeps Add exercise / Discard reachable
  // regardless of device / FAB glow / Android elevation quirks.
  const bottomSpacerHeight =
    240 + insets.bottom + (restStartedAt != null ? 80 : 0);
  const [restElapsed, setRestElapsed] = useState(0);
  const [showRestEdit, setShowRestEdit] = useState(false);

  useEffect(() => {
    if (restStartedAt == null) return;
    const tick = () => {
      const e = Math.floor((Date.now() - restStartedAt) / 1000);
      if (e >= restTarget) {
        setRestStartedAt(null);
        setRestElapsed(0);
        return;
      }
      setRestElapsed(e);
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [restStartedAt, restTarget]);

  // -------- Derived stats --------
  const doneSets = useMemo(
    () =>
      state.exercises.reduce(
        (sum, e) => sum + e.sets.filter((s) => s.completed).length,
        0,
      ),
    [state.exercises],
  );
  const totalSets = useMemo(
    () => state.exercises.reduce((sum, e) => sum + e.sets.length, 0),
    [state.exercises],
  );
  const totalVolume = useMemo(() => {
    let v = 0;
    for (const ex of state.exercises) {
      for (const s of ex.sets) {
        if (!s.completed) continue;
        v += parseNum(s.weight) * parseNum(s.reps);
      }
    }
    return v;
  }, [state.exercises]);

  const elapsedSeconds = useMemo(() => {
    // Parse mm:ss / hh:mm:ss back to seconds for the header label,
    // since useWorkoutTimer returns a pre-formatted string.
    // Cleaner: recompute from startedAt directly.
    return Math.max(0, Math.floor((Date.now() - state.startedAt) / 1000));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, state.startedAt]);

  // -------- Handlers --------

  function handleBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/log-workout');
  }

  function handleToggleSet(exId: string, setId: string, willComplete: boolean) {
    updateSet(exId, setId, 'completed', willComplete);
    if (willComplete) {
      // Start (or restart) the rest timer at the user's session default.
      setRestTarget(restDefault);
      setRestStartedAt(Date.now());
      setRestElapsed(0);
    }
  }

  function handleAddExercise(name: string) {
    addExercise(name);
    setShowAddSheet(false);
  }

  function handleDiscard() {
    Alert.alert(
      'Discard workout?',
      'Your current session will be deleted. This can’t be undone.',
      [
        { text: 'Keep going', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            reset();
            router.replace('/log-workout');
          },
        },
      ],
    );
  }

  async function persistTemplateChoice(option: FinishOption) {
    if (option === 'update' && state.templateId) {
      const r = await updateTemplate(state.templateId, state.exercises);
      if (r.error) console.warn('[finish.update]', r.error);
    } else if (option === 'new') {
      const r = await createTemplate(
        state.name.trim() || 'Untitled Template',
        state.category,
        state.exercises,
      );
      if (r.error) console.warn('[finish.new]', r.error);
    } else if (option === 'keep' && state.templateId) {
      // Just bump use_count so favorites/recency stay accurate.
      const r = await incrementUseCount(state.templateId);
      if (r.error) console.warn('[finish.keep]', r.error);
    }
  }

  async function finalizeSave(option: FinishOption) {
    const r = await save(state);
    if (r.error) return;
    await persistTemplateChoice(option);
    reset();
    setShowFinish(false);
    router.replace('/log-workout');
  }

  async function handleSave(option: FinishOption) {
    if (totalSets === 0 || doneSets === 0) {
      Alert.alert('No sets logged', 'Save this empty workout anyway?', [
        { text: 'Keep going', style: 'cancel' },
        {
          text: 'Save anyway',
          onPress: () => {
            void finalizeSave(option);
          },
        },
      ]);
      return;
    }
    await finalizeSave(option);
  }

  // -------- Drag-to-reorder wrapper --------
  // Track index mapping so we can compute from/to for the reorder callback.
  const dataKeys = useRef<string[]>([]);
  useEffect(() => {
    dataKeys.current = state.exercises.map((e) => e.id);
  }, [state.exercises]);

  const handleDragEnd = useCallback(
    ({ data }: { data: ActiveExercise[] }) => {
      // Figure out the moved item by comparing previous order
      const prev = dataKeys.current;
      const next = data.map((d) => d.id);
      for (let i = 0; i < next.length; i++) {
        if (prev[i] !== next[i]) {
          const fromIndex = prev.indexOf(next[i]);
          if (fromIndex >= 0 && fromIndex !== i) {
            reorderExercises(fromIndex, i);
          }
          break;
        }
      }
    },
    [reorderExercises],
  );

  // -------- Render an exercise row in the draggable list --------
  const renderExercise = useCallback(
    ({ item, drag }: RenderItemParams<ActiveExercise>) => (
      <ScaleDecorator activeScale={1.02}>
        <ExerciseCard
          exercise={item}
          isMenuOpen={openMenuExId === item.id}
          onOpenMenu={() =>
            setOpenMenuExId((prev) => (prev === item.id ? null : item.id))
          }
          onUpdateSet={(setId, field, value) =>
            updateSet(item.id, setId, field, value)
          }
          onToggleSetComplete={(setId) => {
            const set = item.sets.find((s) => s.id === setId);
            handleToggleSet(item.id, setId, !set?.completed);
          }}
          onAddSet={() => addSet(item.id)}
          onDeleteSet={(setId) => removeSet(item.id, setId)}
          onRename={() => {
            setOpenMenuExId(null);
            Alert.alert('Rename', 'Coming soon.');
          }}
          onReplace={() => {
            setOpenMenuExId(null);
            Alert.alert('Replace exercise', 'Coming soon.');
          }}
          onAddNote={() => {
            setOpenMenuExId(null);
            Alert.alert('Add note', 'Coming soon.');
          }}
          onViewHistory={() => {
            setOpenMenuExId(null);
            Alert.alert('View history', 'Coming soon.');
          }}
          onRemove={() => {
            setOpenMenuExId(null);
            removeExercise(item.id);
          }}
          onShowMetrics={() => {
            setOpenMenuExId(null);
            setMetricsExId(item.id);
          }}
          drag={drag}
        />
      </ScaleDecorator>
    ),
    [openMenuExId, addSet, removeSet, removeExercise, updateSet],
  );

  const ListFooter = (
    <View>
      <View style={styles.ctaWrap}>
        <Pressable
          onPress={() => setShowAddSheet(true)}
          style={({ pressed }) => [
            styles.addCta,
            pressed && styles.addCtaPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add exercise"
        >
          <Plus size={16} color={DS.accent} strokeWidth={2.5} />
          <Text style={styles.addCtaLabel}>Add exercise</Text>
        </Pressable>
      </View>
      <Pressable
        onPress={handleDiscard}
        style={styles.discardBtn}
        accessibilityRole="button"
        accessibilityLabel="Discard workout"
      >
        <Text style={styles.discardText}>Discard workout</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        {/* Sticky header + rest timer */}
        <View style={styles.stickyHeader}>
          <ActiveStickyHeader
            workoutName={state.name}
            onChangeName={setName}
            elapsedSeconds={elapsedSeconds}
            doneSets={doneSets}
            totalSets={totalSets}
            totalVolume={totalVolume}
            onFinish={() => setShowFinish(true)}
          />
          {restStartedAt != null ? (
            <RestTimerBar
              elapsed={restElapsed}
              target={restTarget}
              onAdd15={() => setRestTarget((t) => t + 15)}
              onCancel={() => {
                setRestStartedAt(null);
                setRestElapsed(0);
              }}
              onEditTarget={() => setShowRestEdit(true)}
            />
          ) : null}
        </View>

        {/* Draggable exercise list */}
        <DraggableFlatList
          data={state.exercises}
          keyExtractor={(item) => item.id}
          renderItem={renderExercise}
          onDragEnd={handleDragEnd}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: bottomSpacerHeight },
          ]}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                No exercises yet — tap Add exercise to start logging sets.
              </Text>
            </View>
          }
          ListFooterComponent={ListFooter}
          activationDistance={12}
        />

        {/* Modals & sheets */}
        <FinishModal
          visible={showFinish}
          workoutName={state.name}
          templateName={state.templateName}
          duration={formatWorkoutDuration(elapsedSeconds)}
          doneSets={doneSets}
          volumeLb={totalVolume}
          saving={saving}
          onClose={() => setShowFinish(false)}
          onSave={handleSave}
        />
        <AddExerciseSheet
          visible={showAddSheet}
          onClose={() => setShowAddSheet(false)}
          onPick={handleAddExercise}
        />
        <RestTimerEditModal
          visible={showRestEdit}
          currentSeconds={restTarget}
          onCancel={() => setShowRestEdit(false)}
          onSave={(seconds) => {
            setRestTarget(seconds);
            setRestDefault(seconds);
            // If a timer is running, restart at the new target.
            if (restStartedAt != null) {
              setRestStartedAt(Date.now());
              setRestElapsed(0);
            }
            setShowRestEdit(false);
          }}
        />
        <ExerciseMetricsModal
          visible={metricsExId != null}
          exercise={
            metricsExId != null
              ? state.exercises.find((e) => e.id === metricsExId) ?? null
              : null
          }
          priorTotalVolume={null}
          onClose={() => setMetricsExId(null)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DS.bg,
  },
  flex: { flex: 1 },
  stickyHeader: {
    backgroundColor: DS.bg,
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 0,
  },
  ctaWrap: {
    marginHorizontal: 20,
    marginBottom: 8,
  },
  addCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 16,
    paddingVertical: 16,
  },
  addCtaPressed: {
    transform: [{ scale: 0.99 }],
  },
  addCtaLabel: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: DS.accent,
  },
  discardBtn: {
    marginHorizontal: 20,
    marginTop: 6,
    paddingVertical: 8,
    alignItems: 'center',
  },
  discardText: {
    fontFamily: Font.semibold,
    fontSize: 11,
    color: DESTRUCTIVE,
  },
  empty: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 18,
  },
  emptyText: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.textTertiary,
    textAlign: 'center',
    lineHeight: 17,
  },
});
