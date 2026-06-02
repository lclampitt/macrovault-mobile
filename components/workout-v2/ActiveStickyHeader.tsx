import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Font, Tabular } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import PulseDot from '../ds/PulseDot';
import { formatWorkoutDuration } from '../../hooks/useWorkoutTimer';

type Props = {
  workoutName: string;
  onChangeName: (name: string) => void;
  elapsedSeconds: number;
  onFinish: () => void;
};

/**
 * Always-visible header during a session.
 *
 * Two rows only:
 *   1. LIVE indicator + elapsed timer + Finish button
 *   2. Editable workout title
 *
 * Per-set progress and running volume used to render here too (e.g.
 * "0/16 · 0 lb"). They were removed deliberately: those counters duplicate
 * info the exercise cards already show per-exercise, and clearing the
 * header makes the screen feel less spreadsheet-y mid-workout.
 */
export default function ActiveStickyHeader({
  workoutName,
  onChangeName,
  elapsedSeconds,
  onFinish,
}: Props) {
  const t = useTokens();
  return (
    <View style={[styles.wrap, { borderBottomColor: t.borderDefault }]}>
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <PulseDot size={6} />
          <Text style={[styles.liveLabel, { color: t.primary }]}>LIVE</Text>
          <Text style={[styles.dot, { color: t.textQuaternary }]}>·</Text>
          <Text style={[styles.elapsed, Tabular, { color: t.textPrimary }]}>
            {formatWorkoutDuration(elapsedSeconds)}
          </Text>
        </View>
        <Pressable
          onPress={onFinish}
          style={({ pressed }) => [
            styles.finishBtn,
            { backgroundColor: t.primary },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Finish workout"
        >
          <Text style={[styles.finishText, { color: t.textOnPrimary }]}>Finish</Text>
        </Pressable>
      </View>

      <TextInput
        value={workoutName}
        onChangeText={onChangeName}
        placeholder="Workout name…"
        placeholderTextColor={t.textTertiary}
        style={[styles.nameInput, { color: t.textPrimary }]}
        maxLength={80}
        accessibilityLabel="Workout name"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveLabel: {
    fontFamily: Font.bold,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  dot: {
    fontSize: 11,
  },
  elapsed: {
    fontFamily: Font.bold,
    fontSize: 13,
  },
  finishBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  finishText: {
    fontFamily: Font.bold,
    fontSize: 12,
  },
  nameInput: {
    fontFamily: Font.bold,
    fontSize: 20,
    letterSpacing: -0.3,
    padding: 0,
  },
});
