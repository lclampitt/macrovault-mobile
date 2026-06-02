import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Dumbbell,
  FlaskConical,
  History,
  Plus,
  Scale,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react-native';
import { Font, Radius, Tabular } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import { TIME_RANGES, type TimeRange } from '../../lib/bodyComp';
import {
  DEFAULT_METRICS,
  deltaIsGood,
  findMetric,
  formatMetricValue,
  type Metric,
} from '../../lib/metrics-catalog';
import { useMetricsOverview } from '../../hooks/useMetricsOverview';
import { useMetricEntries } from '../../hooks/useMetricEntries';
import LogMetricSheet from '../metrics/LogMetricSheet';
import MetricLineChart from '../metrics/MetricLineChart';
import ActivityContent from '../activity/ActivityContent';
import MeasurementsContent from '../measurements/MeasurementsContent';

const DESTRUCTIVE = '#A87C5E';

type Domain = 'body' | 'strength' | 'nutrition';
// Top-level IA tab — Stats is now the consolidated data hub.
//   • overview     → the existing metric drill-down (Body/Strength/Nutrition)
//   • activity     → embedded ActivityContent (formerly /activity)
//   • measurements → embedded MeasurementsContent (formerly /measurements)
type IATab = 'overview' | 'activity' | 'measurements';

function parseIATab(value: unknown): IATab {
  if (value === 'activity' || value === 'measurements') return value;
  return 'overview';
}

export default function StatsDashboardV2() {
  const t = useTokens();
  const router = useRouter();
  const params = useLocalSearchParams<{ metric?: string; tab?: string }>();
  const initialMetricId = (params.metric as string) || 'weight';

  const [iaTab, setIaTab] = useState<IATab>(() => parseIATab(params.tab));
  const [domain, setDomain] = useState<Domain>('body');
  const [activeId, setActiveId] = useState<string>(initialMetricId);
  const [range, setRange] = useState<TimeRange>('1M');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [logSheetOpen, setLogSheetOpen] = useState(false);

  // If a deep-link arrives mid-mount, switch to it.
  useEffect(() => {
    if (params.metric && typeof params.metric === 'string') {
      setActiveId(params.metric);
    }
  }, [params.metric]);

  // Deep-link `?tab=activity` etc. — keep state in sync if a redirect
  // (e.g. /activity → /progress?tab=activity) lands mid-session.
  useEffect(() => {
    if (params.tab) setIaTab(parseIATab(params.tab));
  }, [params.tab]);

  const metric = useMemo<Metric>(
    () => findMetric(activeId) ?? DEFAULT_METRICS[0],
    [activeId],
  );
  const { rows, refetch: refetchOverview } = useMetricsOverview();
  const { entries, current, delta, lastLoggedAt, refetch: refetchEntries } =
    useMetricEntries(metric.id, range);

  const trackedMetrics = useMemo(
    () => rows.filter((r) => r.current != null),
    [rows],
  );

  const summary = useMemo(() => {
    if (entries.length === 0) return null;
    const vals = entries.map((e) => e.value);
    const low = Math.min(...vals);
    const high = Math.max(...vals);
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    const change = +(vals[vals.length - 1] - vals[0]).toFixed(2);
    return { low, high, avg, change };
  }, [entries]);

  const lastLabel = useMemo(() => {
    if (!lastLoggedAt) return 'No entries yet';
    const ago = Math.floor(
      (Date.now() - new Date(lastLoggedAt).getTime()) / 86_400_000,
    );
    if (ago <= 0) return 'Last entry today';
    if (ago === 1) return 'Last entry yesterday';
    return `Last entry ${ago} days ago`;
  }, [lastLoggedAt]);

  const Icon: LucideIcon = metric.icon;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page title */}
        <Text style={[styles.pageTitle, { color: t.textPrimary }]}>Stats</Text>
        {iaTab === 'overview' ? (
          <View style={styles.bannerRow}>
            <View style={[styles.pulseDot, { backgroundColor: t.primary }]} />
            <Text style={[styles.bannerActive, { color: t.primary }]}>
              {entries.length} days tracked
            </Text>
            <Text style={[styles.bannerMuted, { color: t.textTertiary }]}>· {lastLabel}</Text>
          </View>
        ) : (
          <View style={styles.bannerSpacer} />
        )}

        {/* IA tab — Overview / Activity / Measurements */}
        <View style={[styles.iaTabRow, { backgroundColor: t.bgCard, borderColor: t.borderDefault }]}>
          {(
            [
              { key: 'overview', label: 'Overview' },
              { key: 'activity', label: 'Activity' },
              { key: 'measurements', label: 'Measurements' },
            ] as const
          ).map((tab) => {
            const active = iaTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setIaTab(tab.key)}
                style={[
                  styles.iaTabChip,
                  active && [
                    styles.iaTabChipActive,
                    { backgroundColor: t.primaryTintBg, borderColor: t.primaryBorderStrong },
                  ],
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text
                  style={[
                    styles.iaTabLabel,
                    { color: t.textSecondary },
                    active && { color: t.primary },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {iaTab === 'activity' ? (
          <ActivityContent />
        ) : iaTab === 'measurements' ? (
          <MeasurementsContent />
        ) : (
          <OverviewSection />
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <LogMetricSheet
        visible={logSheetOpen}
        metric={metric}
        onClose={() => setLogSheetOpen(false)}
        onSaved={() => {
          void refetchOverview();
          void refetchEntries();
        }}
      />
    </SafeAreaView>
  );

  /**
   * Inline render helper for the Overview sub-tab — the original Stats
   * body (Body/Strength/Nutrition domain toggle + picker + chart + CTAs).
   * Kept inline so it can close over the parent's local state.
   */
  function OverviewSection() {
    return (
      <>
        {/* Domain sub-nav */}
        <View style={styles.subNavRow}>
          {(
            [
              { key: 'body', label: 'Body', Icon: Scale },
              { key: 'strength', label: 'Strength', Icon: Dumbbell },
              { key: 'nutrition', label: 'Nutrition', Icon: FlaskConical },
            ] as const
          ).map((s) => {
            const active = domain === s.key;
            return (
              <Pressable
                key={s.key}
                onPress={() => setDomain(s.key)}
                style={[
                  styles.subNavChip,
                  { backgroundColor: t.bgCard, borderColor: t.borderDefault },
                  active && [
                    styles.subNavChipActive,
                    { backgroundColor: t.primaryTintBg, borderColor: t.primaryBorderStrong },
                  ],
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <s.Icon
                  size={14}
                  color={active ? t.primary : t.textSecondary}
                  strokeWidth={2.5}
                />
                <Text
                  style={[
                    styles.subNavLabel,
                    { color: t.textSecondary },
                    active && { color: t.primary },
                  ]}
                >
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {domain !== 'body' ? (
          <View style={[styles.placeholderCard, { backgroundColor: t.bgCard, borderColor: t.borderDefault }]}>
            <Text style={[styles.placeholderText, { color: t.textTertiary }]}>
              {domain === 'strength'
                ? 'Strength stats coming in the next pass.'
                : 'Nutrition stats coming in the next pass.'}
            </Text>
          </View>
        ) : (
          <>
            {/* Metric picker */}
            <Pressable
              onPress={() => setPickerOpen((v) => !v)}
              style={({ pressed }) => [
                styles.pickerCard,
                { backgroundColor: t.bgCard, borderColor: t.borderDefault },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Choose metric"
              accessibilityState={{ expanded: pickerOpen }}
            >
              <View style={styles.pickerLeft}>
                <View
                  style={[
                    styles.pickerIconWrap,
                    { backgroundColor: t.primaryTintBg, borderColor: t.primaryTintBorder },
                  ]}
                >
                  <Icon size={16} color={t.primary} strokeWidth={2.5} />
                </View>
                <View>
                  <Text style={[styles.pickerLabel, { color: t.textTertiary }]}>VIEWING</Text>
                  <Text style={[styles.pickerValue, { color: t.textPrimary }]}>{metric.name}</Text>
                </View>
              </View>
              <ChevronDown
                size={16}
                color={t.textSecondary}
                strokeWidth={2.5}
                style={{
                  transform: [{ rotate: pickerOpen ? '180deg' : '0deg' }],
                }}
              />
            </Pressable>

            {pickerOpen ? (
              <View style={[styles.pickerDropdown, { backgroundColor: t.bgCard, borderColor: t.borderDefault }]}>
                {(trackedMetrics.length > 0 ? trackedMetrics : rows).map(
                  (row) => {
                    const active = row.metric.id === metric.id;
                    return (
                      <Pressable
                        key={row.metric.id}
                        onPress={() => {
                          setActiveId(row.metric.id);
                          setPickerOpen(false);
                        }}
                        style={[
                          styles.pickerRow,
                          active && [styles.pickerRowActive, { backgroundColor: t.primaryTintBg }],
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                      >
                        {active ? (
                          <Check size={12} color={t.primary} strokeWidth={3} />
                        ) : (
                          <View style={{ width: 12 }} />
                        )}
                        <Text
                          style={[
                            styles.pickerRowName,
                            { color: t.textPrimary },
                            active && { color: t.primary },
                          ]}
                        >
                          {row.metric.name}
                        </Text>
                        <Text
                          style={[
                            styles.pickerRowValue,
                            Tabular,
                            { color: t.textSecondary },
                            active && { color: t.primary },
                          ]}
                        >
                          {row.current != null
                            ? `${formatMetricValue(row.current, row.metric)} ${row.metric.unit}`
                            : '—'}
                        </Text>
                      </Pressable>
                    );
                  },
                )}
              </View>
            ) : null}

            {/* Hero card */}
            <Animated.View
              entering={FadeIn.duration(250)}
              key={`hero-${metric.id}`}
              style={[styles.heroCard, { backgroundColor: t.bgCard, borderColor: t.borderDefault }]}
            >
              <Text style={[styles.heroLabel, { color: t.textTertiary }]}>CURRENT</Text>
              <View style={styles.heroRow}>
                <Text style={[styles.heroValue, Tabular, { color: t.primary }]}>
                  {current != null
                    ? formatMetricValue(current, metric)
                    : '—'}
                </Text>
                <Text style={[styles.heroUnit, { color: t.textTertiary }]}>{metric.unit}</Text>
              </View>
              {delta != null ? (
                <View style={styles.heroDeltaRow}>
                  {delta < 0 ? (
                    <TrendingDown
                      size={12}
                      color={
                        deltaIsGood(metric, delta) ? t.primary : DESTRUCTIVE
                      }
                      strokeWidth={2.5}
                    />
                  ) : (
                    <TrendingUp
                      size={12}
                      color={
                        deltaIsGood(metric, delta) ? t.primary : DESTRUCTIVE
                      }
                      strokeWidth={2.5}
                    />
                  )}
                  <Text
                    style={[
                      styles.heroDeltaValue,
                      Tabular,
                      {
                        color: deltaIsGood(metric, delta)
                          ? t.primary
                          : DESTRUCTIVE,
                      },
                    ]}
                  >
                    {delta > 0 ? '+' : ''}
                    {delta.toFixed(metric.decimals)} {metric.unit}
                  </Text>
                  <Text style={[styles.heroDeltaMeta, { color: t.textTertiary }]}>since start</Text>
                </View>
              ) : null}
            </Animated.View>

            {/* Chart card */}
            <Animated.View
              entering={FadeIn.duration(250)}
              key={`chart-${metric.id}-${range}`}
              style={[styles.chartCard, { backgroundColor: t.bgCard, borderColor: t.borderDefault }]}
            >
              <View style={styles.chartHeader}>
                <Text style={[styles.chartHeading, { color: t.primary }]}>
                  {metric.name.toUpperCase()} TREND
                </Text>
                <Text style={[styles.chartHeaderMeta, { color: t.textTertiary }]}>
                  {range} · {entries.length}{' '}
                  {entries.length === 1 ? 'entry' : 'entries'}
                </Text>
              </View>

              <MetricLineChart
                series={entries.map((e) => ({
                  value: e.value,
                  date: e.loggedAt,
                }))}
                unit={metric.unit}
                redrawKey={`${metric.id}-${range}`}
              />

              {/* Summary band */}
              {summary ? (
                <View style={[styles.summaryBand, { borderTopColor: t.borderDefault }]}>
                  <SummaryCol label="LOW" value={summary.low} unit={metric.unit} decimals={metric.decimals} />
                  <SummaryCol label="HIGH" value={summary.high} unit={metric.unit} decimals={metric.decimals} />
                  <SummaryCol label="AVG" value={summary.avg} unit={metric.unit} decimals={metric.decimals} />
                  <SummaryCol
                    label="CHANGE"
                    value={summary.change}
                    unit={metric.unit}
                    decimals={metric.decimals}
                    accent
                  />
                </View>
              ) : null}

              {/* Time-range toggle */}
              <View
                style={[
                  styles.rangeRow,
                  { backgroundColor: t.bgCardElevated, borderColor: t.borderDefault },
                ]}
              >
                {TIME_RANGES.map((r) => {
                  const active = range === r.key;
                  return (
                    <Pressable
                      key={r.key}
                      onPress={() => setRange(r.key)}
                      style={[
                        styles.rangeChip,
                        active && [styles.rangeChipActive, { backgroundColor: t.primary }],
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                    >
                      <Text
                        style={[
                          styles.rangeChipLabel,
                          { color: t.textTertiary },
                          active && { color: t.textOnPrimary },
                        ]}
                      >
                        {r.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>

            {/* Primary CTA — Log new entry (emerald-tinted) */}
            <Pressable
              onPress={() => setLogSheetOpen(true)}
              style={({ pressed }) => [
                styles.logCtaPrimary,
                { backgroundColor: t.primaryTintBg, borderColor: t.primaryBorderStrong },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Log new ${metric.name.toLowerCase()} entry`}
            >
              <View style={styles.logCtaLeft}>
                <View
                  style={[
                    styles.logCtaPrimaryIcon,
                    { backgroundColor: t.primaryTintBg, borderColor: t.primaryBorderStrong },
                  ]}
                >
                  <Plus size={14} color={t.primary} strokeWidth={3} />
                </View>
                <View>
                  <Text style={[styles.logCtaPrimaryLabel, { color: t.textPrimary }]}>
                    Log new {metric.name.toLowerCase()} entry
                  </Text>
                  <Text style={[styles.logCtaPrimarySub, { color: t.textSecondary }]}>
                    Add today's measurement
                  </Text>
                </View>
              </View>
              <ChevronRight size={14} color={t.primary} strokeWidth={2.5} />
            </Pressable>

            {/* Secondary CTA — View [N] entries. Hidden when 0 entries. */}
            {entries.length > 0 ? (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/metric-history/[id]',
                    params: { id: metric.id },
                  })
                }
                style={({ pressed }) => [
                  styles.logCtaSecondary,
                  { backgroundColor: t.bgCard, borderColor: t.borderDefault },
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`View ${entries.length} ${metric.name.toLowerCase()} entries`}
              >
                <View style={styles.logCtaLeft}>
                  <View
                    style={[
                      styles.logCtaSecondaryIcon,
                      { backgroundColor: t.bgCardElevated, borderColor: t.borderDefault },
                    ]}
                  >
                    <History
                      size={13}
                      color={t.textSecondary}
                      strokeWidth={2.5}
                    />
                  </View>
                  <View>
                    <Text style={[styles.logCtaSecondaryLabel, { color: t.textSecondary }]}>
                      View {entries.length.toLocaleString('en-US')}{' '}
                      {entries.length === 1 ? 'entry' : 'entries'}
                    </Text>
                    <Text style={[styles.logCtaSecondarySub, { color: t.textTertiary }]}>
                      Edit or delete past logs
                    </Text>
                  </View>
                </View>
                <ChevronRight
                  size={13}
                  color={t.textTertiary}
                  strokeWidth={2.5}
                />
              </Pressable>
            ) : null}
          </>
        )}
      </>
    );
  }
}

function SummaryCol({
  label,
  value,
  unit,
  decimals,
  accent,
}: {
  label: string;
  value: number;
  unit: string;
  decimals: number;
  accent?: boolean;
}) {
  const t = useTokens();
  return (
    <View style={styles.summaryCol}>
      <Text style={[styles.summaryLabel, { color: t.textTertiary }]}>{label}</Text>
      <View style={styles.summaryRow}>
        <Text
          style={[
            styles.summaryValue,
            Tabular,
            { color: t.textPrimary },
            accent && { color: t.primary },
          ]}
        >
          {value > 0 && accent ? '+' : ''}
          {value.toFixed(decimals)}
        </Text>
        <Text style={[styles.summaryUnit, { color: t.textTertiary }]}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  pageTitle: {
    fontFamily: Font.bold,
    fontSize: 30,
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 14,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bannerActive: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  bannerMuted: {
    fontFamily: Font.medium,
    fontSize: 10,
  },
  // Reserves the same vertical space as the banner row so switching IA
  // tabs doesn't bump the toggle position around.
  bannerSpacer: {
    height: 10 + 14, // matches bannerRow text height + marginBottom
    marginTop: 8,
  },
  // IA sub-tabs (Overview / Activity / Measurements) — segmented chips,
  // identical visual treatment to the existing domain sub-nav below.
  iaTabRow: {
    flexDirection: 'row',
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  iaTabChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 9,
  },
  iaTabChipActive: {
    borderWidth: 1,
  },
  iaTabLabel: {
    fontFamily: Font.bold,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  subNavRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  subNavChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
  },
  subNavChipActive: {},
  subNavLabel: {
    fontFamily: Font.bold,
    fontSize: 12,
  },
  placeholderCard: {
    padding: 24,
    borderWidth: 1,
    borderRadius: Radius.card,
    alignItems: 'center',
  },
  placeholderText: {
    fontFamily: Font.medium,
    fontSize: 12,
    textAlign: 'center',
  },
  pickerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderRadius: Radius.card,
    marginBottom: 12,
  },
  pickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pickerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerLabel: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  pickerValue: {
    fontFamily: Font.bold,
    fontSize: 16,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  pickerDropdown: {
    padding: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderRadius: Radius.card,
    gap: 2,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  pickerRowActive: {},
  pickerRowName: {
    flex: 1,
    fontFamily: Font.semibold,
    fontSize: 13,
  },
  pickerRowValue: {
    fontFamily: Font.bold,
    fontSize: 12,
  },
  heroCard: {
    padding: 20,
    borderWidth: 1,
    borderRadius: Radius.card,
    marginBottom: 12,
  },
  heroLabel: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  heroValue: {
    fontFamily: Font.extrabold,
    fontSize: 52,
    letterSpacing: -1.8,
    lineHeight: 54,
    textShadowColor: 'rgba(16, 185, 129, 0.25)',
    textShadowRadius: 16,
  },
  heroUnit: {
    fontFamily: Font.bold,
    fontSize: 14,
  },
  heroDeltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  heroDeltaValue: {
    fontFamily: Font.bold,
    fontSize: 11,
  },
  heroDeltaMeta: {
    fontFamily: Font.medium,
    fontSize: 11,
  },
  chartCard: {
    padding: 16,
    borderWidth: 1,
    borderRadius: Radius.card,
    marginBottom: 12,
    overflow: 'hidden',
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chartHeading: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  chartHeaderMeta: {
    fontFamily: Font.medium,
    fontSize: 9,
    fontVariant: ['tabular-nums'],
  },
  summaryBand: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  summaryCol: {
    flex: 1,
  },
  summaryLabel: {
    fontFamily: Font.bold,
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  summaryValue: {
    fontFamily: Font.bold,
    fontSize: 14,
  },
  summaryUnit: {
    fontFamily: Font.medium,
    fontSize: 9,
  },
  rangeRow: {
    flexDirection: 'row',
    padding: 2,
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  rangeChip: {
    flex: 1,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeChipActive: {},
  rangeChipLabel: {
    fontFamily: Font.bold,
    fontSize: 10,
  },
  logCtaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
  },
  logCtaSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  logCtaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logCtaPrimaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logCtaPrimaryLabel: {
    fontFamily: Font.bold,
    fontSize: 13,
    letterSpacing: -0.1,
  },
  logCtaPrimarySub: {
    fontFamily: Font.medium,
    fontSize: 10,
    marginTop: 2,
  },
  logCtaSecondaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logCtaSecondaryLabel: {
    fontFamily: Font.bold,
    fontSize: 12,
  },
  logCtaSecondarySub: {
    fontFamily: Font.medium,
    fontSize: 10,
    marginTop: 2,
  },
  pressed: { opacity: 0.85 },
  bottomSpacer: { height: 140 },
});
