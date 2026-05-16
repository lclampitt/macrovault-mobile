import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from 'react-native-draggable-flatlist';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import {
  useActiveWorkout,
  type ActiveExercise,
} from '../lib/active-workout-context';
import { useWorkoutTimer } from '../hooks/useWorkoutTimer';
import { useSaveWorkout } from '../hooks/useSaveWorkout';
import WorkoutTimer from '../components/active-workout/WorkoutTimer';
import WorkoutNameInput from '../components/active-workout/WorkoutNameInput';
import CategoryPills from '../components/active-workout/CategoryPills';
import ExerciseCard from '../components/active-workout/ExerciseCard';
import AddExerciseButton from '../components/active-workout/AddExerciseButton';
import SessionNotesInput from '../components/active-workout/SessionNotesInput';
import EmptyWorkoutState from '../components/active-workout/EmptyWorkoutState';
import EndWorkoutModal from '../components/active-workout/EndWorkoutModal';
import DiscardWorkoutModal from '../components/active-workout/DiscardWorkoutModal';
import DeleteConfirmModal from '../components/progress/DeleteConfirmModal';
import TemplateFinishModal from '../components/active-workout/TemplateFinishModal';
import { useTemplateActions } from '../hooks/useTemplateActions';

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const { seed } = useLocalSearchParams<{ seed?: string }>();
  const ws = useActiveWorkout();
  const timer = useWorkoutTimer(ws.state.startedAt);
  const { save, saving, error } = useSaveWorkout();
  const { updateTemplate, createTemplate, incrementUseCount } =
    useTemplateActions();

  const [endOpen, setEndOpen] = useState(false);
  const [templateFinishOpen, setTemplateFinishOpen] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

  // The screen is a pure view of the shared workout context. It never resets
  // on mount — Quick Start clears state and templates load state *before*
  // navigating here, so returning via the in-progress banner preserves work.

  const pickerHref =
    seed === 'cardio' ? '/exercise-picker?category=Cardio' : '/exercise-picker';

  const pendingExercise = ws.state.exercises.find((e) => e.id === pendingRemoveId);

  function exitToLanding() {
    ws.reset();
    router.replace('/log-workout');
  }

  function requestFinish() {
    console.log(
      '[Finish] requestFinish — exercises:',
      ws.state.exercises.length,
      'templateId:',
      ws.state.templateId,
    );
    if (ws.state.exercises.length === 0) {
      Alert.alert(
        'Add an exercise',
        'Add at least one exercise before finishing your workout.',
      );
      return;
    }
    if (ws.state.templateId) {
      setTemplateError(null);
      setTemplateFinishOpen(true);
    } else {
      setEndOpen(true);
    }
  }

  async function handleFinish() {
    console.log(
      '[Finish] handleFinish called — exercises:',
      ws.state.exercises.length,
      'name:',
      ws.state.name,
    );
    const { error: saveError } = await save(ws.state);
    console.log('[Finish] save result:', { error: saveError });
    if (!saveError) {
      setEndOpen(false);
      exitToLanding();
      console.log('[Finish] reset + navigate to /log-workout complete');
    }
  }

  // For template-originated workouts: always log the workout, then apply the
  // chosen template action (best-effort — a failed template op doesn't lose
  // the logged workout).
  async function finishWithTemplate(
    templateOp: () => Promise<{ error: string | null }>,
  ) {
    setTemplateError(null);
    const { error: saveError } = await save(ws.state);
    if (saveError) return; // surfaced via `error` prop; stay on screen
    const { error: opError } = await templateOp();
    if (opError) {
      // Workout is saved; just report the template-side failure.
      console.error('[active-workout] template op failed:', opError);
    }
    setTemplateFinishOpen(false);
    exitToLanding();
  }

  const tplId = ws.state.templateId;

  function handleUpdateTemplate() {
    if (!tplId) return;
    finishWithTemplate(() => updateTemplate(tplId, ws.state.exercises));
  }

  function handleKeepOriginal() {
    if (!tplId) return;
    finishWithTemplate(() => incrementUseCount(tplId));
  }

  function handleSaveAsNew(name: string) {
    finishWithTemplate(() =>
      createTemplate(name, ws.state.category, ws.state.exercises),
    );
  }

  function handleDiscard() {
    setDiscardOpen(false);
    exitToLanding();
  }

  const hasExercises = ws.state.exercises.length > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <View style={styles.header}>
        <WorkoutTimer time={timer} />
        <WorkoutNameInput value={ws.state.name} onChange={ws.setName} />
        <Pressable
          onPress={requestFinish}
          style={({ pressed }) => [styles.finishBtn, pressed && styles.finishBtnPressed]}
          accessibilityRole="button"
          accessibilityLabel="Finish workout"
        >
          <Text style={styles.finishText}>Finish</Text>
        </Pressable>
      </View>

      <CategoryPills selected={ws.state.category} onSelect={ws.setCategory} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        <DraggableFlatList
          data={ws.state.exercises}
          keyExtractor={(item) => item.id}
          onDragEnd={({ from, to }) => ws.reorderExercises(from, to)}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          activationDistance={12}
          renderItem={({
            item,
            drag,
            isActive,
          }: RenderItemParams<ActiveExercise>) => (
            <ScaleDecorator>
              <ExerciseCard
                exercise={item}
                drag={drag}
                isActive={isActive}
                onUpdateSet={(setId, field, value) =>
                  ws.updateSet(item.id, setId, field, value)
                }
                onAddSet={() => ws.addSet(item.id)}
                onRemoveSet={(setId) => ws.removeSet(item.id, setId)}
                onRequestRemove={() => setPendingRemoveId(item.id)}
                onSetNote={(note) => ws.setExerciseNote(item.id, note)}
                onRestTimer={() =>
                  Alert.alert(
                    'Rest timer',
                    'Rest timer is coming in a future update.',
                  )
                }
              />
            </ScaleDecorator>
          )}
          ListEmptyComponent={
            <EmptyWorkoutState onAddExercise={() => router.push(pickerHref)} />
          }
          ListFooterComponent={
            <>
              {hasExercises ? (
                <>
                  <AddExerciseButton onPress={() => router.push(pickerHref)} />
                  <View style={styles.notesWrap}>
                    <SessionNotesInput
                      value={ws.state.notes}
                      onChange={ws.setNotes}
                    />
                  </View>
                </>
              ) : null}

              {/* Always present (matches workout-6/7.png). requestFinish()
                  shows an alert if there are no exercises yet. */}
              <Pressable
                onPress={requestFinish}
                style={({ pressed }) => [
                  styles.finishWorkoutBtn,
                  pressed && styles.finishWorkoutBtnPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Finish Workout"
              >
                <Text style={styles.finishWorkoutText}>Finish Workout</Text>
              </Pressable>

              <Pressable
                onPress={() => setDiscardOpen(true)}
                style={styles.discardWrap}
                accessibilityRole="button"
                accessibilityLabel="Discard Workout"
              >
                <Text style={styles.discardText}>Discard Workout</Text>
              </Pressable>
            </>
          }
        />
      </KeyboardAvoidingView>

      <EndWorkoutModal
        visible={endOpen}
        saving={saving}
        error={error}
        onCancel={() => setEndOpen(false)}
        onConfirm={handleFinish}
      />
      <TemplateFinishModal
        visible={templateFinishOpen}
        templateName={ws.state.templateName ?? 'this template'}
        defaultNewName={ws.state.name}
        saving={saving}
        error={error ?? templateError}
        onCancel={() => setTemplateFinishOpen(false)}
        onUpdate={handleUpdateTemplate}
        onKeepOriginal={handleKeepOriginal}
        onSaveAsNew={handleSaveAsNew}
      />
      <DiscardWorkoutModal
        visible={discardOpen}
        onCancel={() => setDiscardOpen(false)}
        onConfirm={handleDiscard}
      />
      <DeleteConfirmModal
        visible={pendingRemoveId !== null}
        title="Remove exercise?"
        message={
          pendingExercise
            ? `Remove "${pendingExercise.name}" from this workout?`
            : ''
        }
        confirmLabel="Remove"
        onCancel={() => setPendingRemoveId(null)}
        onConfirm={() => {
          if (pendingRemoveId) ws.removeExercise(pendingRemoveId);
          setPendingRemoveId(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  finishBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.accent,
  },
  finishBtnPressed: {
    backgroundColor: Colors.accentDark,
  },
  finishText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 140, // clearance for the floating bottom navbar
  },
  notesWrap: {
    marginTop: 20,
  },
  finishWorkoutBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  finishWorkoutBtnPressed: {
    backgroundColor: Colors.accentDark,
  },
  finishWorkoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  discardWrap: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  discardText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
