import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { DS, Font, Tabular } from '../../lib/design-system';
import PulseDot from '../ds/PulseDot';
import { formatWorkoutDuration } from '../../hooks/useWorkoutTimer';

type Props = {
  workoutName: string;
  onChangeName: (name: string) => void;
  elapsedSeconds: number;
  doneSets: number;
  totalSets: number;
  totalVolume: number;
  onFinish: () => void;
};

function fmtNumber(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

/**
 * Always-visible header during a session: LIVE indicator + elapsed timer +
 * Finish button row, editable workout name, progress bar with done/total
 * sets and running volume.
 */
export default function ActiveStickyHeader({
  workoutName,
  onChangeName,
  elapsedSeconds,
  doneSets,
  totalSets,
  totalVolume,
  onFinish,
}: Props) {
  const progressPct =
    totalSets > 0 ? Math.min(100, (doneSets / totalSets) * 100) : 0;
  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <PulseDot size={6} />
          <Text style={styles.liveLabel}>LIVE</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={[styles.elapsed, Tabular]}>
            {formatWorkoutDuration(elapsedSeconds)}
          </Text>
        </View>
        <Pressable
          onPress={onFinish}
          style={({ pressed }) => [styles.finishBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Finish workout"
        >
          <Text style={styles.finishText}>Finish</Text>
        </Pressable>
      </View>

      <TextInput
        value={workoutName}
        onChangeText={onChangeName}
        placeholder="Workout name…"
        placeholderTextColor={DS.textTertiary}
        style={styles.nameInput}
        maxLength={80}
        accessibilityLabel="Workout name"
      />

      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressPct}%` },
              progressPct > 0 && styles.progressFillGlow,
            ]}
          />
        </View>
        <Text style={[styles.progressText, Tabular]}>
          {doneSets}/{totalSets}
        </Text>
        <Text style={styles.dot}>·</Text>
        <Text style={[styles.volume, Tabular]}>
          {fmtNumber(totalVolume)} lb
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(0,0,0,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: DS.border,
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
    color: DS.accent,
    letterSpacing: 0.8,
  },
  dot: {
    color: DS.textDimmest,
    fontSize: 11,
  },
  elapsed: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: DS.text,
  },
  finishBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: DS.accent,
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  finishText: {
    fontFamily: Font.bold,
    fontSize: 12,
    color: '#000',
  },
  nameInput: {
    fontFamily: Font.bold,
    fontSize: 17,
    color: DS.text,
    letterSpacing: -0.3,
    padding: 0,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: DS.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: DS.accent,
  },
  progressFillGlow: {
    shadowColor: DS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 2,
  },
  progressText: {
    fontFamily: Font.bold,
    fontSize: 10,
    color: DS.accent,
  },
  volume: {
    fontFamily: Font.medium,
    fontSize: 10,
    color: DS.textSecondary,
  },
});
