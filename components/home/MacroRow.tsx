import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';

type Props = {
  label: string;
  current: number;
  goal: number;
  unit: string;
  color: string;
};

export default function MacroRow({ label, current, goal, unit, color }: Props) {
  const isEmpty = current === 0;
  const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;

  return (
    <View style={styles.row}>
      <View style={styles.head}>
        <View style={styles.labelGroup}>
          <View style={[styles.dot, { backgroundColor: color }, isEmpty && styles.dotEmpty]} />
          <Text style={styles.label}>{label}</Text>
        </View>
        <Text style={styles.values}>
          {current}
          <Text style={styles.target}>
            /{goal}
            {unit}
          </Text>
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { backgroundColor: color, width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 4,
  },
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
    color: Colors.textPrimary,
    fontSize: 12,
  },
  values: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  target: {
    color: Colors.textHint,
  },
  track: {
    height: 4,
    borderRadius: 999,
    backgroundColor: Colors.trackMuted,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
