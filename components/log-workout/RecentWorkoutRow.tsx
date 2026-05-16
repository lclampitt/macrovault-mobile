import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import type { RecentWorkout } from '../../hooks/useRecentWorkouts';

type Props = {
  workout: RecentWorkout;
};

function longDate(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return ymd;
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function RecentWorkoutRow({ workout }: Props) {
  return (
    <Pressable
      onPress={() => console.log(`Recent workout "${workout.name}" tapped — Phase 7d`)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${workout.name}, ${longDate(workout.date)}, ${workout.exerciseCount} exercises`}
    >
      <View style={styles.left}>
        <Text style={styles.name} numberOfLines={1}>
          {workout.name}
        </Text>
        <Text style={styles.date}>{longDate(workout.date)}</Text>
      </View>
      <Text style={styles.badge}>{workout.exerciseCount} ex</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pressed: {
    opacity: 0.85,
  },
  left: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
  },
  date: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  badge: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 12,
  },
});
