import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import {
  ChevronDown,
  LineChart,
  Plus,
  Ruler,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react-native';
import { Font, Motion, Tabular } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import {
  deltaIsGood,
  formatMetricValue,
  type Metric,
} from '../../lib/metrics-catalog';
import {
  useMetricsOverview,
  type MetricOverviewRow,
} from '../../hooks/useMetricsOverview';
import LogMetricSheet from '../metrics/LogMetricSheet';

const DESTRUCTIVE = '#A87C5E';
const EXPAND_KEY = 'mv.measurements.advancedExpanded';
const PRIMARY_IDS = new Set(['weight', 'bodyfat']);

/**
 * Simplified body of the Measurements feature. Renders WITHOUT a
 * SafeAreaView or back-button header so it can mount cleanly as the body
 * of the Stats > Measurements sub-tab.
 *
 * Layout (per IA simplification spec):
 *   1. Status banner: "X of N TRACKED · Tap any tile to log"
 *   2. Primary tiles (always visible): Weight, Body Fat — full-width 2-up
 *   3. "Track more body metrics" expandable — collapsed by default,
 *      persisted per-user via AsyncStorage. Expands to a 2×3 grid of the
 *      six circumference metrics (Waist, Abdomen, Glutes, Chest,
 *      Shoulders, Arms).
 *   4. "Add custom measurement" button (placeholder, same as before).
 *
 * The standalone "Run body fat analyzer" CTA from the old page is GONE —
 * the analyzer is now an "Enter manually / Use analyzer" toggle inside
 * the Body Fat log sheet itself.
 */
export default function MeasurementsContent() {
  const t = useTokens();
  const router = useRouter();
  const { rows, refetch } = useMetricsOverview();
  const [activeMetric, setActiveMetric] = useState<Metric | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Hydrate the expanded preference (lazy — show collapsed until storage
  // resolves so first paint is never jarring).
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(EXPAND_KEY)
      .then((v) => {
        if (active && v === '1') setExpanded(true);
      })
      .catch(() => {
        /* non-fatal */
      });
    return () => {
      active = false;
    };
  }, []);

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      void AsyncStorage.setItem(EXPAND_KEY, next ? '1' : '0').catch(() => {});
      return next;
    });
  }, []);

  // Chevron rotation. Animated value reflects expanded state (0 → closed,
  // 1 → open). 240ms ease-out feels matched to the section reveal.
  const rot = useSharedValue(0);
  useEffect(() => {
    rot.value = withTiming(expanded ? 1 : 0, { duration: 240 });
  }, [expanded, rot]);
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value * 180}deg` }],
  }));

  // Bucket rows into primary (Weight + Body Fat) and advanced (others).
  // The catalog ordering puts primary first already but we filter by id
  // so reordering the catalog later doesn't silently break this.
  const { primaryRows, advancedRows } = useMemo(() => {
    const p: MetricOverviewRow[] = [];
    const a: MetricOverviewRow[] = [];
    for (const row of rows) {
      (PRIMARY_IDS.has(row.metric.id) ? p : a).push(row);
    }
    // Pin Weight before Body Fat for a stable visual order.
    p.sort((x, y) => (x.metric.id === 'weight' ? -1 : 1));
    return { primaryRows: p, advancedRows: a };
  }, [rows]);

  const loggedCount = useMemo(
    () => rows.filter((r) => r.current != null).length,
    [rows],
  );

  function openSheet(metric: Metric) {
    setActiveMetric(metric);
  }

  function viewTrend(metric: Metric) {
    router.push({
      pathname: '/progress',
      params: { metric: metric.id },
    });
  }

  function handleCustomMetric() {
    Alert.alert(
      'Custom measurements',
      'Custom metrics (e.g. Neck, Calf) are next pass. The schema is ready — wiring the add-metric sheet is the remaining step.',
    );
  }

  return (
    <View style={styles.wrap}>
      {/* Status banner */}
      <View style={styles.statusRow}>
        <View style={[styles.pulseDot, { backgroundColor: t.primary }]} />
        <Text style={[styles.statusActive, { color: t.primary }]}>
          {loggedCount} of {rows.length} TRACKED
        </Text>
        <Text style={[styles.statusMuted, { color: t.textTertiary }]}>· Tap any tile to log</Text>
      </View>

      {/* Primary tiles — Weight + Body Fat */}
      <View style={styles.primaryGrid}>
        {primaryRows.map((row, i) => (
          <Animated.View
            key={row.metric.id}
            entering={FadeInDown.duration(Motion.durationRise).delay(
              40 + i * Motion.staggerStep,
            )}
            style={styles.tileSlot}
          >
            <MetricTile
              row={row}
              onPress={() => openSheet(row.metric)}
              onChart={() => viewTrend(row.metric)}
            />
          </Animated.View>
        ))}
      </View>

      {/* "Track more body metrics" toggle */}
      <Pressable
        onPress={toggleExpanded}
        style={({ pressed }) => [
          styles.expandBtn,
          { backgroundColor: t.bgCard, borderColor: t.borderDefault },
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          expanded
            ? 'Hide additional body metrics'
            : 'Show additional body metrics'
        }
        accessibilityState={{ expanded }}
      >
        <View style={styles.expandLeft}>
          <View
            style={[
              styles.expandIcon,
              { backgroundColor: t.bgCardElevated, borderColor: t.borderDefault },
            ]}
          >
            <Ruler size={13} color={t.primary} strokeWidth={2.5} />
          </View>
          <View>
            <Text style={[styles.expandTitle, { color: t.textPrimary }]}>Track more body metrics</Text>
            <Text style={[styles.expandSub, { color: t.textTertiary }]}>
              Waist, chest, arms, and more
            </Text>
          </View>
        </View>
        <Animated.View style={chevronStyle}>
          <ChevronDown size={14} color={t.textTertiary} strokeWidth={2.5} />
        </Animated.View>
      </Pressable>

      {/* Advanced grid — only rendered when expanded so the layout
          collapses cleanly. Reanimated entering animations replay each
          time it mounts, which feels like a smooth reveal. */}
      {expanded ? (
        <View style={styles.advancedGrid}>
          {advancedRows.map((row, i) => (
            <Animated.View
              key={row.metric.id}
              entering={FadeInDown.duration(220).delay(20 + i * 30)}
              style={styles.tileSlot}
            >
              <MetricTile
                row={row}
                onPress={() => openSheet(row.metric)}
                onChart={() => viewTrend(row.metric)}
              />
            </Animated.View>
          ))}
        </View>
      ) : null}

      <Pressable
        onPress={handleCustomMetric}
        style={({ pressed }) => [
          styles.addCustomBtn,
          { backgroundColor: t.bgCard, borderColor: t.borderStrong },
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Add custom measurement"
      >
        <Plus size={14} color={t.textSecondary} strokeWidth={3} />
        <Text style={[styles.addCustomLabel, { color: t.textSecondary }]}>Add custom measurement</Text>
      </Pressable>

      <View style={styles.helperRow}>
        <View style={[styles.helperDot, { backgroundColor: t.textQuaternary }]} />
        <Text style={[styles.helperText, { color: t.textTertiary }]}>
          Tap the chart icon on any tile to view trends and history.
        </Text>
      </View>

      <LogMetricSheet
        visible={activeMetric != null}
        metric={activeMetric}
        onClose={() => setActiveMetric(null)}
        onSaved={() => {
          void refetch();
        }}
      />
    </View>
  );
}

// --------------------------------------------------------------------------
// MetricTile — kept identical in behavior to the previous file. Lifted
// here verbatim so removing app/measurements.tsx doesn't break this file.
// --------------------------------------------------------------------------

function MetricTile({
  row,
  onPress,
  onChart,
}: {
  row: MetricOverviewRow;
  onPress: () => void;
  onChart: () => void;
}) {
  const t = useTokens();
  const { metric, current, delta, lastLoggedAt } = row;
  const hasData = current != null;
  const Icon: LucideIcon = metric.icon;

  if (!hasData) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.tile,
          { backgroundColor: t.bgCard, borderColor: t.borderDefault },
          styles.tileEmpty,
          { borderColor: t.borderStrong },
          pressed && [styles.tilePressed, { borderColor: t.primaryBorderStrong }],
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${metric.name}, not yet logged. Tap to log first entry.`}
      >
        <View style={styles.tileHeaderRow}>
          <Icon size={12} color={t.textQuaternary} strokeWidth={2} />
          <Text style={[styles.tileLabelDim, { color: t.textQuaternary }]}>{metric.name.toUpperCase()}</Text>
        </View>
        <View style={styles.tileValueRow}>
          <Text style={[styles.tileValueDim, Tabular, { color: t.textQuaternary }]}>—</Text>
          <Text style={[styles.tileUnitDim, { color: t.textQuaternary }]}>{metric.unit}</Text>
        </View>
        <View style={styles.tileFooterRow}>
          <Plus size={10} color={t.textTertiary} strokeWidth={3} />
          <Text style={[styles.tileEmptyCta, { color: t.textTertiary }]}>Tap to log</Text>
        </View>
      </Pressable>
    );
  }

  const showDelta = delta != null && Math.abs(delta) >= 0.05;
  const positive = (delta ?? 0) > 0;
  const DeltaIcon = positive ? TrendingUp : TrendingDown;
  const deltaColor =
    delta != null && deltaIsGood(metric, delta) ? t.primary : DESTRUCTIVE;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: t.bgCard, borderColor: t.borderDefault },
        pressed && [styles.tilePressed, { borderColor: t.primaryBorderStrong }],
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${metric.name}, ${formatMetricValue(current, metric)} ${metric.unit}. Tap to log a new entry.`}
    >
      <View style={styles.tileHeaderRow}>
        <View style={[styles.tileIconWrap, { backgroundColor: t.primaryTintBg }]}>
          <Icon size={10} color={t.primary} strokeWidth={2.5} />
        </View>
        <Text style={[styles.tileLabel, { color: t.textSecondary }]}>{metric.name.toUpperCase()}</Text>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onChart();
          }}
          hitSlop={6}
          style={styles.chartIconBtn}
          accessibilityRole="button"
          accessibilityLabel={`View ${metric.name} trend chart`}
        >
          <LineChart size={12} color={t.textTertiary} strokeWidth={2.5} />
        </Pressable>
      </View>
      <View style={styles.tileValueRow}>
        <Text style={[styles.tileValue, Tabular, { color: t.textPrimary }]}>
          {formatMetricValue(current, metric)}
        </Text>
        <Text style={[styles.tileUnit, { color: t.textTertiary }]}>{metric.unit}</Text>
      </View>
      <View style={styles.tileFooterRow}>
        {showDelta ? (
          <>
            <DeltaIcon size={10} color={deltaColor} strokeWidth={2.5} />
            <Text style={[styles.tileDelta, { color: deltaColor }]}>
              {delta! > 0 ? '+' : ''}
              {delta!.toFixed(metric.decimals)} {metric.unit}
            </Text>
          </>
        ) : (
          <Text style={[styles.tileDeltaIdle, { color: t.textQuaternary }]}>no change</Text>
        )}
        <Text style={[styles.tileAge, { color: t.textTertiary }]}>{relativeAge(lastLoggedAt)}</Text>
      </View>
    </Pressable>
  );
}

function relativeAge(iso: string | null): string {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} wk ago`;
  return `${Math.floor(days / 30)} mo ago`;
}

const styles = StyleSheet.create({
  wrap: { gap: 0 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusActive: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  statusMuted: {
    fontFamily: Font.medium,
    fontSize: 10,
  },
  pressed: { opacity: 0.85 },
  primaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  tileSlot: { flexBasis: '47%', flexGrow: 1 },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
  },
  expandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  expandIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandTitle: {
    fontFamily: Font.bold,
    fontSize: 12,
  },
  expandSub: {
    fontFamily: Font.medium,
    fontSize: 10,
    marginTop: 2,
  },
  advancedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tile: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 14,
    gap: 6,
  },
  tileEmpty: {
    borderStyle: 'dashed',
  },
  tilePressed: {
    transform: [{ scale: 0.97 }],
  },
  tileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tileIconWrap: {
    width: 16,
    height: 16,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontFamily: Font.bold,
    fontSize: 9,
    letterSpacing: 1,
  },
  tileLabelDim: {
    fontFamily: Font.bold,
    fontSize: 9,
    letterSpacing: 1,
  },
  chartIconBtn: { opacity: 0.6 },
  tileValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  tileValue: {
    fontFamily: Font.extrabold,
    fontSize: 22,
    letterSpacing: -0.4,
    lineHeight: 24,
  },
  tileValueDim: {
    fontFamily: Font.extrabold,
    fontSize: 20,
    letterSpacing: -0.4,
  },
  tileUnit: {
    fontFamily: Font.bold,
    fontSize: 10,
  },
  tileUnitDim: {
    fontFamily: Font.bold,
    fontSize: 9,
  },
  tileFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tileDelta: {
    fontFamily: Font.bold,
    fontSize: 9,
    fontVariant: ['tabular-nums'],
  },
  tileDeltaIdle: {
    fontFamily: Font.medium,
    fontSize: 9,
  },
  tileEmptyCta: {
    fontFamily: Font.bold,
    fontSize: 9,
  },
  tileAge: {
    fontFamily: Font.medium,
    fontSize: 9,
    marginLeft: 'auto',
  },
  addCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    marginBottom: 14,
  },
  addCustomLabel: {
    fontFamily: Font.bold,
    fontSize: 11,
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 4,
  },
  helperDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginTop: 5,
  },
  helperText: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: 10,
    lineHeight: 14,
  },
});
