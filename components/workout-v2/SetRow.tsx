import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check, Trash2 } from 'lucide-react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Font, Tabular } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import type { ActiveSet } from '../../lib/active-workout-context';

const DESTRUCTIVE = '#E5736A';

type Props = {
  set: ActiveSet;
  setIndex: number;
  /** Previous-session reference at this set index, or null. */
  prevWeight: number | null;
  prevReps: number | null;
  /** True when this completed set beat the user's prior best 1RM for the exercise. */
  isPR: boolean;
  onUpdate: (field: 'weight' | 'reps', value: string) => void;
  onToggleComplete: () => void;
  /** Swipe-left to delete this set. */
  onDelete: () => void;
};

function renderDeleteAction() {
  return (
    <View style={styles.swipeAction}>
      <Trash2 size={16} color="#000" strokeWidth={2.5} />
      <Text style={styles.swipeActionText}>Delete</Text>
    </View>
  );
}

export default function SetRow({
  set,
  setIndex,
  prevWeight,
  prevReps,
  isPR,
  onUpdate,
  onToggleComplete,
  onDelete,
}: Props) {
  const t = useTokens();
  const completed = set.completed;
  const hasPrev = prevWeight != null && prevReps != null;

  return (
    <Swipeable
      renderRightActions={renderDeleteAction}
      onSwipeableOpen={(dir) => {
        if (dir === 'right') onDelete();
      }}
      overshootRight={false}
      friction={2}
    >
      <View
        style={[
          styles.row,
          { backgroundColor: t.bgCard },
          completed && styles.rowCompleted,
        ]}
      >
      {/* Set number / PR star */}
      <View style={styles.numCell}>
        <Text
          style={[
            styles.num,
            Tabular,
            { color: completed ? t.primary : t.textTertiary },
          ]}
        >
          {isPR ? '★' : setIndex + 1}
        </Text>
      </View>

      {/* Last set reference */}
      <Pressable
        onPress={() => {
          if (!hasPrev) return;
          onUpdate('weight', String(prevWeight));
          onUpdate('reps', String(prevReps));
        }}
        disabled={!hasPrev}
        style={({ pressed }) => [
          styles.lastCell,
          hasPrev && pressed && styles.lastPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          hasPrev
            ? `Autofill ${prevWeight} pounds for ${prevReps} reps`
            : 'No previous set'
        }
      >
        <Text style={[styles.lastText, Tabular, { color: t.textTertiary }]}>
          {hasPrev ? `${prevWeight}×${prevReps}` : '—'}
        </Text>
      </Pressable>

      {/* Weight input */}
      <TextInput
        value={set.weight}
        onChangeText={(v) => onUpdate('weight', v)}
        placeholder="0"
        placeholderTextColor={t.textQuaternary}
        keyboardType="decimal-pad"
        inputMode="decimal"
        selectTextOnFocus
        style={[
          styles.input,
          styles.weightInput,
          { backgroundColor: t.bgInput, borderColor: t.borderDefault, color: t.textPrimary },
          completed && { color: t.textTertiary, textDecorationLine: 'line-through', textDecorationColor: t.textQuaternary },
        ]}
        accessibilityLabel={`Weight in pounds for set ${setIndex + 1}`}
      />

      {/* Reps input */}
      <TextInput
        value={set.reps}
        onChangeText={(v) => onUpdate('reps', v)}
        placeholder="0"
        placeholderTextColor={t.textQuaternary}
        keyboardType="numeric"
        inputMode="numeric"
        selectTextOnFocus
        style={[
          styles.input,
          styles.repsInput,
          { backgroundColor: t.bgInput, borderColor: t.borderDefault, color: t.textPrimary },
          completed && { color: t.textTertiary, textDecorationLine: 'line-through', textDecorationColor: t.textQuaternary },
        ]}
        accessibilityLabel={`Reps for set ${setIndex + 1}`}
      />

      {/* Complete toggle */}
      <Pressable
        onPress={onToggleComplete}
        style={({ pressed }) => [
          styles.completeBtn,
          { backgroundColor: t.bgInput, borderColor: t.borderDefault },
          completed && {
            backgroundColor: t.primary,
            borderColor: t.primary,
            shadowColor: t.primary,
            shadowOpacity: 0.3,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
            elevation: 4,
          },
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ checked: completed }}
        accessibilityLabel={completed ? 'Mark set incomplete' : 'Mark set complete'}
        hitSlop={6}
      >
        <Check
          size={16}
          color={completed ? t.textOnPrimary : t.textQuaternary}
          strokeWidth={3}
        />
      </Pressable>
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowCompleted: {
    opacity: 0.85,
  },
  swipeAction: {
    width: 84,
    backgroundColor: DESTRUCTIVE,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  swipeActionText: {
    fontFamily: Font.bold,
    fontSize: 10,
    color: '#000',
    letterSpacing: 0.4,
  },
  numCell: {
    width: 24,
    alignItems: 'center',
  },
  num: {
    fontFamily: Font.bold,
    fontSize: 11,
  },
  lastCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  lastPressed: {
    opacity: 0.6,
  },
  lastText: {
    fontFamily: Font.medium,
    fontSize: 9,
  },
  weightInput: {
    width: 72,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 4,
    fontFamily: Font.bold,
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  repsInput: {
    flex: 1,
  },
  completeBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    transform: [{ scale: 0.9 }],
  },
});
