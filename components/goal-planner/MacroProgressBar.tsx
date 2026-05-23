import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';

type Props = {
  label: string;
  value: number; // grams
  max: number; // sum of all macro grams (composition denominator, matches web)
  color: string;
};

export default function MacroProgressBar({ label, value, max, color }: Props) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}g</Text>
      </View>
      <View style={styles.track}>
        <View
          style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  label: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  value: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
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
  },
});
