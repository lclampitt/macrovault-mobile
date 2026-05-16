import { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider, type BottomSheetModal } from '@gorhom/bottom-sheet';
import { AuthProvider, useAuth } from '../lib/auth-context';
import { Colors } from '../constants/Colors';
import HomeHeader from '../components/home/HomeHeader';
import { BottomTabBar } from '../components/BottomTabBar';
import { MoreSheet } from '../components/MoreSheet';

const AUTH_ROUTES = ['sign-in', 'sign-up', 'signup-success'] as const;

function AuthGate() {
  const { session, loading } = useAuth();
  const segments = useSegments() as string[];
  const router = useRouter();
  const moreSheetRef = useRef<BottomSheetModal>(null);
  const openMore = useCallback(() => {
    moreSheetRef.current?.present();
  }, []);

  const current = segments[0] ?? '';
  const onAuthRoute = (AUTH_ROUTES as readonly string[]).includes(current);

  useEffect(() => {
    if (loading) return;

    if (!session && !onAuthRoute) {
      router.replace('/sign-in');
    } else if (session && onAuthRoute) {
      router.replace('/');
    }
  }, [session, loading, onAuthRoute, router]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.accentLight} />
      </View>
    );
  }

  // The MacroVault brand bar is persistent chrome on every authenticated
  // screen. It owns the top safe-area inset so individual screens don't
  // apply their own ['top'] edge.
  const showChrome = !!session && !onAuthRoute;

  return (
    <View style={styles.root}>
      {showChrome ? (
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <HomeHeader />
        </SafeAreaView>
      ) : null}
      <View style={styles.stackWrap}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
          }}
        />
      </View>
      {showChrome ? <BottomTabBar onOpenMore={openMore} /> : null}
      {showChrome ? <MoreSheet ref={moreSheetRef} /> : null}
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <BottomSheetModalProvider>
        <AuthProvider>
          <AuthGate />
          <StatusBar style="light" />
        </AuthProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerSafeArea: {
    backgroundColor: Colors.background,
  },
  stackWrap: {
    flex: 1,
  },
  loading: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
