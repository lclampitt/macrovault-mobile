import { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useSegments, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider, type BottomSheetModal } from '@gorhom/bottom-sheet';
import {
  ThemeProvider as NavThemeProvider,
  DefaultTheme as NavDefaultTheme,
  type Theme as NavTheme,
} from '@react-navigation/native';
import {
  hasStoredCredentials,
  isBiometricAvailable,
  isFaceIdEnabled,
} from '../lib/biometric-store';
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
import { ThemeProvider, useTheme, useTokens } from '../lib/theme-context';
import { DS } from '../lib/design-system';
import HomeHeaderV2 from '../components/home-v2/HomeHeader';
import { BottomTabBar } from '../components/BottomTabBar';
import { MoreSheet } from '../components/MoreSheet';
import { AppearanceSheet } from '../components/AppearanceSheet';
import ActiveWorkoutBanner from '../components/active-workout/ActiveWorkoutBanner';
import TopGradientGlow from '../components/chrome/TopGradientGlow';
import SakuraAtmospherics from '../components/chrome/SakuraAtmospherics';

// Routes shown to unauthenticated users. `face-id` is here because it's
// reachable from sign-in even when the session isn't established yet.
// `enable-face-id` lives here because the user lands on it right after
// register/sign-in but before the session has settled into the navigator.
const AUTH_ROUTES = [
  'sign-in',
  'sign-up',
  'signup-success',
  'face-id',
  'enable-face-id',
] as const;
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
  const { theme: c, accent } = useTheme();
  const tokens = useTokens();
  const isSakura = accent === 'rose';
  // React Navigation paints its scene wrapper with `theme.colors.background`
  // — and without a NavThemeProvider it falls back to the LIGHT default
  // (`#F2F2F2`), which is what was leaking through dark mode and making
  // the body look cream while the chrome painted pure black. Build a nav
  // theme whose background matches our app's `bgPage` (transparent in
  // Sakura so the seigaiha layer stays visible).
  const navTheme = useRef<NavTheme>(NavDefaultTheme).current;
  const appNavTheme: NavTheme = {
    ...navTheme,
    colors: {
      ...navTheme.colors,
      background: isSakura ? 'transparent' : tokens.bgPage,
      card: tokens.bgCard,
      text: tokens.textPrimary,
      border: tokens.borderDefault,
      primary: tokens.primary,
    },
  };
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
      // Unauthenticated. Pick the right entry point:
      //   Face ID screen — if biometric is enabled and we have stored creds
      //   Sign In screen — otherwise
      void (async () => {
        const [hw, hasCreds, enabled] = await Promise.all([
          isBiometricAvailable(),
          hasStoredCredentials(),
          isFaceIdEnabled(),
        ]);
        router.replace(hw && hasCreds && enabled ? '/face-id' : '/sign-in');
      })();
    } else if (session && onAuthRoute && current !== 'enable-face-id') {
      router.replace('/');
    }
  }, [session, loading, onAuthRoute, current, router]);

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
    <View style={[styles.root, { backgroundColor: tokens.bgPage }]}>
      <StatusBar style={tokens.statusBarStyle} />
      {/* Ambient emerald glow that bleeds behind the chrome header so the
          top of the phone reads as ONE luminous zone. Only rendered when
          chrome is visible AND we're not in Sakura — the seigaiha
          texture below provides enough decoration on its own; adding the
          top glow over it creates a visible pinker band that competes
          with the rest of the cream page. */}
      {showChrome && !isSakura ? <TopGradientGlow /> : null}
      {/* Sakura atmospherics — seigaiha (青海波) wave pattern at ~7%
          opacity, mounted ONCE and only for the Sakura accent. Fully
          unmounts for Emerald so there's zero rendering cost when off.
          IMPORTANT: rendered BEFORE the chrome + Stack so the absolute-
          fill layer sits BEHIND every screen's cards. The root View
          paints `bgPage`; this layer sits on top of that base color but
          beneath all interactive content. The header SafeAreaView and
          every screen's outer container MUST be transparent so the
          pattern shows through uniformly across the whole viewport —
          any opaque element above this layer becomes a visible band.
          NOTE: global falling petals were intentionally removed in
          favor of the dense local petal field inside `LogWorkoutCard`.
          Petals are now a "hero" decoration on a single card, not a
          global ambient effect. */}
      {showChrome && isSakura ? <SakuraAtmospherics /> : null}
      {showChrome ? (
        <SafeAreaView
          edges={['top']}
          // Paint `bgPage` directly so the header surface matches the
          // body's base color exactly. Any system tint (dynamic island
          // backdrop, status bar wash) gets covered, eliminating the
          // visible color band between the chrome and the screen below.
          style={{ backgroundColor: tokens.bgPage }}
        >
          <HomeHeaderV2 onOpenAppearance={openAppearance} />
        </SafeAreaView>
      ) : null}
      {showBanner ? <ActiveWorkoutBanner /> : null}
      <View
        style={[
          styles.stackWrap,
          // In Emerald (dark + light), paint `bgPage` directly on the
          // wrapper around the Stack so the body matches the header's
          // bgPage exactly — no light gray leak from React Navigation's
          // default scene container, no visible seam between the chrome
          // and the page. In Sakura, stay transparent so the seigaiha
          // atmospherics layer below shows through the screens.
          !isSakura && { backgroundColor: tokens.bgPage },
        ]}
      >
        {/* React Navigation's scene wrapper uses `theme.colors.background`
            as the surface beneath every screen. Without this provider it
            falls back to the LIGHT default (`#F2F2F2`), which painted
            cream under dark mode regardless of our app tokens. The
            `appNavTheme` above mirrors our app theme so the scene
            background tracks `tokens.bgPage` (or transparent in Sakura). */}
        <NavThemeProvider value={appNavTheme}>
          <Stack
            screenOptions={{
              headerShown: false,
              // Same rationale as the wrapper bg — paint `bgPage` on the
              // Stack's own contentStyle so even if a screen renders an
              // intermediate container, it inherits the correct page
              // color. Keep transparent in Sakura so the atmospherics
              // show through.
              contentStyle: {
                backgroundColor: isSakura ? 'transparent' : tokens.bgPage,
              },
            }}
          />
        </NavThemeProvider>
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
