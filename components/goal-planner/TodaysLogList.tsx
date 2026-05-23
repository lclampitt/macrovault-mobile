import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import type { FoodLogEntry, FoodLogTotals } from '../../hooks/useTodaysFoodLog';
import TodaysLogRow from './TodaysLogRow';

type Props = {
  entries: FoodLogEntry[];
  totals: FoodLogTotals;
  deletingId: string | null;
  onDelete: (id: string) => void;
};

function r1(n: number): number {
  return Math.round(n * 10) / 10;
}

export default function TodaysLogList({
  entries,
  totals,
  deletingId,
  onDelete,
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>TODAY'S LOG</Text>
      {entries.length === 0 ? (
        <Text style={styles.empty}>
          No entries yet. Log your first meal above.
        </Text>
      ) : (
        <>
          <View>
            {entries.map((entry, i) => (
              <TodaysLogRow
                key={entry.id}
                entry={entry}
                // Matches web: `Entry ${entries.length - i}`
                fallbackLabel={`Entry ${entries.length - i}`}
                deleting={deletingId === entry.id}
                onDelete={onDelete}
              />
            ))}
          </View>
          <View style={styles.totals}>
            <Text style={styles.totalsLabel}>Today&apos;s total</Text>
            <Text style={styles.totalsValue}>
              {Math.round(totals.calories)} kcal · {r1(totals.protein)}g
              protein · {r1(totals.carbs)}g carbs · {r1(totals.fat)}g fat
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
  },
  heading: {
    color: Colors.textHint,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  empty: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 22,
  },
  totals: {
    marginTop: 14,
    gap: 4,
  },
  totalsLabel: {
    color: Colors.textHint,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalsValue: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
});
