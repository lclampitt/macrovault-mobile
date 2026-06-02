import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ArrowUpRight, Flame } from 'lucide-react-native';
import { Font, Radius, Tabular } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import Card from '../ds/Card';
import MiniBars from '../ds/MiniBars';

export type BurnRange = 'today' | '7d' | '30d';

export type BurnSeries = {
  value: number; // kcal
  delta: string; // "+8%" or "−3%"
  deltaLabel: string; // "vs daily avg"
  bars: number[]; // 0-1 bar heights
  activeIndex: number; // which bar is emerald
};

export type CaloriesBurnedData = Record<BurnRange, BurnSeries>;

type Props = {
  data: CaloriesBurnedData;
  initialRange?: BurnRange;
};

const RANGES: { key: BurnRange; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
];

function fmtNumber(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export default function CaloriesBurnedTile({
  data,
  initialRange = '7d',
}: Props) {
  const t = useTokens();
  const [range, setRange] = useState<BurnRange>(initialRange);
  const series = data[range];

  return (
    <Card style={styles.tile}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Flame size={12} color={t.primary} strokeWidth={2.5} />
          <Text style={[styles.label, { color: t.textTertiary }]}>BURNED</Text>
        </View>
        <ArrowUpRight size={14} color={t.primary} strokeWidth={2.5} />
      </View>

      {/* Segmented range toggle */}
      <View
        style={[
          styles.segments,
          {
            backgroundColor: t.bgCardElevated,
            borderColor: t.borderDefault,
          },
        ]}
      >
        {RANGES.map((r) => {
          const active = range === r.key;
          return (
            <Pressable
              key={r.key}
              onPress={() => setRange(r.key)}
              style={[
                styles.segment,
                active && { backgroundColor: t.primary },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={r.label}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: active ? t.textOnPrimary : t.textTertiary },
                ]}
              >
                {r.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Value + bars — re-mount on range change so FadeIn replays. */}
      <Animated.View key={range} entering={FadeIn.duration(250)}>
        <View style={styles.valueRow}>
          <Text style={[styles.value, Tabular, { color: t.textPrimary }]}>
            {fmtNumber(series.value)}
          </Text>
          <Text style={[styles.unit, { color: t.textSecondary }]}>kcal</Text>
        </View>
        <Text style={[styles.meta, Tabular, { color: t.textSecondary }]}>
          <Text style={{ color: t.primary }}>{series.delta}</Text>{' '}
          {series.deltaLabel}
        </Text>
        <View style={styles.barsWrap}>
          <MiniBars
            values={series.bars}
            highlightIndex={series.activeIndex}
            height={24}
          />
        </View>
      </Animated.View>
    </Card>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  segments: {
    flexDirection: 'row',
    gap: 2,
    padding: 2,
    borderRadius: Radius.cardCompact - 4,
    borderWidth: 1,
    marginBottom: 10,
  },
  segment: {
    flex: 1,
    paddingVertical: 4,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontFamily: Font.bold,
    fontSize: 10,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontFamily: Font.bold,
    fontSize: 26,
    letterSpacing: -0.6,
  },
  unit: {
    fontFamily: Font.medium,
    fontSize: 11,
  },
  meta: {
    fontFamily: Font.medium,
    fontSize: 11,
    marginTop: 6,
  },
  barsWrap: {
    marginTop: 8,
  },
});
