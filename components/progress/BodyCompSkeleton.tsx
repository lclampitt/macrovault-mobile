import { StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { CHART_HEIGHT } from './BodyCompChart';

function CardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.valueBar} />
      <View style={styles.labelBar} />
    </View>
  );
}

export default function BodyCompSkeleton() {
  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        <View style={styles.row}>
          <CardSkeleton />
          <CardSkeleton />
        </View>
        <View style={styles.row}>
          <CardSkeleton />
          <CardSkeleton />
        </View>
      </View>
      <View style={styles.chart} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 16,
  },
  grid: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  valueBar: {
    width: '70%',
    height: 22,
    borderRadius: 6,
    backgroundColor: Colors.surfaceMuted,
  },
  labelBar: {
    width: '50%',
    height: 12,
    borderRadius: 4,
    backgroundColor: Colors.surfaceMuted,
  },
  chart: {
    height: CHART_HEIGHT,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
  },
});
