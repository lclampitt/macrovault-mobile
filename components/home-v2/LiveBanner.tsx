import { StyleSheet, Text, View } from 'react-native';
import { DS, Font, Tabular } from '../../lib/design-system';
import PulseDot from '../ds/PulseDot';

type Props = {
  /** "MORNING" | "NOON" | "EVENING" | "SNACK". Already upper-cased. */
  period: string;
  dayCount: number; // user's streak / day-since-onboard
};

/**
 * Live status banner under the header — pulsing dot + period + day count.
 * The literal clock time was removed app-wide in favor of period labels.
 */
export default function LiveBanner({ period, dayCount }: Props) {
  return (
    <View style={styles.row}>
      <PulseDot size={6} />
      <Text style={styles.label}>{period.toUpperCase()}</Text>
      <Text style={styles.dot}>·</Text>
      <Text style={[styles.meta, Tabular]}>Day {dayCount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  label: {
    fontFamily: Font.semibold,
    fontSize: 11,
    color: DS.accent,
    letterSpacing: 0.6,
  },
  dot: {
    color: DS.textDimmest,
    fontSize: 11,
  },
  meta: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DS.textTertiary,
  },
});
