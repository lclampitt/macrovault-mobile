import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check, Trash2 } from 'lucide-react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { DS, Font, Tabular } from '../../lib/design-system';
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
          styles.rowSurface,
          completed && styles.rowCompleted,
        ]}
      >
      {/* Set number / PR star */}
      <View style={styles.numCell}>
        <Text
          style={[
            styles.num,
            Tabular,
            { color: completed ? DS.accent : DS.textTertiary },
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
        <Text style={[styles.lastText, Tabular]}>
          {hasPrev ? `${prevWeight}×${prevReps}` : '—'}
        </Text>
      </Pressable>

      {/* Weight input */}
      <TextInput
        value={set.weight}
        onChangeText={(v) => onUpdate('weight', v)}
        placeholder="0"
        placeholderTextColor={DS.textQuaternary}
        keyboardType="decimal-pad"
        inputMode="decimal"
        selectTextOnFocus
        style={[styles.input, styles.weightInput, completed && styles.inputCompleted]}
        accessibilityLabel={`Weight in pounds for set ${setIndex + 1}`}
      />

      {/* Reps input */}
      <TextInput
        value={set.reps}
        onChangeText={(v) => onUpdate('reps', v)}
        placeholder="0"
        placeholderTextColor={DS.textQuaternary}
        keyboardType="numeric"
        inputMode="numeric"
        selectTextOnFocus
        style={[styles.input, styles.repsInput, completed && styles.inputCompleted]}
        accessibilityLabel={`Reps for set ${setIndex + 1}`}
      />

      {/* Complete toggle */}
      <Pressable
        onPress={onToggleComplete}
        style={({ pressed }) => [
          styles.completeBtn,
          completed && styles.completeBtnActive,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ checked: completed }}
        accessibilityLabel={completed ? 'Mark set incomplete' : 'Mark set complete'}
        hitSlop={6}
      >
        <Check
          size={16}
          color={completed ? '#000' : DS.textQuaternary}
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
  rowSurface: {
    // Solid bg so the row covers the red swipe-action behind it.
    backgroundColor: DS.surface,
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
    color: '#555',
  },
  weightInput: {
    width: 72,
  },
  input: {
    backgroundColor: '#0F0F0F',
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 4,
    color: DS.text,
    fontFamily: Font.bold,
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  inputCompleted: {
    color: '#555',
    textDecorationLine: 'line-through',
    textDecorationColor: '#333',
  },
  repsInput: {
    flex: 1,
  },
  completeBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#0F0F0F',
    borderWidth: 1,
    borderColor: DS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeBtnActive: {
    backgroundColor: DS.accent,
    borderColor: DS.accent,
    shadowColor: DS.accent,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  pressed: {
    transform: [{ scale: 0.9 }],
  },
});
