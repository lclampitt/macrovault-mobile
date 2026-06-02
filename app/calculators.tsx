import { useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { DS } from '../lib/design-system';

/**
 * /calculators is gone from the IA. Macro Split's math now lives inside
 * Goal Planner; 1RM was cut. Kept as a route only so old deep links /
 * bookmarks / notifications resolve gracefully — surface a brief
 * informational alert and redirect to Goal Planner.
 */
export default function CalculatorsRedirect() {
  const router = useRouter();
  const shown = useRef(false);
  useEffect(() => {
    if (shown.current) return;
    shown.current = true;
    Alert.alert(
      'Calculators have moved',
      'Macro calculator is now part of Goal Planner.',
      [
        {
          text: 'OK',
          onPress: () => router.replace('/goal-planner'),
        },
      ],
      { cancelable: false },
    );
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
