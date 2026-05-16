import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme-context';

type Props = {
  label: string;
  current: number;
  goal: number;
  unit: string;
  color: string;
};

export default function MacroRow({ label, current, goal, unit, color }: Props) {
  const { theme: c } = useTheme();
  const isEmpty = current === 0;
  const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;

  return (
    <View style={styles.row}>
      <View style={styles.head}>
        <View style={styles.labelGroup}>
          <View
            style={[styles.dot, { backgroundColor: color }, isEmpty && styles.dotEmpty]}
          />
          <Text style={[styles.label, { color: c.textPrimary }]}>{label}</Text>
        </View>
        <Text style={[styles.values, { color: c.textSecondary }]}>
          {current}
          <Text style={{ color: c.textHint }}>
            /{goal}
            {unit}
          </Text>
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: c.trackMuted }]}>
        <View style={[styles.fill, { backgroundColor: color, width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: 4 },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  dotEmpty: {
    opacity: 0.4,
  },
  label: {
    fontSize: 12,
  },
  values: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
