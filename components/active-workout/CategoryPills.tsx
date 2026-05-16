import { ScrollView, StyleSheet, Pressable, Text } from 'react-native';
import { Colors } from '../../constants/Colors';

// Matches WorkoutLogger.jsx MUSCLE_GROUPS (stored in workouts.muscle_group).
export const WORKOUT_CATEGORIES = [
  'Upper Body',
  'Lower Body',
  'Legs',
  'Full Body',
  'Core',
  'Cardio',
];

type Props = {
  selected: string | null;
  onSelect: (category: string | null) => void;
};

export default function CategoryPills({ selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {WORKOUT_CATEGORIES.map((cat) => {
        const active = selected === cat;
        return (
          <Pressable
            key={cat}
            onPress={() => onSelect(active ? null : cat)}
            style={[styles.pill, active && styles.pillActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.text, active && styles.textActive]}>{cat}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // flexGrow:0 keeps the horizontal ScrollView at content height instead of
  // stretching to fill the column between the header and the form.
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  row: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  pill: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentSoft,
  },
  text: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  textActive: {
    color: Colors.accentLight,
    fontWeight: '600',
  },
});
