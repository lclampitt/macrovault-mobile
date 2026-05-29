import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Copy, RefreshCw } from 'lucide-react-native';
import { DS, Font } from '../../lib/design-system';
import PulseDot from '../ds/PulseDot';

type Props = {
  fullDate: string; // "Wednesday, May 27"
  /** "Today" | "Yesterday" | "Tomorrow" | weekday name */
  relativeLabel: string;
  isToday: boolean;
  mealCount: number;
  snackCount: number;
  refreshing?: boolean;
  onRefresh: () => void;
  onCopy: () => void;
};

export default function DayHeader({
  fullDate,
  relativeLabel,
  isToday,
  mealCount,
  snackCount,
  refreshing,
  onRefresh,
  onCopy,
}: Props) {
  const mealLabel = mealCount === 1 ? '1 meal' : `${mealCount} meals`;
  const snackLabel =
    snackCount === 0
      ? '1 snack slot open'
      : snackCount === 1
        ? '1 snack'
        : `${snackCount} snacks`;

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.fullDate}>{fullDate}</Text>
        <View style={styles.metaRow}>
          {isToday ? <PulseDot size={6} /> : <View style={styles.staticDot} />}
          <Text style={styles.metaLabel}>{relativeLabel}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>
            {mealLabel} · {snackLabel}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={onRefresh}
          disabled={refreshing}
          style={({ pressed }) => [
            styles.iconBtn,
            (pressed || refreshing) && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Regenerate today's meals with AI"
        >
          <RefreshCw
            size={14}
            color={refreshing ? DS.accent : DS.textSecondary}
            strokeWidth={2}
          />
        </Pressable>
        <Pressable
          onPress={onCopy}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Copy today's meals to another day"
        >
          <Copy size={14} color={DS.textSecondary} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  left: {
    flex: 1,
  },
  fullDate: {
    fontFamily: Font.bold,
    fontSize: 18,
    color: DS.text,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  staticDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DS.accent,
    opacity: 0.5,
  },
  metaLabel: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DS.accent,
  },
  metaDot: {
    color: DS.textDimmest,
    fontSize: 11,
  },
  metaText: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DS.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DS.border,
    backgroundColor: DS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
