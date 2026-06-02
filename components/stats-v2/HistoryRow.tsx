import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MoreHorizontal, Trash2 } from 'lucide-react-native';
import { Font, Tabular } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import { fmtShortMonthDay } from '../../lib/date';

const DESTRUCTIVE = '#E5736A';
/** "Wrong-direction" delta color — desaturated tan, never red. */
const NEUTRAL_NEG = '#A87C5E';

export type HistoryRowData = {
  id: string;
  date: string; // YYYY-MM-DD
  weight: number;
  bodyFat: number | null;
  weightDelta: number | null;
  bodyFatDelta: number | null;
};

type Props = {
  entry: HistoryRowData;
  isLast: boolean;
  isMenuOpen: boolean;
  isPendingDelete: boolean;
  deleting: boolean;
  onOpenMenu: () => void;
  onEdit: () => void;
  onRequestDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
};

const fmtShortDate = fmtShortMonthDay;

function fmtDelta(n: number): string {
  const sign = n < 0 ? '−' : n > 0 ? '+' : '';
  return `${sign}${Math.abs(n).toFixed(1)}`;
}

export default function HistoryRow({
  entry,
  isLast,
  isMenuOpen,
  isPendingDelete,
  deleting,
  onOpenMenu,
  onEdit,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}: Props) {
  const t = useTokens();

  /** Cutting direction (weight loss) = emerald. Gaining = tan. */
  const deltaColor = (n: number): string => {
    if (n === 0) return t.textTertiary;
    return n < 0 ? t.primary : NEUTRAL_NEG;
  };

  if (isPendingDelete) {
    return (
      <View
        style={[
          styles.row,
          styles.confirmRow,
          !isLast && [styles.rowDivider, { borderBottomColor: t.borderSubtle }],
        ]}
      >
        <Text style={[styles.confirmText, { color: t.textPrimary }]}>Delete this entry?</Text>
        <View style={styles.confirmActions}>
          <Pressable
            onPress={onCancelDelete}
            disabled={deleting}
            style={({ pressed }) => [
              styles.confirmBtn,
              styles.confirmBtnCancel,
              { borderColor: t.borderDefault },
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Cancel delete"
          >
            <Text style={[styles.confirmCancelText, { color: t.textSecondary }]}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={onConfirmDelete}
            disabled={deleting}
            style={({ pressed }) => [
              styles.confirmBtn,
              styles.confirmBtnDelete,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Confirm delete"
          >
            {deleting ? (
              <ActivityIndicator size="small" color={DESTRUCTIVE} />
            ) : (
              <Text style={styles.confirmDeleteText}>Delete</Text>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.row, !isLast && [styles.rowDivider, { borderBottomColor: t.borderSubtle }]]}>
      {/* Date */}
      <View style={styles.dateCol}>
        <Text style={[styles.dateMain, { color: t.textPrimary }]}>{fmtShortDate(entry.date)}</Text>
        <Text style={[styles.dateYear, Tabular, { color: t.textTertiary }]}>{entry.date.slice(0, 4)}</Text>
      </View>

      {/* Weight */}
      <View style={styles.metricCol}>
        <View style={styles.metricValueRow}>
          <Text style={[styles.metricValue, Tabular, { color: t.textPrimary }]}>
            {entry.weight.toFixed(1)}
          </Text>
          <Text style={[styles.metricUnit, { color: t.textTertiary }]}>lb</Text>
        </View>
        {entry.weightDelta != null ? (
          <Text
            style={[
              styles.metricDelta,
              Tabular,
              { color: deltaColor(entry.weightDelta) },
            ]}
          >
            {fmtDelta(entry.weightDelta)}
          </Text>
        ) : null}
      </View>

      {/* Body fat */}
      <View style={styles.metricCol}>
        {entry.bodyFat != null ? (
          <>
            <View style={styles.metricValueRow}>
              <Text style={[styles.metricValue, Tabular, { color: t.textPrimary }]}>
                {entry.bodyFat.toFixed(1)}
              </Text>
              <Text style={[styles.metricUnit, { color: t.textTertiary }]}>%</Text>
            </View>
            {entry.bodyFatDelta != null ? (
              <Text
                style={[
                  styles.metricDelta,
                  Tabular,
                  { color: deltaColor(entry.bodyFatDelta) },
                ]}
              >
                {fmtDelta(entry.bodyFatDelta)}
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={[styles.metricMissing, { color: t.textQuaternary }]}>—</Text>
        )}
      </View>

      {/* Kebab */}
      <View style={styles.kebabWrap}>
        <Pressable
          onPress={onOpenMenu}
          style={({ pressed }) => [
            styles.kebabBtn,
            (isMenuOpen || pressed) && [styles.kebabBtnActive, { backgroundColor: t.borderDefault }],
          ]}
          accessibilityRole="button"
          accessibilityLabel="Entry options"
          accessibilityState={{ expanded: isMenuOpen }}
        >
          <MoreHorizontal size={14} color={t.textTertiary} strokeWidth={2} />
        </Pressable>
        {isMenuOpen ? (
          <View
            style={[
              styles.menu,
              { backgroundColor: t.bgCardElevated, borderColor: t.borderStrong },
            ]}
            accessibilityRole="menu"
          >
            <Pressable
              onPress={onEdit}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
              ]}
              accessibilityRole="menuitem"
              accessibilityLabel="Edit entry"
            >
              <Text style={[styles.menuItemText, { color: t.textPrimary }]}>Edit entry</Text>
            </Pressable>
            <View style={[styles.menuDivider, { backgroundColor: t.borderStrong }]} />
            <Pressable
              onPress={onRequestDelete}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
              ]}
              accessibilityRole="menuitem"
              accessibilityLabel="Delete entry"
            >
              <Trash2 size={14} color={DESTRUCTIVE} strokeWidth={2} />
              <Text
                style={[styles.menuItemText, { color: DESTRUCTIVE }]}
              >
                Delete
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
  },
  rowDivider: {
    borderBottomWidth: 1,
  },
  dateCol: {
    width: 64,
  },
  dateMain: {
    fontFamily: Font.semibold,
    fontSize: 12,
  },
  dateYear: {
    fontFamily: Font.medium,
    fontSize: 10,
    marginTop: 1,
  },
  metricCol: {
    flex: 1,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  metricValue: {
    fontFamily: Font.bold,
    fontSize: 13,
  },
  metricUnit: {
    fontFamily: Font.medium,
    fontSize: 10,
  },
  metricDelta: {
    fontFamily: Font.semibold,
    fontSize: 10,
    marginTop: 1,
  },
  metricMissing: {
    fontFamily: Font.medium,
    fontSize: 13,
  },
  kebabWrap: {
    position: 'relative',
  },
  kebabBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  kebabBtnActive: {},
  pressed: {
    opacity: 0.7,
  },
  menu: {
    position: 'absolute',
    right: 0,
    top: 32,
    zIndex: 50,
    minWidth: 144,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  menuItemPressed: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  menuItemText: {
    fontFamily: Font.medium,
    fontSize: 12,
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 8,
    marginVertical: 4,
  },
  // Inline confirm row
  confirmRow: {
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  confirmText: {
    fontFamily: Font.semibold,
    fontSize: 13,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 76,
  },
  confirmBtnCancel: {
    backgroundColor: 'transparent',
  },
  confirmBtnDelete: {
    borderColor: 'rgba(229, 115, 106, 0.4)',
    backgroundColor: 'rgba(229, 115, 106, 0.08)',
  },
  confirmCancelText: {
    fontFamily: Font.semibold,
    fontSize: 12,
  },
  confirmDeleteText: {
    fontFamily: Font.bold,
    fontSize: 12,
    color: DESTRUCTIVE,
  },
});
