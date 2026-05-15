import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import WeightSparkline from './WeightSparkline';

type Props = {
  current: number;
  unit: string;
  lastUpdated: string;
  history: number[];
};

export default function WeightCard({ current, unit, lastUpdated, history }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>WEIGHT</Text>
      <Text style={styles.value}>
        {current.toFixed(1)}
        <Text style={styles.valueSub}> {unit}</Text>
      </Text>
      <Text style={styles.caption}>{lastUpdated}</Text>
      <View style={styles.spark}>
        <WeightSparkline history={history} height={16} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  label: {
    color: Colors.textHint,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  value: {
    color: Colors.textPrimary,
    fontSize: 19,
    fontWeight: '500',
    letterSpacing: -0.4,
    lineHeight: 21,
    fontVariant: ['tabular-nums'],
  },
  valueSub: {
    color: Colors.textHint,
    fontSize: 10,
    fontWeight: '400',
  },
  caption: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  spark: {
    marginTop: 8,
  },
});
