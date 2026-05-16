import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import type { BodyCompEntry } from '../../lib/bodyComp';
import { useBodyCompositionMutations } from '../../hooks/useBodyCompositionMutations';
import BodyCompHistoryRow from './BodyCompHistoryRow';
import DeleteConfirmModal from './DeleteConfirmModal';

type Props = {
  entries: BodyCompEntry[]; // full set (ascending) — shows ALL, not range-filtered
  onDeleted: () => void;
};

function longDate(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function BodyCompHistoryList({ entries, onDeleted }: Props) {
  const { remove, deletingId } = useBodyCompositionMutations();
  const [pending, setPending] = useState<BodyCompEntry | null>(null);

  // Newest first (web orders date desc); incoming list is ascending.
  const ordered = useMemo(() => [...entries].reverse(), [entries]);

  async function confirmDelete() {
    if (!pending) return;
    const { error } = await remove(pending.id);
    setPending(null);
    if (!error) onDeleted();
  }

  return (
    <View style={styles.card}>
      <Text style={styles.header}>History</Text>

      {ordered.length === 0 ? (
        <Text style={styles.empty}>No entries yet.</Text>
      ) : (
        <View>
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, styles.dateCol]}>Date</Text>
            <Text style={[styles.headerCell, styles.numCol]}>Weight (lbs)</Text>
            <Text style={[styles.headerCell, styles.numCol]}>Body Fat %</Text>
            <View style={styles.actionCol} />
          </View>
          {ordered.map((entry, idx) => (
            <BodyCompHistoryRow
              key={entry.id}
              entry={entry}
              alt={idx % 2 === 1}
              isDeleting={deletingId === entry.id}
              onRequestDelete={setPending}
            />
          ))}
        </View>
      )}

      <DeleteConfirmModal
        visible={pending !== null}
        message={
          pending
            ? `Permanently delete the entry from ${longDate(pending.date)}? This cannot be undone.`
            : ''
        }
        loading={pending !== null && deletingId === pending.id}
        onCancel={() => setPending(null)}
        onConfirm={confirmDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 4,
  },
  header: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  empty: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerCell: {
    color: Colors.textHint,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  dateCol: {
    flex: 1.4,
  },
  numCol: {
    flex: 1,
    textAlign: 'center',
  },
  actionCol: {
    width: 44,
  },
});
