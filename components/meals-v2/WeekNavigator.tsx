import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Font, Tabular } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
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
  const t = useTokens();
  const sun = addDays(weekStart, 6);
  const weekTarget = targetKcalPerDay * 7;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPrev}
        style={({ pressed }) => [
          styles.iconBtn,
          { backgroundColor: t.bgCard, borderColor: t.borderDefault },
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Previous week"
      >
        <ChevronLeft size={16} color={t.textSecondary} strokeWidth={2} />
      </Pressable>

      <View style={styles.center}>
        <Text style={[styles.title, { color: t.textPrimary }]}>
          {fmtShortDay(weekStart)} – {fmtShortDay(sun)}
        </Text>
        <Text
          style={[styles.subtitle, Tabular, { color: t.textTertiary }]}
        >
          <Text style={{ color: t.textPrimary }}>{fmtNumber(loggedKcal)}</Text>{' '}
          / {fmtNumber(weekTarget)} kcal
        </Text>
      </View>

      <Pressable
        onPress={onNext}
        style={({ pressed }) => [
          styles.iconBtn,
          { backgroundColor: t.bgCard, borderColor: t.borderDefault },
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Next week"
      >
        <ChevronRight size={16} color={t.textSecondary} strokeWidth={2} />
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
  },
  subtitle: {
    fontFamily: Font.medium,
    fontSize: 10,
    marginTop: 2,
  },
});
