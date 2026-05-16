import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { TIME_RANGES, type TimeRange } from '../../lib/bodyComp';

type Props = {
  value: TimeRange;
  onChange: (r: TimeRange) => void;
};

export default function TimeRangePills({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {TIME_RANGES.map((tr) => {
        const selected = tr.key === value;
        return (
          <Pressable
            key={tr.key}
            onPress={() => onChange(tr.key)}
            style={[styles.pill, selected && styles.pillSelected]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${tr.label} range`}
          >
            <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
              {tr.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  pill: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSelected: {
    borderColor: Colors.accent,
  },
  pillText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  pillTextSelected: {
    color: Colors.accentLight,
    fontWeight: '600',
  },
});
