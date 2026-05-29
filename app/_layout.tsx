import { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useSegments, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider, type BottomSheetModal } from '@gorhom/bottom-sheet';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { AuthProvider, useAuth } from '../lib/auth-context';
import { ActiveWorkoutProvider, useActiveWorkout } from '../lib/active-workout-context';
import { ThemeProvider, useTheme } from '../lib/theme-context';
import { DS } from '../lib/design-system';
import HomeHeaderV2 from '../components/home-v2/HomeHeader';
import { BottomTabBar } from '../components/BottomTabBar';
import { MoreSheet } from '../components/MoreSheet';
import { AppearanceSheet } from '../components/AppearanceSheet';
import ActiveWorkoutBanner from '../components/active-workout/ActiveWorkoutBanner';

const AUTH_ROUTES = ['sign-in', 'sign-up', 'signup-success'] as const;
// Focused full-screen flows: no persistent top bar / bottom navbar. The
// active workout keeps the chrome (navbar + in-progress banner), per the
// web; only the exercise picker is fully focused.
const FOCUSED_ROUTES = ['exercise-picker'] as const;

function AuthGate() {
  const { session, loading } = useAuth();
  const segments = useSegments() as string[];
  const router = useRouter();
  const pathname = usePathname();
  const { state: workoutState } = useActiveWorkout();
  const { theme: c, mode } = useTheme();
  const moreSheetRef = useRef<BottomSheetModal>(null);
  const appearanceSheetRef = useRef<BottomSheetModal>(null);
  const openMore = useCallback(() => {
    moreSheetRef.current?.present();
  }, []);
  const openAppearance = useCallback(() => {
    appearanceSheetRef.current?.present();
  }, []);

  const current = segments[0] ?? '';
  const onAuthRoute = (AUTH_ROUTES as readonly string[]).includes(current);
  const onFocusedRoute = (FOCUSED_ROUTES as readonly string[]).includes(current);

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
      <View style={[styles.loading, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.accentLight} />
      </View>
    );
  }

  // The MacroVault brand bar is persistent chrome on every authenticated
  // screen. It owns the top safe-area inset so individual screens don't
  // apply their own ['top'] edge.
  const showChrome = !!session && !onAuthRoute && !onFocusedRoute;
  const workoutInProgress = workoutState.exercises.length > 0;
  const showBanner =
    showChrome &&
    workoutInProgress &&
    pathname !== '/active-workout' &&
    pathname !== '/exercise-picker' &&
    pathname !== '/log-workout';

  return (
    <View style={[styles.root, { backgroundColor: DS.bg }]}>
      <StatusBar style="light" />
      {showChrome ? (
        <SafeAreaView edges={['top']} style={{ backgroundColor: DS.bg }}>
          <HomeHeaderV2 onOpenAppearance={openAppearance} />
        </SafeAreaView>
      ) : null}
      {showBanner ? <ActiveWorkoutBanner /> : null}
      <View style={styles.stackWrap}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: DS.bg },
          }}
        />
      </View>
      {showChrome ? <BottomTabBar onOpenMore={openMore} /> : null}
      {showChrome ? <MoreSheet ref={moreSheetRef} /> : null}
      {showChrome ? <AppearanceSheet ref={appearanceSheetRef} /> : null}
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={[styles.root, styles.loading, { backgroundColor: DS.bg }]}>
        <ActivityIndicator color={DS.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <BottomSheetModalProvider>
        <AuthProvider>
          <ThemeProvider>
            <ActiveWorkoutProvider>
              <AuthGate />
            </ActiveWorkoutProvider>
          </ThemeProvider>
        </AuthProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  stackWrap: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
