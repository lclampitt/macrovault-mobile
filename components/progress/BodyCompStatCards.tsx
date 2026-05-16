import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { formatStat, type BodyCompStats } from '../../lib/bodyComp';

type Props = {
  stats: BodyCompStats;
};

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export default function BodyCompStatCards({ stats }: Props) {
  return (
    <View style={styles.grid}>
      <View style={styles.gridRow}>
        <StatCard
          value={formatStat(stats.currentWeight, ' lbs')}
          label="Current weight"
        />
        <StatCard
          value={formatStat(stats.currentBodyFat, '%')}
          label="Body fat %"
        />
      </View>
      <View style={styles.gridRow}>
        <StatCard
          value={formatStat(stats.weightChange, ' lbs')}
          label="Weight change"
        />
        <StatCard
          value={formatStat(stats.bodyFatChange, '%')}
          label="BF% change"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 10,
  },
  gridRow: {
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
  },
  value: {
    color: Colors.accentLight,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 4,
    fontVariant: ['tabular-nums'],
  },
  label: {
    color: Colors.textMuted,
    fontSize: 12,
  },
});
