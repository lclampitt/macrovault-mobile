import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

type Props = {
  mealLabel: string; // 'breakfast' | 'lunch' | 'dinner'
};

/**
 * Inline empty state for a meal slot with no entry yet. Phase 10a stub —
 * tapping it shows a "Coming soon" alert; Phase 10b opens the swap modal.
 */
export default function EmptyMealSlot({ mealLabel }: Props) {
  return (
    <Pressable
      onPress={() =>
        Alert.alert(
          `Add ${mealLabel}`,
          'Coming soon — Phase 10b. Opens the swap modal to pick a meal.',
        )
      }
      style={styles.btn}
      accessibilityRole="button"
      accessibilityLabel={`Add ${mealLabel}`}
    >
      <Feather name="plus" size={14} color={Colors.textMuted} />
      <Text style={styles.text}>Add {mealLabel}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderColor: Colors.border,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
  },
  text: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
});
