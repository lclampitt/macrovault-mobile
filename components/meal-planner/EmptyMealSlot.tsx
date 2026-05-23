import { Pressable, StyleSheet, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

type Props = {
  mealLabel: string; // 'breakfast' | 'lunch' | 'dinner'
  onPress: () => void;
};

export default function EmptyMealSlot({ mealLabel, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.btn}
      accessibilityRole="button"
      accessibilityLabel={`Add ${mealLabel}`}
    >
      <Feather name="plus" size={12} color={Colors.textMuted} />
      <Text style={styles.text}>Add {mealLabel}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderColor: Colors.border,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
  },
  text: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
});
