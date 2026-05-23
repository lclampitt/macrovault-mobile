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
        <Feather name="chevron-left" size={17} color={Colors.textSecondary} />
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
        <Feather name="chevron-right" size={17} color={Colors.textSecondary} />
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
    paddingVertical: 4,
  },
  chevBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderColor: Colors.border,
    borderWidth: 1,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
});
