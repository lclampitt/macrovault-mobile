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

/** Skeleton for the Active Goal + Timeline + Macro Targets stack. */
export function GoalCardsSkeleton() {
  return (
    <View style={styles.stack}>
      <View style={styles.card}>
        <Bar w="55%" h={18} />
        <Bar w="40%" h={12} />
        <View style={styles.gap} />
        <Bar w="100%" h={10} />
        <Bar w="100%" h={10} />
        <Bar w="100%" h={10} />
      </View>
      <View style={styles.card}>
        <Bar w="35%" h={10} />
        <Bar w="45%" h={28} />
        <Bar w="100%" h={6} />
        <Bar w="60%" h={12} />
      </View>
      <View style={styles.card}>
        <Bar w="35%" h={10} />
        <View style={styles.row}>
          <Bar w="47%" h={56} />
          <Bar w="47%" h={56} />
        </View>
      </View>
    </View>
  );
}

/** Skeleton for the Log Today's Nutrition + Today's Log stack. */
export function LogCardsSkeleton() {
  return (
    <View style={styles.stack}>
      <View style={styles.card}>
        <Bar w="45%" h={10} />
        <Bar w="100%" h={40} />
        <View style={styles.row}>
          <Bar w="47%" h={48} />
          <Bar w="47%" h={48} />
        </View>
        <Bar w="100%" h={44} />
      </View>
      <View style={styles.card}>
        <Bar w="30%" h={10} />
        <Bar w="100%" h={40} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 14,
  },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  gap: {
    height: 2,
  },
});
