import { ScrollView, StyleSheet, Pressable, Text } from 'react-native';
import { Colors } from '../../constants/Colors';
import { EXERCISE_CATEGORIES } from '../../lib/exercises';

type Props = {
  selected: string;
  onSelect: (c: string) => void;
};

export default function ExerciseCategoryPills({ selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {EXERCISE_CATEGORIES.map((cat) => {
        const active = selected === cat;
        return (
          <Pressable
            key={cat}
            onPress={() => onSelect(cat)}
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
  row: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  pill: {
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
