import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../../lib/theme-context';
import type { Theme } from '../../../lib/theme';
import SkeletonBar from './SkeletonBar';

export default function GreetingCardSkeleton() {
  const { theme: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <View style={styles.card}>
      <SkeletonBar width={120} height={10} radius={4} />
      <View style={styles.main}>
        <View style={styles.left}>
          <SkeletonBar width={90} height={9} radius={4} style={styles.label} />
          <SkeletonBar width={130} height={30} radius={6} style={styles.kcal} />
          <SkeletonBar width={160} height={11} radius={4} />
        </View>
        <View style={styles.ring} />
      </View>
      <View style={styles.bars}>
        <SkeletonBar width="100%" height={12} radius={6} />
        <SkeletonBar width="100%" height={12} radius={6} />
        <SkeletonBar width="100%" height={12} radius={6} />
      </View>
    </View>
  );
}

function makeStyles(c: Theme) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderColor: c.border,
      borderWidth: 1,
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingTop: 22,
      paddingBottom: 20,
    },
    main: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 14,
      marginTop: 10,
      marginBottom: 16,
    },
    left: { flex: 1, gap: 8 },
    label: { marginBottom: 2 },
    kcal: { marginBottom: 2 },
    ring: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: c.surfaceMuted,
      opacity: 0.5,
    },
    bars: {
      gap: 12,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: c.borderSubtle,
    },
  });
}
