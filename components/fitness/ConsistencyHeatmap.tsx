import { StyleSheet, Text, View } from 'react-native';
import { Font } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import { alphaize } from '../../lib/tokens';

type Props = {
  /** 13 weeks × 7 days (Mon=0..Sun=6), 0–4 intensity. */
  weeks: number[][];
};

export default function ConsistencyHeatmap({ weeks }: Props) {
  const t = useTokens();

  // Filled-cell colors (1–4) are derived from t.primary so they swap
  // emerald → rose in Sakura. Index 0 (empty) is theme-aware so the grid
  // reads well on cream backgrounds.
  const colors = [
    t.activityEmpty,
    alphaize(t.primary, 0.2),
    alphaize(t.primary, 0.45),
    alphaize(t.primary, 0.7),
    t.primary,
  ];
  const borders = [
    t.borderSubtle,
    alphaize(t.primary, 0.35),
    alphaize(t.primary, 0.5),
    alphaize(t.primary, 0.65),
    t.primary,
  ];

  return (
    <View style={styles.outer}>
      {/* Day labels column (M / W / F) */}
      <View style={styles.dayCol}>
        {['M', 'W', 'F'].map((d) => (
          <Text key={d} style={[styles.dayLabel, { color: t.textQuaternary }]}>
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
                    backgroundColor: colors[intensity] ?? colors[0],
                    borderColor: borders[intensity] ?? borders[0],
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
