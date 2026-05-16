import { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import type { ActiveSet } from '../../lib/active-workout-context';

type Props = {
  index: number;
  set: ActiveSet;
  onChange: (field: 'weight' | 'reps' | 'completed', value: string | boolean) => void;
  onRemove: () => void;
};

export default function SetRow({ index, set, onChange, onRemove }: Props) {
  const swipeRef = useRef<Swipeable>(null);
  const done = set.completed;

  function renderRightActions() {
    return (
      <Pressable
        style={styles.deleteAction}
        onPress={() => {
          swipeRef.current?.close();
          onRemove();
        }}
        accessibilityRole="button"
        accessibilityLabel={`Delete set ${index + 1}`}
      >
        <Feather name="trash-2" size={18} color="#FFFFFF" />
        <Text style={styles.deleteText}>Delete</Text>
      </Pressable>
    );
  }

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      rightThreshold={40}
    >
      <View style={[styles.row, done && styles.rowDone]}>
        <Text style={[styles.setNum, done && styles.struck]}>{index + 1}</Text>
        <TextInput
          value={set.weight}
          onChangeText={(t) => onChange('weight', t.replace(/[^0-9.]/g, ''))}
          placeholder="—"
          placeholderTextColor={Colors.textMuted}
          keyboardType="decimal-pad"
          style={[styles.input, done && styles.inputDone]}
        />
        <TextInput
          value={set.reps}
          onChangeText={(t) => onChange('reps', t.replace(/[^0-9]/g, ''))}
          placeholder="—"
          placeholderTextColor={Colors.textMuted}
          keyboardType="number-pad"
          style={[styles.input, done && styles.inputDone]}
        />
        <Pressable
          onPress={() => onChange('completed', !done)}
          hitSlop={8}
          style={styles.check}
          accessibilityRole="button"
          accessibilityLabel={done ? 'Mark set incomplete' : 'Mark set complete'}
        >
          <Feather
            name={done ? 'check-circle' : 'circle'}
            size={20}
            color={done ? Colors.accent : Colors.textMuted}
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
    gap: 10,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
  },
  rowDone: {
    opacity: 0.5,
  },
  struck: {
    textDecorationLine: 'line-through',
  },
  setNum: {
    width: 32,
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: Colors.textPrimary,
    fontSize: 15,
    textAlign: 'center',
  },
  inputDone: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  check: {
    width: 32,
    alignItems: 'center',
  },
  deleteAction: {
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 84,
    marginVertical: 6,
    borderRadius: 8,
    gap: 2,
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
