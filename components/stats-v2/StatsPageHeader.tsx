import { StyleSheet, Text, View } from 'react-native';
import { DS, Font, Tabular } from '../../lib/design-system';
import PulseDot from '../ds/PulseDot';

type Props = {
  daysTracked: number;
  lastEntryLabel: string; // "Last entry today" | "Last entry 2 days ago" | "No entries yet"
};

export default function StatsPageHeader({
  daysTracked,
  lastEntryLabel,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Stats</Text>
      <View style={styles.bannerRow}>
        <PulseDot size={6} />
        <Text style={[styles.daysLabel, Tabular]}>
          {daysTracked} {daysTracked === 1 ? 'DAY TRACKED' : 'DAYS TRACKED'}
        </Text>
        <Text style={styles.dot}>·</Text>
        <Text style={styles.lastEntry}>{lastEntryLabel}</Text>
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
    color: DS.text,
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
    color: DS.accent,
    letterSpacing: 0.6,
  },
  dot: {
    color: DS.textDimmest,
    fontSize: 11,
  },
  lastEntry: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DS.textSecondary,
  },
});
