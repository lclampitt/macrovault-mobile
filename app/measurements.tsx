import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { DS } from '../lib/design-system';

/**
 * /measurements is now a redirect — the feature lives under
 * Stats > Measurements. Kept as a route only so old deep links resolve
 * gracefully.
 */
export default function MeasurementsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace({
      pathname: '/progress',
      params: { tab: 'measurements' },
    });
  }, [router]);
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: DS.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ActivityIndicator color={DS.accent} />
    </View>
  );
}
