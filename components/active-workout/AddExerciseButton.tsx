import { Pressable, StyleSheet, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

export default function AddExerciseButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Add Exercise"
    >
      <Feather name="plus" size={16} color={Colors.accentLight} />
      <Text style={styles.text}>Add Exercise</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.borderAccentSoft,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    color: Colors.accentLight,
    fontSize: 15,
    fontWeight: '600',
  },
});
