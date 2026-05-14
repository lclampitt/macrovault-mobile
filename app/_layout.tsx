import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../lib/auth-context';
import { Colors } from '../constants/Colors';

const AUTH_ROUTES = ['sign-in', 'sign-up', 'signup-success'] as const;

function AuthGate() {
  const { session, loading } = useAuth();
  const segments = useSegments() as string[];
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const current = segments[0] ?? '';
    const onAuthRoute = (AUTH_ROUTES as readonly string[]).includes(current);

    if (!session && !onAuthRoute) {
      router.replace('/sign-in');
    } else if (session && onAuthRoute) {
      router.replace('/');
    }
  }, [session, loading, segments, router]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.accentLight} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate />
      <StatusBar style="light" />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
