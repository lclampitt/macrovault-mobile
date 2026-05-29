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
import { DS, Font, Shadow } from './../lib/design-system';

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

  const isActive = (href: Href) => pathname === href;

  const go = (href: Href) => {
    if (pathname === href) return;
    router.navigate(href);
  };

  const renderTab = ({ href, label, Icon }: TabDef) => {
    const active = isActive(href);
    const color = active ? DS.accent : DS.textQuaternary;
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
      {/* Gradient fade behind the bar so scroll content fades to black. */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', '#000']}
        locations={[0, 0.35]}
        pointerEvents="none"
        style={styles.gradient}
      />

      <View style={styles.barWrap}>
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
            accessibilityLabel="Log workout"
          >
            <View style={[styles.fabSquare, Shadow.emeraldGlow]}>
              <Plus size={26} color="#000" strokeWidth={3} />
              {workoutInProgress ? (
                <Animated.View style={[styles.pulseDot, { opacity: pulse }]} />
              ) : null}
            </View>
            <Text style={styles.fabLabel}>Log</Text>
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
            <Grid3x3 size={20} color={DS.textQuaternary} strokeWidth={2} />
            <Text style={[styles.tabLabel, { color: DS.textQuaternary }]}>
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
    backgroundColor: DS.bg,
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
    backgroundColor: DS.accent,
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
    backgroundColor: DS.accentLight,
    borderWidth: 2,
    borderColor: DS.bg,
  },
  fabLabel: {
    fontFamily: Font.bold,
    fontSize: 10,
    color: DS.accent,
    marginTop: 4,
  },
});
