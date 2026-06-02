import { StyleSheet, View } from 'react-native';
import { useTokens } from '../../lib/theme-context';

type Props = {
  /** Each value is 0-1 height ratio. */
  values: number[];
  /** Index of the highlighted bar; -1 for none. Defaults to last. */
  highlightIndex?: number;
  height?: number;
};

/**
 * Thin bars. Highlighted bar gets the brand emerald, others use the
 * theme's track color (warm beige in light, near-black in dark).
 */
export default function MiniBars({
  values,
  highlightIndex,
  height = 24,
}: Props) {
  const t = useTokens();
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
              backgroundColor: i === hi ? t.primary : t.bgTrack,
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
