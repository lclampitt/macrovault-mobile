import { StyleSheet, View } from 'react-native';
import { Colors } from '../../../constants/Colors';
import SkeletonBar from './SkeletonBar';

type Props = {
  variant?: 'hero' | 'small';
};

export default function QuickActionSkeleton({ variant = 'hero' }: Props) {
  if (variant === 'small') {
    return (
      <View style={styles.smallCard}>
        <View style={styles.smallIcon} />
        <SkeletonBar width={56} height={10} radius={4} style={styles.smallTitle} />
        <SkeletonBar width={80} height={8} radius={3} />
      </View>
    );
  }

  return (
    <View style={styles.heroCard}>
      <View style={styles.heroIcon} />
      <View style={styles.heroText}>
        <SkeletonBar width={70} height={8} radius={3} style={styles.heroKicker} />
        <SkeletonBar width={120} height={16} radius={5} style={styles.heroTitle} />
        <SkeletonBar width={160} height={9} radius={3} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderColor: Colors.borderAccentSoft,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: Colors.surfaceMuted,
  },
  heroText: { flex: 1, gap: 4 },
  heroKicker: { marginBottom: 2 },
  heroTitle: { marginBottom: 2 },
  smallCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
  },
  smallIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: Colors.surfaceMuted,
    marginBottom: 2,
  },
  smallTitle: { marginBottom: 2 },
});
