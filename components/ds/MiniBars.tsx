import { StyleSheet, View } from 'react-native';
import { DS } from '../../lib/design-system';

type Props = {
  /** Each value is 0-1 height ratio. */
  values: number[];
  /** Index of the highlighted (emerald) bar; -1 for none. Defaults to last. */
  highlightIndex?: number;
  height?: number;
};

/**
 * Thin 4-8px bars, rounded-sm, #1A1A1A inactive / #10B981 highlighted.
 * Used in the Volume·7d tile.
 */
export default function MiniBars({
  values,
  highlightIndex,
  height = 24,
}: Props) {
  const hi = highlightIndex ?? values.length - 1;
  return (
    <View style={[styles.row, { height }]}>
      {values.map((v, i) => (
        <View
          key={i}
          style={[
            styles.bar,
            {
              height: `${Math.max(2, Math.min(100, v * 100))}%`,
              backgroundColor: i === hi ? DS.accent : DS.border,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    width: '100%',
  },
  bar: {
    flex: 1,
    borderRadius: 2,
  },
});
