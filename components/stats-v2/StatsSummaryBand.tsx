import { StyleSheet, Text, View } from 'react-native';
import { DS, Font, Tabular } from '../../lib/design-system';

type Props = {
  low: number;
  high: number;
  avg: number;
  change: number;
  /** 1 for weight (170), 1 for body fat (21.0). */
  decimals?: number;
};

function fmt(n: number, decimals: number, withSign = false): string {
  const sign = withSign ? (n > 0 ? '+' : n < 0 ? '−' : '') : '';
  const abs = withSign ? Math.abs(n) : n;
  return `${sign}${abs.toFixed(decimals)}`;
}

export default function StatsSummaryBand({
  low,
  high,
  avg,
  change,
  decimals = 1,
}: Props) {
  const stats: Array<{ label: string; value: string; isChange?: boolean }> = [
    { label: 'Low', value: fmt(low, decimals) },
    { label: 'High', value: fmt(high, decimals) },
    { label: 'Avg', value: fmt(avg, decimals) },
    { label: 'Change', value: fmt(change, decimals, true), isChange: true },
  ];

  // Change color: emerald for either direction by default (user intent unknown).
  // Per spec: "for now, treat both directions as positive emerald since we
  // don't know user intent."
  const changeColor = change === 0 ? DS.textSecondary : DS.accent;

  return (
    <View style={styles.row}>
      {stats.map((s, i) => (
        <View key={i} style={styles.col}>
          <Text style={styles.label}>{s.label.toUpperCase()}</Text>
          <Text
            style={[
              styles.value,
              Tabular,
              s.isChange ? { color: changeColor } : null,
            ]}
          >
            {s.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: DS.border,
  },
  col: {
    flex: 1,
  },
  label: {
    fontFamily: Font.semibold,
    fontSize: 9,
    color: DS.textTertiary,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  value: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: DS.text,
  },
});
