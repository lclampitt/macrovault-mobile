import { useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { DS } from '../lib/design-system';

/**
 * /calculator-1rm was cut from the IA. Redirect to Goal Planner so old
 * bookmarks resolve. (The 1RM math itself stays in lib/ in case the
 * feature comes back as a Settings > Tools entry later.)
 */
export default function Calc1RMRedirect() {
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
