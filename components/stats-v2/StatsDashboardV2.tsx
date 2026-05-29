import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Dumbbell, Flame, Plus } from 'lucide-react-native';
import { DS, Font, Radius, Shadow } from '../../lib/design-system';
import { fmtLocalDate } from '../../lib/date';
import { TIME_RANGES, type TimeRange } from '../../lib/bodyComp';
import { useBodyCompositionData } from '../../hooks/useBodyCompositionData';
import { useBodyCompositionMutations } from '../../hooks/useBodyCompositionMutations';

import StatsPageHeader from './StatsPageHeader';
import DomainSubNav, { type StatsDomain } from './DomainSubNav';
import HeroStatsRow from './HeroStatsRow';
import SegmentedControl from './SegmentedControl';
import BodyCompChartV2, { type ChartMetric } from './BodyCompChartV2';
import StatsSummaryBand from './StatsSummaryBand';
import EntryForm from './EntryForm';
import HistoryCard from './HistoryCard';
import type { HistoryRowData } from './HistoryRow';
import PlaceholderCard from './PlaceholderCard';

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function lastEntryLabel(latestDateYmd: string | null): string {
  if (!latestDateYmd) return 'No entries yet';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = latestDateYmd.split('-').map(Number);
  const entryDate = new Date(y, (m ?? 1) - 1, d ?? 1);
  const diff = Math.round(
    (today.getTime() - entryDate.getTime()) / 86_400_000,
  );
  if (diff === 0) return 'Last entry today';
  if (diff === 1) return 'Last entry yesterday';
  if (diff > 1) return `Last entry ${diff} days ago`;
  return 'Last entry today';
}

// --------------------------------------------------------------------------

export default function StatsDashboardV2() {
  const [activeDomain, setActiveDomain] = useState<StatsDomain>('body');
  const [chartMetric, setChartMetric] = useState<ChartMetric>('weight');
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const { entries, allEntries, stats, refetch } =
    useBodyCompositionData(timeRange);
  const { save, remove, saving, deletingId } = useBodyCompositionMutations(
    () => {
      refetch();
    },
  );
  const [saveError, setSaveError] = useState<string | null>(null);

  // Auto-show form on empty state
  useEffect(() => {
    if (allEntries.length === 0) {
      // Don't auto-expand on first mount — let the user tap the CTA. The
      // "Log your first entry" CTA on the empty state expands the form.
      setShowForm(false);
    }
  }, [allEntries.length]);

  // Hero sparkline series — last 7 values from allEntries.
  const sparkSeries = useMemo(() => {
    const tailW: number[] = [];
    const tailBF: number[] = [];
    for (const e of allEntries) {
      if (e.weight != null) tailW.push(e.weight);
      if (e.bodyFat != null) tailBF.push(e.bodyFat);
    }
    return {
      weight: tailW.slice(-7),
      bodyFat: tailBF.slice(-7),
    };
  }, [allEntries]);

  // Chart series — strip nulls for the active metric, ascending.
  const chartSeries = useMemo(() => {
    return entries
      .map((e) => ({
        date: e.date,
        value: chartMetric === 'weight' ? e.weight : e.bodyFat,
      }))
      .filter((p): p is { date: string; value: number } => p.value != null);
  }, [entries, chartMetric]);

  // Summary band — Low/High/Avg/Change for the chart's current range+metric.
  const summary = useMemo(() => {
    if (chartSeries.length === 0) return null;
    const vals = chartSeries.map((p) => p.value);
    const low = Math.min(...vals);
    const high = Math.max(...vals);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const change = vals[vals.length - 1] - vals[0];
    return { low, high, avg, change };
  }, [chartSeries]);

  // History — newest first, with deltas vs chronologically prior entry.
  const historyWithDeltas: HistoryRowData[] = useMemo(() => {
    const desc = [...allEntries].reverse();
    return desc.map((e, i) => {
      const prior = desc[i + 1]; // chronologically prior
      return {
        id: e.id,
        date: e.date,
        weight: e.weight ?? 0,
        bodyFat: e.bodyFat,
        weightDelta:
          prior && prior.weight != null && e.weight != null
            ? e.weight - prior.weight
            : null,
        bodyFatDelta:
          prior && prior.bodyFat != null && e.bodyFat != null
            ? e.bodyFat - prior.bodyFat
            : null,
      };
    });
  }, [allEntries]);

  // Status banner
  const latestEntryDate =
    allEntries.length > 0 ? allEntries[allEntries.length - 1].date : null;
  const daysTracked = allEntries.length;
  const statusLabel = lastEntryLabel(latestEntryDate);

  // --------- Handlers ---------

  function handleSelectDomain(d: StatsDomain) {
    setActiveDomain(d);
    setOpenMenuId(null);
    setPendingDeleteId(null);
  }

  function handleShowFormFresh() {
    setEditingId(null);
    setSaveError(null);
    setShowForm(true);
    setOpenMenuId(null);
  }

  function handleCancelForm() {
    setShowForm(false);
    setEditingId(null);
    setSaveError(null);
  }

  function handleEdit(id: string) {
    setEditingId(id);
    setShowForm(true);
    setOpenMenuId(null);
    setPendingDeleteId(null);
    setSaveError(null);
  }

  async function handleSubmit(input: {
    date: string;
    weight: number;
    bodyFat: number | null;
  }) {
    setSaveError(null);
    const r = await save({
      date: input.date,
      weight: input.weight,
      bodyFat: input.bodyFat,
    });
    if (r.error) {
      setSaveError(r.error);
      return;
    }
    setShowForm(false);
    setEditingId(null);
  }

  const handleConfirmDelete = useCallback(
    async (id: string) => {
      const r = await remove(id);
      setPendingDeleteId(null);
      if (r.error) {
        console.error('[stats-v2.delete]', r.error);
      }
    },
    [remove],
  );

  // Edit-mode initial values
  const editingEntry = useMemo(
    () => (editingId ? allEntries.find((e) => e.id === editingId) ?? null : null),
    [editingId, allEntries],
  );

  // --------- Render ---------

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <LinearGradient
        colors={['rgba(16, 185, 129, 0.08)', 'transparent']}
        style={styles.topSpine}
        pointerEvents="none"
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <StatsPageHeader
          daysTracked={daysTracked}
          lastEntryLabel={statusLabel}
        />
        <DomainSubNav active={activeDomain} onChange={handleSelectDomain} />

        {activeDomain === 'body' ? (
          allEntries.length === 0 ? (
            // ---------- Empty state ----------
            <>
              <PlaceholderCard
                Icon={Dumbbell}
                title="Track your first entry"
                body="Log your weight and (optionally) body fat % to start seeing your trends."
              />
              {showForm ? (
                <EntryForm
                  initialDate={fmtLocalDate(new Date())}
                  initialWeight=""
                  initialBodyFat=""
                  saving={saving}
                  error={saveError}
                  onCancel={handleCancelForm}
                  onSubmit={handleSubmit}
                />
              ) : (
                <View style={styles.ctaWrap}>
                  <Pressable
                    onPress={handleShowFormFresh}
                    style={({ pressed }) => [
                      styles.cta,
                      Shadow.emeraldGlow,
                      styles.ctaRing,
                      pressed && styles.ctaPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Log your first entry"
                  >
                    <Plus size={16} color="#000" strokeWidth={3} />
                    <Text style={styles.ctaLabel}>Log your first entry</Text>
                  </Pressable>
                </View>
              )}
            </>
          ) : (
            // ---------- Populated body domain ----------
            <>
              <HeroStatsRow
                weight={stats.currentWeight}
                weightDelta={stats.weightChange}
                weightHistory={sparkSeries.weight}
                bodyFat={stats.currentBodyFat}
                bodyFatDelta={stats.bodyFatChange}
                bodyFatHistory={sparkSeries.bodyFat}
                rangeEntryCount={entries.length}
              />

              {/* Chart card */}
              <View style={styles.chartCardWrap}>
                <View style={styles.chartCard}>
                  <View style={styles.chartHeader}>
                    <SegmentedControl
                      options={[
                        { key: 'weight' as const, label: 'Weight' },
                        { key: 'bodyfat' as const, label: 'Body fat' },
                      ]}
                      value={chartMetric}
                      onChange={setChartMetric}
                    />
                  </View>

                  <Animated.View
                    key={`chart-${chartMetric}-${timeRange}`}
                    entering={FadeIn.duration(250)}
                  >
                    {chartSeries.length === 0 ? (
                      <View style={styles.chartEmpty}>
                        <Text style={styles.chartEmptyText}>
                          No {chartMetric === 'weight' ? 'weight' : 'body fat'}{' '}
                          entries in this range.
                        </Text>
                      </View>
                    ) : (
                      <BodyCompChartV2
                        entries={chartSeries}
                        metric={chartMetric}
                      />
                    )}

                    {summary ? (
                      <StatsSummaryBand
                        low={summary.low}
                        high={summary.high}
                        avg={summary.avg}
                        change={summary.change}
                        decimals={chartMetric === 'weight' ? 1 : 1}
                      />
                    ) : null}
                  </Animated.View>

                  <SegmentedControl
                    options={TIME_RANGES.map((r) => ({
                      key: r.key,
                      label: r.label,
                    }))}
                    value={timeRange}
                    onChange={setTimeRange}
                    size="sm"
                    style={styles.rangeControl}
                  />
                </View>
              </View>

              {/* Log entry CTA or form */}
              {showForm ? (
                <EntryForm
                  initialDate={
                    editingEntry?.date ?? fmtLocalDate(new Date())
                  }
                  initialWeight={
                    editingEntry?.weight != null
                      ? String(editingEntry.weight)
                      : ''
                  }
                  initialBodyFat={
                    editingEntry?.bodyFat != null
                      ? String(editingEntry.bodyFat)
                      : ''
                  }
                  saving={saving}
                  error={saveError}
                  lockDate={!!editingEntry}
                  onCancel={handleCancelForm}
                  onSubmit={handleSubmit}
                />
              ) : (
                <View style={styles.ctaWrap}>
                  <Pressable
                    onPress={handleShowFormFresh}
                    style={({ pressed }) => [
                      styles.cta,
                      Shadow.emeraldGlow,
                      styles.ctaRing,
                      pressed && styles.ctaPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Log entry"
                  >
                    <Plus size={16} color="#000" strokeWidth={3} />
                    <Text style={styles.ctaLabel}>Log entry</Text>
                  </Pressable>
                </View>
              )}

              <HistoryCard
                entries={historyWithDeltas}
                openMenuId={openMenuId}
                pendingDeleteId={pendingDeleteId}
                deletingId={deletingId}
                onOpenMenu={(id) =>
                  setOpenMenuId((prev) => (prev === id ? null : id))
                }
                onEdit={handleEdit}
                onRequestDelete={(id) => {
                  setOpenMenuId(null);
                  setPendingDeleteId(id);
                }}
                onConfirmDelete={handleConfirmDelete}
                onCancelDelete={() => setPendingDeleteId(null)}
              />
            </>
          )
        ) : activeDomain === 'strength' ? (
          <Animated.View entering={FadeIn.duration(250)}>
            <PlaceholderCard
              Icon={Dumbbell}
              title="Strength stats coming soon"
              body="Track PRs, volume trends, and per-muscle progress once you log more workouts."
            />
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(250)}>
            <PlaceholderCard
              Icon={Flame}
              title="Nutrition stats coming soon"
              body="Macro adherence, weekly averages, and target consistency."
            />
          </Animated.View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DS.bg,
  },
  topSpine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 0,
  },
  chartCardWrap: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  chartCard: {
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chartEmpty: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartEmptyText: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.textTertiary,
  },
  rangeControl: {
    marginTop: 12,
  },
  ctaWrap: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: DS.accent,
    borderRadius: 12,
    paddingVertical: 14,
  },
  ctaRing: {
    borderWidth: 1,
    borderColor: DS.accentBorderStrong,
  },
  ctaPressed: {
    transform: [{ scale: 0.98 }],
  },
  ctaLabel: {
    fontFamily: Font.bold,
    fontSize: 14,
    color: '#000',
  },
  bottomSpacer: {
    height: 140,
  },
});
