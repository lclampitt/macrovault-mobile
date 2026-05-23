import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';

/**
 * The web app has a single `/workouts` route that owns the entire workout
 * logger flow. On mobile, the equivalent UX lives on the bottom-tab
 * "Log workout" tab (`(tabs)/log-workout.tsx`) — separating the tab entry
 * point from the in-progress logger keeps the navigation cleaner. This file
 * exists only so the More-sheet's "Workouts" item still resolves to a real
 * route; it redirects to the canonical tab on mount.
 */
export default function WorkoutsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/log-workout');
  }, [router]);
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={Colors.accentLight} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
});
