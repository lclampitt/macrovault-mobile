import { useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { DS } from '../lib/design-system';

/**
 * /calculator-macro is gone from the IA — its math now lives inside
 * Goal Planner. Kept as a route only so old deep links resolve.
 */
export default function CalcMacroRedirect() {
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
