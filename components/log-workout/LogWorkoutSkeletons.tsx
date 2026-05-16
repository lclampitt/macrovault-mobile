import { StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/Colors';

export function TemplatesGridSkeleton() {
  const cards = [0, 1, 2, 3];
  return (
    <View style={styles.grid}>
      {[0, 1].map((row) => (
        <View key={row} style={styles.row}>
          {cards.slice(row * 2, row * 2 + 2).map((c) => (
            <View key={c} style={styles.templateCard}>
              <View style={styles.iconSquare} />
              <View style={[styles.bar, { width: '70%' }]} />
              <View style={[styles.bar, { width: '45%', marginTop: 6 }]} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export function RecentWorkoutsSkeleton() {
  return (
    <View style={styles.list}>
      {[0, 1, 2, 3, 4].map((r) => (
        <View key={r} style={styles.recentRow}>
          <View style={styles.recentLeft}>
            <View style={[styles.bar, { width: '55%' }]} />
            <View style={[styles.bar, { width: '35%', marginTop: 6 }]} />
          </View>
          <View style={[styles.bar, { width: 36 }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  templateCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    minHeight: 132,
  },
  iconSquare: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: Colors.surfaceMuted,
    marginBottom: 12,
  },
  list: {
    gap: 10,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  recentLeft: {
    flex: 1,
  },
  bar: {
    height: 12,
    borderRadius: 4,
    backgroundColor: Colors.surfaceMuted,
  },
});
