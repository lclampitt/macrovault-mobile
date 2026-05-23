import { StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/Colors';

function Bar({ w, h }: { w: number | `${number}%`; h: number }) {
  return (
    <View
      style={{
        width: w,
        height: h,
        borderRadius: 6,
        backgroundColor: Colors.surfaceMuted,
      }}
    />
  );
}

export default function MealPlannerSkeleton() {
  return (
    <View style={styles.stack}>
      <View style={styles.cardLite}>
        <Bar w="50%" h={14} />
      </View>
      <View style={styles.pillsRow}>
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={i} style={styles.pill}>
            <Bar w="60%" h={10} />
            <Bar w={28} h={22} />
            <Bar w="80%" h={10} />
          </View>
        ))}
      </View>
      <View style={styles.card}>
        <Bar w="40%" h={14} />
        <View style={styles.tilesRow}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Bar key={i} w="22%" h={28} />
          ))}
        </View>
        <Bar w="100%" h={4} />
      </View>
      {Array.from({ length: 3 }).map((_, i) => (
        <View key={i} style={styles.card}>
          <Bar w="60%" h={16} />
          <View style={styles.tilesRow}>
            {Array.from({ length: 4 }).map((__, j) => (
              <Bar key={j} w="22%" h={22} />
            ))}
          </View>
          <Bar w="100%" h={36} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 10,
  },
  cardLite: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    minHeight: 74,
    padding: 8,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 13,
    gap: 9,
  },
  tilesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
