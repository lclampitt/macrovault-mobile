import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';

type Props = {
  label: string; // "MON"
  dayNum: string; // "18"
  kcal: number;
  hasEntries: boolean;
  selected: boolean;
  onPress: () => void;
};

function fmtNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export default function DayPill({
  label,
  dayNum,
  kcal,
  hasEntries,
  selected,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, selected && styles.pillSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label} ${dayNum}, ${kcal} kcal`}
    >
      {hasEntries ? <View style={styles.dot} /> : null}
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
      <Text style={[styles.day, selected && styles.daySelected]}>{dayNum}</Text>
      <View style={styles.kcalPill}>
        <Text style={styles.kcalText}>
          {kcal > 0 ? `${fmtNumber(kcal)} kcal` : '—'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    width: 80,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderColor: Colors.border,
    borderWidth: 1,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    gap: 1,
    position: 'relative',
  },
  pillSelected: {
    borderColor: Colors.borderAccent,
    backgroundColor: Colors.accentSoft,
  },
  dot: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.accentLight,
  },
  label: {
    color: Colors.accentLight,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  labelSelected: {
    color: Colors.accentLight,
  },
  day: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  daySelected: {
    color: Colors.textPrimary,
  },
  kcalPill: {
    marginTop: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: Colors.surfaceMuted,
  },
  kcalText: {
    color: Colors.textMuted,
    fontSize: 9,
  },
});
