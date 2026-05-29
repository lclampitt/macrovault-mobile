import { StyleSheet, Text, View } from 'react-native';
import { DS, Font } from '../../lib/design-system';

type Props = {
  /** 13 weeks × 7 days (Mon=0..Sun=6), 0–4 intensity. */
  weeks: number[][];
};

const COLORS = [
  '#0F0F0F',
  'rgba(16, 185, 129, 0.2)',
  'rgba(16, 185, 129, 0.45)',
  'rgba(16, 185, 129, 0.7)',
  '#10B981',
];

const BORDERS = [
  '#141414',
  'rgba(16, 185, 129, 0.35)',
  'rgba(16, 185, 129, 0.5)',
  'rgba(16, 185, 129, 0.65)',
  DS.accent,
];

export default function ConsistencyHeatmap({ weeks }: Props) {
  return (
    <View style={styles.outer}>
      {/* Day labels column (M / W / F) */}
      <View style={styles.dayCol}>
        {['M', 'W', 'F'].map((d) => (
          <Text key={d} style={styles.dayLabel}>
            {d}
          </Text>
        ))}
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {weeks.map((week, wi) => (
          <View key={wi} style={styles.weekCol}>
            {week.map((intensity, di) => (
              <View
                key={di}
                style={[
                  styles.cell,
                  {
                    backgroundColor: COLORS[intensity] ?? COLORS[0],
                    borderColor: BORDERS[intensity] ?? BORDERS[0],
                  },
                ]}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flexDirection: 'row',
    gap: 8,
  },
  dayCol: {
    paddingTop: 6,
    gap: 9,
  },
  dayLabel: {
    fontFamily: Font.bold,
    fontSize: 8,
    color: DS.textQuaternary,
    height: 8,
    lineHeight: 8,
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    gap: 2,
  },
  weekCol: {
    flex: 1,
    gap: 2,
  },
  cell: {
    aspectRatio: 1,
    borderRadius: 2,
    borderWidth: 1,
  },
});
