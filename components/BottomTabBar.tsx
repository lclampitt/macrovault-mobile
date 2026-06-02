import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter, type Href } from 'expo-router';
import {
  BarChart3,
  Grid3x3,
  Home,
  Plus,
  Utensils,
  type LucideIcon,
} from 'lucide-react-native';
import { useActiveWorkout } from '../lib/active-workout-context';
import { Font } from './../lib/design-system';
import { useTokens } from '../lib/theme-context';

type TabDef = {
  href: Href;
  label: string;
  Icon: LucideIcon;
};

const LEFT_TABS: TabDef[] = [
  { href: '/', label: 'Home', Icon: Home },
  { href: '/meals', label: 'Meals', Icon: Utensils },
];

const RIGHT_TABS: TabDef[] = [
  { href: '/progress', label: 'Stats', Icon: BarChart3 },
];

const FAB_HREF: Href = '/log-workout';

type Props = {
  onOpenMore: () => void;
};

export function BottomTabBar({ onOpenMore }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { state: workoutState } = useActiveWorkout();
  const workoutInProgress = workoutState.exercises.length > 0;
  const t = useTokens();

  // In-progress pulse on the FAB
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!workoutInProgress) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [workoutInProgress, pulse]);

  // Some routes live "under" a tab even though their URL doesn't match exactly.
  // Metric history pushes onto the Stats nav stack, so /metric-history/* keeps
  // the Stats tab highlighted. Add more entries here as nested routes show up.
  const SECONDARY_TAB_ROUTES: Record<string, string[]> = {
    '/progress': ['/metric-history'],
  };
  const isActive = (href: Href) => {
    if (pathname === href) return true;
    const prefixes = SECONDARY_TAB_ROUTES[String(href)] ?? [];
    return prefixes.some((p) => pathname.startsWith(p));
  };

  const go = (href: Href) => {
    if (pathname === href) return;
    router.navigate(href);
  };

  const renderTab = ({ href, label, Icon }: TabDef) => {
    const active = isActive(href);
    const color = active ? t.primary : t.textQuaternary;
    return (
      <Pressable
        key={label}
        onPress={() => go(href)}
        style={({ pressed }) => [
          styles.tab,
          pressed && styles.tabPressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        accessibilityLabel={label}
      >
        <Icon size={20} color={color} strokeWidth={2} />
        <Text style={[styles.tabLabel, { color }]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View
      style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}
      pointerEvents="box-none"
    >
      {/* Gradient fade behind the bar so scroll content fades into the
          page background (black in dark, cream in light, rose in sakura). */}
      <LinearGradient
        colors={t.gradientBottomNavFade as unknown as readonly [string, string]}
        locations={[0, 0.35]}
        pointerEvents="none"
        style={styles.gradient}
      />

      <View style={[styles.barWrap, { backgroundColor: t.bgPage }]}>
        <View style={styles.bar}>
          {LEFT_TABS.map(renderTab)}

          {/* Floating + button — emerald rounded-2xl, raised -mt-6 */}
          <Pressable
            onPress={() => go(FAB_HREF)}
            style={({ pressed }) => [
              styles.fab,
              pressed && styles.fabPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Start workout"
          >
            <View
              style={[
                styles.fabSquare,
                { backgroundColor: t.primary },
                t.shadowPrimaryGlow,
              ]}
            >
              <Plus size={26} color={t.textOnPrimary} strokeWidth={3} />
              {workoutInProgress ? (
                <Animated.View
                  style={[
                    styles.pulseDot,
                    {
                      backgroundColor: t.primary,
                      borderColor: t.bgPage,
                      opacity: pulse,
                    },
                  ]}
                />
              ) : null}
            </View>
            <Text
              style={[styles.fabLabel, { color: t.primary }]}
              numberOfLines={1}
              // Belt-and-braces against the 2-line wrap that was happening
              // on smaller phones. With size 9 + tightened letterSpacing,
              // "Start workout" comfortably fits the FAB column width on
              // every iPhone size; numberOfLines is the final guarantee.
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              Start workout
            </Text>
          </Pressable>

          {RIGHT_TABS.map(renderTab)}

          {/* More — opens the bottom sheet */}
          <Pressable
            onPress={onOpenMore}
            style={({ pressed }) => [
              styles.tab,
              pressed && styles.tabPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="More"
          >
            <Grid3x3 size={20} color={t.textQuaternary} strokeWidth={2} />
            <Text style={[styles.tabLabel, { color: t.textQuaternary }]}>
              More
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -80,
    bottom: 0,
  },
  barWrap: {
    // backgroundColor inline from tokens
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 4,
    minHeight: 52,
  },
  tabPressed: {
    opacity: 0.7,
  },
  tabLabel: {
    fontFamily: Font.semibold,
    fontSize: 10,
    letterSpacing: 0.1,
  },
  fab: {
    width: 76,
    alignItems: 'center',
    marginTop: -24,
  },
  fabPressed: {
    transform: [{ scale: 0.95 }],
  },
  fabSquare: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  fabLabel: {
    fontFamily: Font.bold,
    // 9pt + slight negative tracking — "Start workout" was wrapping to
    // two lines under the FAB on smaller iPhone screens at the old 10pt.
    fontSize: 9,
    letterSpacing: -0.1,
    marginTop: 4,
  },
});
