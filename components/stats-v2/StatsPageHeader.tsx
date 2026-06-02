import { StyleSheet, Text, View } from 'react-native';
import { Font, Tabular } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import PulseDot from '../ds/PulseDot';

type Props = {
  daysTracked: number;
  lastEntryLabel: string; // "Last entry today" | "Last entry 2 days ago" | "No entries yet"
};

export default function StatsPageHeader({
  daysTracked,
  lastEntryLabel,
}: Props) {
  const t = useTokens();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: t.textPrimary }]}>Stats</Text>
      <View style={styles.bannerRow}>
        <PulseDot size={6} />
        <Text style={[styles.daysLabel, Tabular, { color: t.primary }]}>
          {daysTracked} {daysTracked === 1 ? 'DAY TRACKED' : 'DAYS TRACKED'}
        </Text>
        <Text style={[styles.dot, { color: t.textQuaternary }]}>·</Text>
        <Text style={[styles.lastEntry, { color: t.textSecondary }]}>{lastEntryLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    fontFamily: Font.bold,
    fontSize: 28,
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  daysLabel: {
    fontFamily: Font.semibold,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  dot: {
    fontSize: 11,
  },
  lastEntry: {
    fontFamily: Font.medium,
    fontSize: 11,
  },
});
