import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';

type Props = {
  totals: { calories: number; protein: number; carbs: number; fat: number };
  goalKcal: number | null;
};

function fmtNumber(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export default function DayMacroTotals({ totals, goalKcal }: Props) {
  const pct =
    goalKcal && goalKcal > 0
      ? Math.min(Math.max(totals.calories / goalKcal, 0), 1) * 100
      : 0;
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <MacroTile value={fmtNumber(totals.calories)} unit="kcal" />
        <MacroTile value={`${fmtNumber(totals.protein)}g`} unit="protein" />
        <MacroTile value={`${fmtNumber(totals.carbs)}g`} unit="carbs" />
        <MacroTile value={`${fmtNumber(totals.fat)}g`} unit="fat" />
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

function MacroTile({ value, unit }: { value: string; unit: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.unit}>{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  value: {
    color: Colors.accentLight,
    fontSize: 22,
    fontWeight: '800',
  },
  unit: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.trackMuted,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
});
