import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { DS } from '../lib/design-system';

/**
 * /activity is now a redirect — the feature lives under Stats > Activity
 * (see `components/stats-v2/StatsDashboardV2.tsx`). Kept as a route only
 * so old deep links / notifications resolve gracefully.
 */
export default function ActivityRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace({
      pathname: '/progress',
      params: { tab: 'activity' },
    });
  }, [router]);
  return (
    <View style={{ flex: 1, backgroundColor: DS.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={DS.accent} />
    </View>
  );
}
