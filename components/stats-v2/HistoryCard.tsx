import { StyleSheet, Text, View } from 'react-native';
import { DS, Font, Tabular } from '../../lib/design-system';
import Card from '../ds/Card';
import HistoryRow, { type HistoryRowData } from './HistoryRow';

type Props = {
  entries: HistoryRowData[]; // already in display order (newest first)
  openMenuId: string | null;
  pendingDeleteId: string | null;
  deletingId: string | null;
  onOpenMenu: (id: string) => void;
  onEdit: (id: string) => void;
  onRequestDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
};

export default function HistoryCard({
  entries,
  openMenuId,
  pendingDeleteId,
  deletingId,
  onOpenMenu,
  onEdit,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}: Props) {
  return (
    <View style={styles.outer}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>HISTORY</Text>
        <Text style={[styles.count, Tabular]}>
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </Text>
      </View>
      <Card style={styles.card}>
        {entries.map((entry, i) => (
          <HistoryRow
            key={entry.id}
            entry={entry}
            isLast={i === entries.length - 1}
            isMenuOpen={openMenuId === entry.id}
            isPendingDelete={pendingDeleteId === entry.id}
            deleting={deletingId === entry.id}
            onOpenMenu={() => onOpenMenu(entry.id)}
            onEdit={() => onEdit(entry.id)}
            onRequestDelete={() => onRequestDelete(entry.id)}
            onConfirmDelete={() => onConfirmDelete(entry.id)}
            onCancelDelete={onCancelDelete}
          />
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  heading: {
    fontFamily: Font.semibold,
    fontSize: 11,
    color: DS.textTertiary,
    letterSpacing: 1,
  },
  count: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DS.textSecondary,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
});
