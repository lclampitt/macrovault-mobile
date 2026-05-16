import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import type { BodyCompEntry } from '../../lib/bodyComp';

type Props = {
  entry: BodyCompEntry;
  alt: boolean;
  isDeleting: boolean;
  onRequestDelete: (entry: BodyCompEntry) => void;
};

export default function BodyCompHistoryRow({
  entry,
  alt,
  isDeleting,
  onRequestDelete,
}: Props) {
  return (
    <View style={[styles.row, alt && styles.rowAlt]}>
      <Text style={[styles.cell, styles.dateCell]}>{entry.date}</Text>
      <Text style={[styles.cell, styles.numCell]}>
        {entry.weight != null ? entry.weight : '—'}
      </Text>
      <Text style={[styles.cell, styles.numCell]}>
        {entry.bodyFat != null ? entry.bodyFat : '—'}
      </Text>
      <View style={styles.actionCell}>
        <Pressable
          onPress={() => onRequestDelete(entry)}
          disabled={isDeleting}
          style={[styles.deleteBtn, isDeleting && styles.deleteBtnDisabled]}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`Delete entry from ${entry.date}`}
        >
          <Feather name="trash-2" size={14} color={Colors.error} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  rowAlt: {
    backgroundColor: Colors.monthCellBg,
  },
  cell: {
    color: Colors.textPrimary,
    fontSize: 13,
  },
  dateCell: {
    flex: 1.4,
    fontVariant: ['tabular-nums'],
  },
  numCell: {
    flex: 1,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  actionCell: {
    width: 44,
    alignItems: 'flex-end',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    backgroundColor: Colors.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnDisabled: {
    opacity: 0.5,
  },
});
