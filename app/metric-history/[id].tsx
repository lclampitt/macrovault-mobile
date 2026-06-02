import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Filter,
  MoreHorizontal,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native';
import { DS, Font, Motion, Radius, Tabular } from '../../lib/design-system';
import {
  deltaIsGood,
  findMetric,
  formatMetricValue,
} from '../../lib/metrics-catalog';
import { useMetricEntries } from '../../hooks/useMetricEntries';
import { useDeleteMetricEntry } from '../../hooks/useDeleteMetricEntry';
import MetricEntryRow from '../../components/metrics/MetricEntryRow';
import MetricLineChart from '../../components/metrics/MetricLineChart';
import LogMetricSheet, {
  type EditingEntry,
} from '../../components/metrics/LogMetricSheet';
import DeleteConfirmDialog from '../../components/metrics/DeleteConfirmDialog';
import UndoToast from '../../components/metrics/UndoToast';

const DESTRUCTIVE = '#A87C5E';

export default function MetricHistoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const metric = useMemo(
    () => findMetric((id as string) ?? 'weight'),
    [id],
  );

  const { entries, current, refetch } = useMetricEntries(
    metric?.id ?? null,
    'All',
  );
  const { remove, restore } = useDeleteMetricEntry();

  const [editing, setEditing] = useState<EditingEntry | null>(null);
  const [confirmEntry, setConfirmEntry] = useState<EditingEntry | null>(null);
  const [deletePayload, setDeletePayload] = useState<{
    id: string;
    value: number;
    loggedAt: string;
    notes?: string;
  } | null>(null);
  const [undoVisible, setUndoVisible] = useState(false);

  if (!metric) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Unknown metric.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Compute deltas (entry[i].value - entry[i-1].value). entries are
  // ascending in time; the row UI renders reverse-chrono via the slice below.
  const rowsDesc = useMemo(() => {
    const out = entries.map((e, i) => ({
      entry: e,
      delta: i === 0 ? null : +(e.value - entries[i - 1].value).toFixed(2),
    }));
    return out.reverse();
  }, [entries]);

  const totalDelta =
    entries.length >= 2
      ? +(entries[entries.length - 1].value - entries[0].value).toFixed(2)
      : 0;
  const totalDeltaColor = deltaIsGood(metric, totalDelta)
    ? DS.accent
    : DESTRUCTIVE;
  const TotalDeltaIcon = totalDelta < 0 ? TrendingDown : TrendingUp;

  function openEdit(payload: {
    id: string;
    value: number;
    loggedAt: string;
    notes?: string;
  }) {
    setEditing({
      id: payload.id,
      value: payload.value,
      loggedAt: payload.loggedAt,
      notes: payload.notes,
    });
  }

  function requestDelete(payload: {
    id: string;
    value: number;
    loggedAt: string;
    notes?: string;
  }) {
    setConfirmEntry(payload);
  }

  async function performDelete() {
    if (!confirmEntry || !metric) return;
    const payload = { ...confirmEntry };
    const r = await remove({
      id: payload.id,
      metric,
      value: payload.value,
      loggedAt: payload.loggedAt,
      notes: payload.notes,
    });
    setConfirmEntry(null);
    if (r.error) return;
    setDeletePayload(payload);
    setUndoVisible(true);
    void refetch();
    // Close the edit sheet too if it was open (i.e. delete-from-Edit path).
    setEditing(null);
  }

  async function performUndo() {
    if (!deletePayload || !metric) return;
    await restore({
      id: deletePayload.id,
      metric,
      value: deletePayload.value,
      loggedAt: deletePayload.loggedAt,
      notes: deletePayload.notes,
    });
    setUndoVisible(false);
    setDeletePayload(null);
    void refetch();
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Breadcrumb back button + title + kebab */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backPill,
              pressed && { opacity: 0.85 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Back to Stats"
          >
            <ArrowLeft size={14} color={DS.accent} strokeWidth={2.5} />
            <Text style={styles.backPillText}>Stats</Text>
          </Pressable>

          <View style={styles.titleWrap}>
            <metric.icon size={14} color={DS.accent} strokeWidth={2.5} />
            <Text style={styles.title}>
              {metric.name === 'Body Fat' ? 'Body fat' : metric.name} history
            </Text>
          </View>

          <View style={styles.iconBtn}>
            <MoreHorizontal
              size={16}
              color={DS.textSecondary}
              strokeWidth={2}
            />
          </View>
        </View>

        {/* Status banner */}
        <View style={styles.bannerRow}>
          <View style={styles.pulseDot} />
          <Text style={styles.bannerActive}>
            {entries.length} {entries.length === 1 ? 'ENTRY' : 'ENTRIES'}
          </Text>
          <Text style={styles.bannerMuted}>
            · {windowLabel(entries[0]?.loggedAt)}
          </Text>
        </View>

        {/* Mini chart */}
        <View style={styles.miniChartCard}>
          <View style={styles.miniChartHeader}>
            <View>
              <Text style={styles.miniChartLabel}>TREND OVERVIEW</Text>
              <View style={styles.miniChartValueRow}>
                <Text style={[styles.miniChartValue, Tabular]}>
                  {current != null
                    ? formatMetricValue(current, metric)
                    : '—'}
                </Text>
                <Text style={styles.miniChartUnit}>{metric.unit}</Text>
              </View>
            </View>
            <View style={styles.miniChartRight}>
              <Text style={styles.miniChartLabel}>CHANGE</Text>
              <View style={styles.miniChartDeltaRow}>
                <TotalDeltaIcon
                  size={12}
                  color={totalDeltaColor}
                  strokeWidth={2.5}
                />
                <Text
                  style={[
                    styles.miniChartDelta,
                    Tabular,
                    { color: totalDeltaColor },
                  ]}
                >
                  {totalDelta > 0 ? '+' : ''}
                  {totalDelta.toFixed(metric.decimals)} {metric.unit}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.miniChartWrap}>
            <MetricLineChart
              series={entries.map((e) => ({
                value: e.value,
                date: e.loggedAt,
              }))}
              unit={metric.unit}
              redrawKey={`history-${metric.id}`}
            />
          </View>
        </View>

        {/* Section label + filter */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>ALL ENTRIES</Text>
          <Pressable
            hitSlop={6}
            style={styles.filterBtn}
            accessibilityRole="button"
            accessibilityLabel="Filter entries"
          >
            <Filter size={12} color={DS.textSecondary} strokeWidth={2.5} />
            <Text style={styles.filterLabel}>Filter</Text>
          </Pressable>
        </View>

        {/* Entry list */}
        <View style={styles.list}>
          {rowsDesc.map(({ entry, delta }, i) => (
            <Animated.View
              key={entry.id}
              entering={FadeInDown.duration(Motion.durationRise).delay(
                40 + i * Motion.staggerStep,
              )}
            >
              <MetricEntryRow
                metric={metric}
                entry={entry}
                delta={delta}
                onPress={() =>
                  openEdit({
                    id: entry.id,
                    value: entry.value,
                    loggedAt: entry.loggedAt,
                    notes: entry.notes,
                  })
                }
                onDelete={() =>
                  requestDelete({
                    id: entry.id,
                    value: entry.value,
                    loggedAt: entry.loggedAt,
                    notes: entry.notes,
                  })
                }
              />
            </Animated.View>
          ))}
        </View>

        {/* Helper microtype */}
        <View style={styles.helperRow}>
          <View style={styles.helperDot} />
          <Text style={styles.helperText}>
            Tap any entry to edit it. Swipe left on a row to delete.
          </Text>
        </View>
      </ScrollView>

      {/* Edit sheet */}
      <LogMetricSheet
        visible={!!editing}
        metric={metric}
        editingEntry={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          void refetch();
        }}
        onRequestDelete={() => {
          if (!editing) return;
          requestDelete(editing);
        }}
      />

      {/* Delete confirm */}
      <DeleteConfirmDialog
        visible={!!confirmEntry}
        summary={
          confirmEntry
            ? `${shortLabel(confirmEntry.loggedAt)} · ${formatMetricValue(confirmEntry.value, metric)} ${metric.unit}`
            : ''
        }
        onCancel={() => setConfirmEntry(null)}
        onConfirm={performDelete}
      />

      {/* Undo toast */}
      <UndoToast
        visible={undoVisible}
        title={`${metric.name} entry deleted`}
        subtitle={
          deletePayload
            ? `${shortLabel(deletePayload.loggedAt)} · ${formatMetricValue(deletePayload.value, metric)} ${metric.unit}`
            : ''
        }
        onUndo={performUndo}
        onDismiss={() => {
          setUndoVisible(false);
          setDeletePayload(null);
        }}
      />
    </SafeAreaView>
  );
}

function shortLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function windowLabel(oldestIso: string | undefined): string {
  if (!oldestIso) return 'no history yet';
  const days = Math.floor(
    (Date.now() - new Date(oldestIso).getTime()) / 86_400_000,
  );
  if (days < 30) return `Last ${days} days`;
  if (days < 365) return `Last ${Math.round(days / 30)} months`;
  return `Last ${(days / 365).toFixed(1)} years`;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: DS.bg },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 140,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 12,
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
  },
  backPillText: {
    fontFamily: Font.bold,
    fontSize: 11,
    color: DS.accent,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: Font.bold,
    fontSize: 16,
    color: DS.text,
    letterSpacing: -0.2,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DS.accent,
  },
  bannerActive: {
    fontFamily: Font.bold,
    fontSize: 10,
    color: DS.accent,
    letterSpacing: 1,
  },
  bannerMuted: {
    fontFamily: Font.medium,
    fontSize: 10,
    color: DS.textTertiary,
  },
  miniChartCard: {
    padding: 16,
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: Radius.card,
    marginBottom: 14,
  },
  miniChartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  miniChartLabel: {
    fontFamily: Font.bold,
    fontSize: 10,
    color: DS.textTertiary,
    letterSpacing: 1,
  },
  miniChartValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  miniChartValue: {
    fontFamily: Font.extrabold,
    fontSize: 24,
    color: DS.accent,
    letterSpacing: -0.6,
    textShadowColor: 'rgba(16, 185, 129, 0.25)',
    textShadowRadius: 12,
  },
  miniChartUnit: {
    fontFamily: Font.bold,
    fontSize: 10,
    color: DS.textTertiary,
  },
  miniChartRight: {
    alignItems: 'flex-end',
  },
  miniChartDeltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  miniChartDelta: {
    fontFamily: Font.bold,
    fontSize: 14,
  },
  miniChartWrap: {
    height: 80,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  sectionLabel: {
    fontFamily: Font.bold,
    fontSize: 10,
    color: DS.textTertiary,
    letterSpacing: 1,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterLabel: {
    fontFamily: Font.bold,
    fontSize: 10,
    color: DS.textSecondary,
  },
  list: { gap: 6, marginBottom: 12 },
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
    backgroundColor: '#444',
    marginTop: 5,
  },
  helperText: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: 10,
    color: '#555',
    lineHeight: 14,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontFamily: Font.medium,
    fontSize: 13,
    color: DS.textTertiary,
  },
});
