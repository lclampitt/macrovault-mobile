import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MoreHorizontal, Trash2 } from 'lucide-react-native';
import { DS, Font, Tabular } from '../../lib/design-system';
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

/** Cutting direction (weight loss) = emerald. Gaining = tan. */
function deltaColor(n: number): string {
  if (n === 0) return DS.textTertiary;
  return n < 0 ? DS.accent : NEUTRAL_NEG;
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
  if (isPendingDelete) {
    return (
      <View
        style={[styles.row, styles.confirmRow, !isLast && styles.rowDivider]}
      >
        <Text style={styles.confirmText}>Delete this entry?</Text>
        <View style={styles.confirmActions}>
          <Pressable
            onPress={onCancelDelete}
            disabled={deleting}
            style={({ pressed }) => [
              styles.confirmBtn,
              styles.confirmBtnCancel,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Cancel delete"
          >
            <Text style={styles.confirmCancelText}>Cancel</Text>
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
    <View style={[styles.row, !isLast && styles.rowDivider]}>
      {/* Date */}
      <View style={styles.dateCol}>
        <Text style={styles.dateMain}>{fmtShortDate(entry.date)}</Text>
        <Text style={[styles.dateYear, Tabular]}>{entry.date.slice(0, 4)}</Text>
      </View>

      {/* Weight */}
      <View style={styles.metricCol}>
        <View style={styles.metricValueRow}>
          <Text style={[styles.metricValue, Tabular]}>
            {entry.weight.toFixed(1)}
          </Text>
          <Text style={styles.metricUnit}>lb</Text>
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
              <Text style={[styles.metricValue, Tabular]}>
                {entry.bodyFat.toFixed(1)}
              </Text>
              <Text style={styles.metricUnit}>%</Text>
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
          <Text style={styles.metricMissing}>—</Text>
        )}
      </View>

      {/* Kebab */}
      <View style={styles.kebabWrap}>
        <Pressable
          onPress={onOpenMenu}
          style={({ pressed }) => [
            styles.kebabBtn,
            (isMenuOpen || pressed) && styles.kebabBtnActive,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Entry options"
          accessibilityState={{ expanded: isMenuOpen }}
        >
          <MoreHorizontal size={14} color={DS.textTertiary} strokeWidth={2} />
        </Pressable>
        {isMenuOpen ? (
          <View style={styles.menu} accessibilityRole="menu">
            <Pressable
              onPress={onEdit}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
              ]}
              accessibilityRole="menuitem"
              accessibilityLabel="Edit entry"
            >
              <Text style={styles.menuItemText}>Edit entry</Text>
            </Pressable>
            <View style={styles.menuDivider} />
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
    borderBottomColor: DS.divider,
  },
  dateCol: {
    width: 64,
  },
  dateMain: {
    fontFamily: Font.semibold,
    fontSize: 12,
    color: DS.text,
  },
  dateYear: {
    fontFamily: Font.medium,
    fontSize: 10,
    color: '#555',
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
    color: DS.text,
  },
  metricUnit: {
    fontFamily: Font.medium,
    fontSize: 10,
    color: DS.textTertiary,
  },
  metricDelta: {
    fontFamily: Font.semibold,
    fontSize: 10,
    marginTop: 1,
  },
  metricMissing: {
    fontFamily: Font.medium,
    fontSize: 13,
    color: DS.textQuaternary,
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
  kebabBtnActive: {
    backgroundColor: DS.border,
  },
  pressed: {
    opacity: 0.7,
  },
  menu: {
    position: 'absolute',
    right: 0,
    top: 32,
    zIndex: 50,
    minWidth: 144,
    backgroundColor: '#141414',
    borderColor: '#2A2A2A',
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
    color: DS.text,
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 8,
    marginVertical: 4,
    backgroundColor: '#2A2A2A',
  },
  // Inline confirm row
  confirmRow: {
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  confirmText: {
    fontFamily: Font.semibold,
    fontSize: 13,
    color: DS.text,
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
    borderColor: DS.border,
    backgroundColor: 'transparent',
  },
  confirmBtnDelete: {
    borderColor: 'rgba(229, 115, 106, 0.4)',
    backgroundColor: 'rgba(229, 115, 106, 0.08)',
  },
  confirmCancelText: {
    fontFamily: Font.semibold,
    fontSize: 12,
    color: DS.textSecondary,
  },
  confirmDeleteText: {
    fontFamily: Font.bold,
    fontSize: 12,
    color: DESTRUCTIVE,
  },
});
