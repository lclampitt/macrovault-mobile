import { StyleSheet, View } from 'react-native';
import { Colors } from '../../../constants/Colors';
import SkeletonBar from './SkeletonBar';

export default function StatCardSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonBar width={64} height={8} radius={3} style={styles.label} />
      <SkeletonBar width={70} height={20} radius={5} style={styles.value} />
      <SkeletonBar width={86} height={9} radius={3} style={styles.caption} />
      <SkeletonBar width="100%" height={3} radius={2} style={styles.strip} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  label: { marginBottom: 8 },
  value: { marginBottom: 6 },
  caption: { marginBottom: 12 },
  strip: {},
});
