import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { DS, Font, Tabular } from '../../lib/design-system';
import { addDays } from '../../hooks/useMealPlanWeek';

type Props = {
  weekStart: Date;
  loggedKcal: number;
  targetKcalPerDay: number;
  onPrev: () => void;
  onNext: () => void;
};

function fmtNumber(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

function fmtShortDay(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function WeekNavigator({
  weekStart,
  loggedKcal,
  targetKcalPerDay,
  onPrev,
  onNext,
}: Props) {
  const sun = addDays(weekStart, 6);
  const weekTarget = targetKcalPerDay * 7;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPrev}
        style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Previous week"
      >
        <ChevronLeft size={16} color={DS.textSecondary} strokeWidth={2} />
      </Pressable>

      <View style={styles.center}>
        <Text style={styles.title}>
          {fmtShortDay(weekStart)} – {fmtShortDay(sun)}
        </Text>
        <Text style={[styles.subtitle, Tabular]}>
          <Text style={styles.subtitleValue}>{fmtNumber(loggedKcal)}</Text>{' '}
          / {fmtNumber(weekTarget)} kcal
        </Text>
      </View>

      <Pressable
        onPress={onNext}
        style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Next week"
      >
        <ChevronRight size={16} color={DS.textSecondary} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DS.border,
    backgroundColor: DS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    transform: [{ scale: 0.9 }],
  },
  center: {
    alignItems: 'center',
  },
  title: {
    fontFamily: Font.bold,
    fontSize: 14,
    color: DS.text,
  },
  subtitle: {
    fontFamily: Font.medium,
    fontSize: 10,
    color: DS.textTertiary,
    marginTop: 2,
  },
  subtitleValue: {
    color: DS.text,
  },
});
