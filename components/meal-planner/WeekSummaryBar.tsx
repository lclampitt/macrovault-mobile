import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { addDays, fmtShort } from '../../hooks/useMealPlanWeek';

type Props = {
  weekStart: Date;
  loggedKcal: number;
  goalKcalPerDay: number | null;
};

function fmtNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export default function WeekSummaryBar({
  weekStart,
  loggedKcal,
  goalKcalPerDay,
}: Props) {
  const sun = addDays(weekStart, 6);
  const goalWeek = goalKcalPerDay ? goalKcalPerDay * 7 : null;
  return (
    <View style={styles.bar}>
      <Text style={styles.text}>
        <Text style={styles.muted}>Week of </Text>
        <Text style={styles.muted}>
          {fmtShort(weekStart)}–{fmtShort(sun)}
        </Text>
        <Text style={styles.muted}> · </Text>
        <Text style={styles.value}>{fmtNumber(loggedKcal)}</Text>
        <Text style={styles.muted}> / {goalWeek ? fmtNumber(goalWeek) : '—'} kcal</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  text: {
    fontSize: 12,
  },
  muted: {
    color: Colors.textMuted,
  },
  value: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
});
