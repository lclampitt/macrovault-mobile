import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { addDays, fmtShort } from '../../hooks/useMealPlanWeek';

type Props = {
  weekStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
};

export default function WeekHeader({ weekStart, onPrevWeek, onNextWeek }: Props) {
  const sun = addDays(weekStart, 6);
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPrevWeek}
        hitSlop={10}
        style={styles.chevBtn}
        accessibilityRole="button"
        accessibilityLabel="Previous week"
      >
        <Feather name="chevron-left" size={20} color={Colors.textSecondary} />
      </Pressable>
      <Text style={styles.label}>
        {fmtShort(weekStart)} – {fmtShort(sun)}
      </Text>
      <Pressable
        onPress={onNextWeek}
        hitSlop={10}
        style={styles.chevBtn}
        accessibilityRole="button"
        accessibilityLabel="Next week"
      >
        <Feather name="chevron-right" size={20} color={Colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  chevBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderColor: Colors.border,
    borderWidth: 1,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
});
