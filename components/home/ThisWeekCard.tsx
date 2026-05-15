import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import StatCardSkeleton from './skeletons/StatCardSkeleton';

type Props = {
  completed: number;
  target: number;
  loading: boolean;
  error?: string | null;
};

export default function ThisWeekCard({ completed, target, loading, error }: Props) {
  if (loading) return <StatCardSkeleton />;

  const cells = Array.from({ length: target }, (_, i) => i < completed);
  const status = completed === 0 ? 'starting fresh' : 'workouts logged';

  return (
    <View style={styles.card}>
      <Text style={styles.label}>THIS WEEK</Text>
      {error ? (
        <>
          <Text style={styles.value}>—</Text>
          <Text style={styles.errorText}>Failed to load</Text>
        </>
      ) : (
        <>
          <Text style={styles.value}>
            {completed}
            <Text style={styles.valueSub}>/{target}</Text>
          </Text>
          <Text style={styles.caption}>{status}</Text>
          <View style={styles.strip}>
            {cells.map((on, i) => (
              <View key={i} style={[styles.cell, on && styles.cellFilled]} />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  label: {
    color: Colors.textHint,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  value: {
    color: Colors.textPrimary,
    fontSize: 19,
    fontWeight: '500',
    letterSpacing: -0.4,
    lineHeight: 21,
    fontVariant: ['tabular-nums'],
  },
  valueSub: {
    color: Colors.textHint,
    fontSize: 10,
    fontWeight: '400',
  },
  caption: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  errorText: {
    color: Colors.error,
    fontSize: 10,
    marginTop: 2,
  },
  strip: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 10,
  },
  cell: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.trackMuted,
  },
  cellFilled: {
    backgroundColor: Colors.accentLight,
  },
});
