import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Copy, RefreshCw } from 'lucide-react-native';
import { Font } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
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
  const t = useTokens();
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
        <Text style={[styles.fullDate, { color: t.textPrimary }]}>{fullDate}</Text>
        <View style={styles.metaRow}>
          {isToday ? (
            <PulseDot size={6} />
          ) : (
            <View style={[styles.staticDot, { backgroundColor: t.primary }]} />
          )}
          <Text style={[styles.metaLabel, { color: t.primary }]}>{relativeLabel}</Text>
          <Text style={[styles.metaDot, { color: t.textQuaternary }]}>·</Text>
          <Text style={[styles.metaText, { color: t.textSecondary }]}>
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
            { borderColor: t.borderDefault, backgroundColor: t.bgCard },
            (pressed || refreshing) && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Regenerate today's meals with AI"
        >
          <RefreshCw
            size={14}
            color={refreshing ? t.primary : t.textSecondary}
            strokeWidth={2}
          />
        </Pressable>
        <Pressable
          onPress={onCopy}
          style={({ pressed }) => [
            styles.iconBtn,
            { borderColor: t.borderDefault, backgroundColor: t.bgCard },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Copy today's meals to another day"
        >
          <Copy size={14} color={t.textSecondary} strokeWidth={2} />
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
    opacity: 0.5,
  },
  metaLabel: {
    fontFamily: Font.medium,
    fontSize: 11,
  },
  metaDot: {
    fontSize: 11,
  },
  metaText: {
    fontFamily: Font.medium,
    fontSize: 11,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
