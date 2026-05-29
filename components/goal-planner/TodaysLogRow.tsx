import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import type { FoodLogEntry } from '../../hooks/useTodaysFoodLog';
import {
  PERIOD_LABELS_UPPER,
  periodFromHour,
} from '../../lib/meal-periods';

type Props = {
  entry: FoodLogEntry;
  fallbackLabel: string;
  deleting: boolean;
  onDelete: (id: string) => void;
};

/** Replaced clock-time display with period label. The timestamp still drives
 *  sort order — only the label is collapsed to MORNING / NOON / EVENING. */
function fmtPeriod(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return PERIOD_LABELS_UPPER[periodFromHour(d.getHours())];
  } catch {
    return '';
  }
}

export default function TodaysLogRow({
  entry,
  fallbackLabel,
  deleting,
  onDelete,
}: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.label} numberOfLines={1}>
          {entry.meal_name || fallbackLabel}
        </Text>
        <Text style={styles.time}>{fmtPeriod(entry.created_at)}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.cal}>{entry.calories} kcal</Text>
        <Text style={styles.macros}>
          {entry.protein_g}g · {entry.carbs_g}g · {entry.fat_g}g
        </Text>
      </View>
      <Pressable
        onPress={() => onDelete(entry.id)}
        disabled={deleting}
        hitSlop={10}
        style={styles.del}
        accessibilityRole="button"
        accessibilityLabel="Remove entry"
      >
        <Feather
          name="x"
          size={15}
          color={deleting ? Colors.textHint : Colors.textMuted}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  left: {
    flex: 1,
    gap: 3,
  },
  label: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  time: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  right: {
    alignItems: 'flex-end',
    gap: 3,
  },
  cal: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  macros: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  del: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
