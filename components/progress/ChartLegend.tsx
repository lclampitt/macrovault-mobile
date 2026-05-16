import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { Colors } from '../../constants/Colors';

function Marker({ color, dashed }: { color: string; dashed?: boolean }) {
  return (
    <Svg width={26} height={10}>
      <Line
        x1={0}
        y1={5}
        x2={26}
        y2={5}
        stroke={color}
        strokeWidth={2}
        strokeDasharray={dashed ? '4,3' : undefined}
      />
      <Circle cx={13} cy={5} r={3} fill={color} />
    </Svg>
  );
}

export default function ChartLegend() {
  return (
    <View style={styles.row}>
      <View style={styles.item}>
        <Marker color={Colors.chartWeightLine} />
        <Text style={styles.label}>Weight (lbs)</Text>
      </View>
      <View style={styles.item}>
        <Marker color={Colors.chartBodyFatLine} dashed />
        <Text style={styles.label}>BF%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  label: {
    color: Colors.textMuted,
    fontSize: 12,
  },
});
