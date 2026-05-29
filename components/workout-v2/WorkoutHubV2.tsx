import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { DS } from '../../lib/design-system';
import { useWorkoutTemplates } from '../../hooks/useWorkoutTemplates';
import { useRecentWorkouts } from '../../hooks/useRecentWorkouts';
import { useTemplateActions } from '../../hooks/useTemplateActions';
import { useDeleteWorkout } from '../../hooks/useDeleteWorkout';
import { useActiveWorkout } from '../../lib/active-workout-context';
import type { WorkoutTemplate } from '../../hooks/useWorkoutTemplates';

import WorkoutHubHeader from './WorkoutHubHeader';
import PrimaryActions from './PrimaryActions';
import HubSubNav, { type HubTab } from './HubSubNav';
import TemplatesGrid from './TemplatesGrid';
import RecentWorkoutsList from './RecentWorkoutsList';
import ContinueLastBanner from './ContinueLastBanner';

export default function WorkoutHubV2() {
  const router = useRouter();
  const { templates } = useWorkoutTemplates();
  const { workouts, refetch: refetchWorkouts } = useRecentWorkouts(20);
  const { state, start, loadTemplate } = useActiveWorkout();
  const { remove: deleteWorkout } = useDeleteWorkout(() => refetchWorkouts());
  const { fetchTemplate } = useTemplateActions();
  const [tab, setTab] = useState<HubTab>('templates');

  // Days-of-month roughly — count workouts logged in current month
  const workoutsThisMonth = useMemo(() => {
    const now = new Date();
    const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return workouts.filter((w) => w.date.startsWith(cur)).length;
  }, [workouts]);

  // Continue-last detection: the active-workout-context persists across
  // navigations. If exercises exist on entering the hub, the user has an
  // unfinished session.
  const hasActiveSession = state.exercises.length > 0;
  const elapsedMin = Math.max(
    1,
    Math.round((Date.now() - state.startedAt) / 60000),
  );

  // Empty workout: reset + go to active.
  function handleQuickStart() {
    if (hasActiveSession) {
      router.push('/active-workout');
      return;
    }
    start();
    router.push('/active-workout');
  }

  function handleCardio() {
    // Cardio category preset — wires to the existing flow.
    start();
    router.push('/active-workout?category=cardio');
  }

  async function handleTemplatePress(t: WorkoutTemplate) {
    if (hasActiveSession) {
      router.push('/active-workout');
      return;
    }
    const { data: loaded, error } = await fetchTemplate(t.id);
    if (error || !loaded) return;
    loadTemplate(loaded);
    router.push('/active-workout?from=template');
  }

  async function handleRepeat(w: { id: string; name: string }) {
    // The Repeat button loads the workout as a new template — using its
    // existing exercises. For now we just route to the workout's "view" flow
    // by starting an empty workout with that name preset; full
    // load-from-history is a follow-up that needs a workouts.fetchOne query.
    if (hasActiveSession) {
      router.push('/active-workout');
      return;
    }
    start();
    router.push({
      pathname: '/active-workout',
      params: { presetName: w.name },
    });
  }

  function handleResume() {
    router.push('/active-workout');
  }

  // Re-enter the tab — refetch via the existing hooks' onFocus is wired.
  useEffect(() => {
    /* no-op — both hooks use useFocusEffect to refresh */
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
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
        <WorkoutHubHeader
          workoutsThisMonth={workoutsThisMonth}
          templateCount={templates.length}
        />

        {hasActiveSession ? (
          <ContinueLastBanner
            name={state.name || state.templateName || 'Workout'}
            elapsedMin={elapsedMin}
            onResume={handleResume}
          />
        ) : null}

        <PrimaryActions
          onQuickStart={handleQuickStart}
          onCardio={handleCardio}
        />

        <HubSubNav active={tab} onChange={setTab} />

        {tab === 'templates' ? (
          <Animated.View entering={FadeIn.duration(250)}>
            <TemplatesGrid
              templates={templates}
              onTemplatePress={handleTemplatePress}
              onNew={() => {
                // New template — for now, route into an empty active workout.
                if (hasActiveSession) {
                  router.push('/active-workout');
                  return;
                }
                start();
                router.push('/active-workout');
              }}
            />
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(250)}>
            <RecentWorkoutsList
              workouts={workouts}
              onPress={(w) =>
                router.push({
                  pathname: '/workout-details/[id]',
                  params: { id: w.id },
                })
              }
              onRepeat={handleRepeat}
              onDelete={(w) => {
                void deleteWorkout(w.id);
              }}
            />
          </Animated.View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  bottomSpacer: {
    height: 140,
  },
});
