import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme-context';
import type { Theme } from '../../lib/theme';
import WeightSparkline from './WeightSparkline';
import StatCardSkeleton from './skeletons/StatCardSkeleton';

type Props = {
  current: number | null;
  unit: string;
  lastAgo: string | null;
  history: number[];
  loading: boolean;
  error?: string | null;
};

export default function WeightCard({
  current,
  unit,
  lastAgo,
  history,
  loading,
  error,
}: Props) {
  const { theme: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);

  if (loading) return <StatCardSkeleton />;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>WEIGHT</Text>
      {error ? (
        <>
          <Text style={styles.value}>—</Text>
          <Text style={styles.errorText}>Failed to load</Text>
        </>
      ) : current == null ? (
        <>
          <Text style={styles.value}>—</Text>
          <Text style={styles.caption}>Add your first weight</Text>
        </>
      ) : (
        <>
          <Text style={styles.value}>
            {current.toFixed(1)}
            <Text style={styles.valueSub}> {unit}</Text>
          </Text>
          <Text style={styles.caption}>{lastAgo ? `last ${lastAgo}` : ' '}</Text>
          {history.length >= 2 ? (
            <View style={styles.spark}>
              <WeightSparkline history={history} height={16} />
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

function makeStyles(c: Theme) {
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: c.surface,
      borderColor: c.border,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    label: {
      color: c.textHint,
      fontSize: 9,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    value: {
      color: c.textPrimary,
      fontSize: 19,
      fontWeight: '500',
      letterSpacing: -0.4,
      lineHeight: 21,
      fontVariant: ['tabular-nums'],
    },
    valueSub: {
      color: c.textHint,
      fontSize: 10,
      fontWeight: '400',
    },
    caption: {
      color: c.textMuted,
      fontSize: 10,
      marginTop: 2,
    },
    errorText: {
      color: c.error,
      fontSize: 10,
      marginTop: 2,
    },
    spark: {
      marginTop: 8,
    },
  });
}
