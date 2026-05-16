import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter, type Href } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

type IconRender = (color: string, size: number) => React.ReactNode;

type TabDef = {
  href: Href;
  label: string;
  icon: IconRender;
};

const LEFT_TABS: TabDef[] = [
  {
    href: '/',
    label: 'Home',
    icon: (color, size) => <Feather name="home" color={color} size={size} />,
  },
  {
    href: '/meals',
    label: 'Meals',
    icon: (color, size) => (
      <MaterialCommunityIcons name="silverware-fork-knife" color={color} size={size} />
    ),
  },
];

const RIGHT_TABS: TabDef[] = [
  {
    href: '/progress',
    label: 'Progress',
    icon: (color, size) => <Feather name="trending-up" color={color} size={size} />,
  },
];

const FAB_HREF: Href = '/log-workout';

type Props = {
  onOpenMore: () => void;
};

export function BottomTabBar({ onOpenMore }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (href: Href) => pathname === href;

  const go = (href: Href) => {
    if (pathname === href) return;
    router.navigate(href);
  };

  const renderTab = (tab: TabDef) => {
    const active = isActive(tab.href);
    const color = active ? Colors.accentLight : Colors.textSecondary;
    return (
      <Pressable
        key={tab.label}
        onPress={() => go(tab.href)}
        style={[styles.tab, active && styles.tabActive]}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        accessibilityLabel={tab.label}
      >
        {active ? <View style={styles.activeDot} /> : null}
        {tab.icon(color, 18)}
        <Text
          numberOfLines={1}
          style={[styles.tabLabel, { color }, active && styles.tabLabelActive]}
        >
          {tab.label}
        </Text>
      </Pressable>
    );
  };

  const fabActive = isActive(FAB_HREF);

  return (
    <View style={[styles.wrapper, { bottom: Math.max(insets.bottom, 14) }]}>
      <View style={styles.bar}>
        {LEFT_TABS.map(renderTab)}

        <Pressable
          onPress={() => go(FAB_HREF)}
          style={styles.fab}
          accessibilityRole="button"
          accessibilityLabel="Log workout"
          accessibilityState={{ selected: fabActive }}
        >
          <View style={[styles.fabCircle, fabActive && styles.fabCircleActive]}>
            <Feather name="plus" size={22} color="#FFFFFF" />
          </View>
          <Text numberOfLines={1} style={styles.fabLabel}>
            Log workout
          </Text>
        </Pressable>

        {RIGHT_TABS.map(renderTab)}

        <Pressable
          onPress={onOpenMore}
          style={styles.tab}
          accessibilityRole="button"
          accessibilityLabel="More"
        >
          <Feather name="grid" size={18} color={Colors.textSecondary} />
          <Text
            numberOfLines={1}
            style={[styles.tabLabel, { color: Colors.textSecondary }]}
          >
            More
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 18,
    gap: 3,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: Colors.accentSoft,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
    marginBottom: 1,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '400',
  },
  tabLabelActive: {
    fontWeight: '500',
  },
  fab: {
    width: 88,
    marginTop: -22,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  fabCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  fabCircleActive: {
    transform: [{ scale: 1.05 }],
  },
  fabLabel: {
    color: Colors.accentLight,
    fontSize: 9,
    fontWeight: '500',
    marginTop: 4,
  },
});
