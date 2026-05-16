import { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { Colors } from '../../constants/Colors';
import type { BodyCompEntry, BodyCompStats, TimeRange } from '../../lib/bodyComp';
import BodyCompStatCards from './BodyCompStatCards';
import BodyCompChart, { CHART_HEIGHT } from './BodyCompChart';
import ChartLegend from './ChartLegend';
import TimeRangePills from './TimeRangePills';
import BodyCompSkeleton from './BodyCompSkeleton';

type Props = {
  entries: BodyCompEntry[]; // range-filtered (chart)
  allEntries: BodyCompEntry[]; // full set (empty-state detection)
  stats: BodyCompStats;
  loading: boolean;
  error: string | null;
  timeRange: TimeRange;
  onRangeChange: (r: TimeRange) => void;
};

export default function BodyCompositionSection({
  entries,
  allEntries,
  stats,
  loading,
  error,
  timeRange,
  onRangeChange,
}: Props) {
  const [chartWidth, setChartWidth] = useState(0);

  const isEmpty = !loading && !error && allEntries.length === 0;

  function onChartLayout(e: LayoutChangeEvent) {
    const w = e.nativeEvent.layout.width;
    if (w !== chartWidth) setChartWidth(w);
  }

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>BODY COMPOSITION</Text>

      {loading ? (
        <BodyCompSkeleton />
      ) : error ? (
        <View style={styles.card}>
          <Text style={styles.errorText}>Failed to load body composition.</Text>
          <Text style={styles.errorSub}>{error}</Text>
        </View>
      ) : (
        <>
          <BodyCompStatCards stats={stats} />

          <View style={styles.chartCard}>
            {isEmpty ? (
              <View style={styles.emptyChart}>
                <Text style={styles.emptyTitle}>
                  No body composition data yet.
                </Text>
                <Text style={styles.emptySub}>
                  Log your weight and body fat % to see your trends here.
                </Text>
              </View>
            ) : entries.length === 0 ? (
              <View style={styles.emptyChart}>
                <Text style={styles.emptySub}>
                  No entries in this range. Try a longer range.
                </Text>
              </View>
            ) : (
              <View
                style={{ height: CHART_HEIGHT }}
                onLayout={onChartLayout}
              >
                {chartWidth > 0 ? (
                  <BodyCompChart
                    entries={entries}
                    width={chartWidth}
                    height={CHART_HEIGHT}
                  />
                ) : null}
              </View>
            )}
            <ChartLegend />
          </View>

          <TimeRangePills value={timeRange} onChange={onRangeChange} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 16,
  },
  heading: {
    color: Colors.textHint,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 20,
    gap: 6,
  },
  chartCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  emptyChart: {
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySub: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
  errorSub: {
    color: Colors.textMuted,
    fontSize: 12,
  },
});
