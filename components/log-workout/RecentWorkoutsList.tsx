import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import type { RecentWorkout } from '../../hooks/useRecentWorkouts';
import RecentWorkoutRow from './RecentWorkoutRow';

type Props = {
  workouts: RecentWorkout[];
};

export default function RecentWorkoutsList({ workouts }: Props) {
  if (workouts.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          No workouts logged yet. Tap Quick Start to begin.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {workouts.map((w) => (
        <RecentWorkoutRow key={w.id} workout={w} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  empty: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
});
