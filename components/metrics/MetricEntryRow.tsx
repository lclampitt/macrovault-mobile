import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import {
  MessageSquarePlus,
  Pencil,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native';
import { DS, Font, Tabular } from '../../lib/design-system';
import {
  deltaIsGood,
  formatMetricValue,
  type Metric,
} from '../../lib/metrics-catalog';
import { type MetricEntry } from '../../hooks/useMetricEntries';

const DELETE_COLOR = '#E5736A';
const DESTRUCTIVE = '#A87C5E';

type Props = {
  metric: Metric;
  entry: MetricEntry;
  /** Delta from the previous-in-time entry. Null when this is the oldest. */
  delta: number | null;
  onPress: () => void;
  onDelete: () => void;
};

/**
 * Single entry row inside the history list. Tap → edit. Swipe-left →
 * reveals a Delete action. The Delete action opens the parent's confirm
 * dialog; this component doesn't navigate or delete on its own.
 */
export default function MetricEntryRow({
  metric,
  entry,
  delta,
  onPress,
  onDelete,
}: Props) {
  function renderRightActions() {
    return (
      <View style={styles.swipeActionWrap}>
        <Pressable
          onPress={onDelete}
          style={({ pressed }) => [
            styles.swipeAction,
            pressed && { opacity: 0.85 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${metric.name} entry`}
        >
          <Trash2 size={12} color={DELETE_COLOR} strokeWidth={2.5} />
          <Text style={styles.swipeActionText}>Delete</Text>
        </Pressable>
      </View>
    );
  }

  const dateLabel = formatDate(entry.loggedAt);
  const timeLabel = formatTime(entry.loggedAt);
  const showDelta = delta != null && Math.abs(delta) >= 0.005;
  const deltaColor = showDelta
    ? deltaIsGood(metric, delta)
      ? DS.accent
      : DESTRUCTIVE
    : DS.textTertiary;

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          pressed && { transform: [{ scale: 0.99 }] },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${metric.name} entry from ${dateLabel}, ${formatMetricValue(entry.value, metric)} ${metric.unit}. Tap to edit.`}
      >
        <View style={styles.dateCol}>
          <Text style={styles.date}>{dateLabel}</Text>
          <Text style={[styles.time, Tabular]}>{timeLabel}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.body}>
          <View style={styles.valueRow}>
            <Text style={[styles.value, Tabular]}>
              {formatMetricValue(entry.value, metric)}
            </Text>
            <Text style={styles.unit}>{metric.unit}</Text>
          </View>
          <View style={styles.metaRow}>
            {showDelta ? (
              <>
                {delta < 0 ? (
                  <TrendingDown size={10} color={deltaColor} strokeWidth={2.5} />
                ) : (
                  <TrendingUp size={10} color={deltaColor} strokeWidth={2.5} />
                )}
                <Text style={[styles.deltaText, { color: deltaColor }]}>
                  {delta > 0 ? '+' : ''}
                  {delta.toFixed(metric.decimals)} {metric.unit}
                </Text>
              </>
            ) : (
              <Text style={styles.deltaIdle}>—</Text>
            )}
            {entry.notes ? (
              <>
                <Text style={styles.metaDot}>·</Text>
                <MessageSquarePlus
                  size={10}
                  color={DS.textTertiary}
                  strokeWidth={2}
                />
                <Text style={styles.note} numberOfLines={1}>
                  {entry.notes}
                </Text>
              </>
            ) : null}
          </View>
        </View>

        <Pencil size={12} color={DS.textQuaternary} strokeWidth={2.5} />
      </Pressable>
    </Swipeable>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dDay = new Date(d);
  dDay.setHours(0, 0, 0, 0);
  const diff = Math.round(
    (today.getTime() - dDay.getTime()) / 86_400_000,
  );
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  const currentYear = today.getFullYear();
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() === currentYear ? undefined : 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: 12,
  },
  dateCol: { minWidth: 44 },
  date: {
    fontFamily: Font.bold,
    fontSize: 11,
    color: DS.text,
  },
  time: {
    fontFamily: Font.medium,
    fontSize: 9,
    color: DS.textTertiary,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: DS.border,
  },
  body: { flex: 1, minWidth: 0 },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  value: {
    fontFamily: Font.bold,
    fontSize: 16,
    color: DS.text,
  },
  unit: {
    fontFamily: Font.bold,
    fontSize: 9,
    color: DS.textTertiary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  deltaText: {
    fontFamily: Font.bold,
    fontSize: 9,
    fontVariant: ['tabular-nums'],
  },
  deltaIdle: {
    fontFamily: Font.medium,
    fontSize: 9,
    color: DS.textQuaternary,
  },
  metaDot: {
    fontSize: 9,
    color: '#444',
    marginHorizontal: 2,
  },
  note: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: 9,
    color: DS.textTertiary,
  },
  // Swipe action
  swipeActionWrap: {
    paddingLeft: 6,
    justifyContent: 'center',
  },
  swipeAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(229, 115, 106, 0.2)',
    borderColor: 'rgba(229, 115, 106, 0.4)',
    borderWidth: 1,
  },
  swipeActionText: {
    fontFamily: Font.bold,
    fontSize: 11,
    color: DELETE_COLOR,
  },
});
