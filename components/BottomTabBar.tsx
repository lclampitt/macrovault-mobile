import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

type IconRender = (color: string, size: number) => React.ReactNode;

type TabDef = {
  routeName: string;
  label: string;
  icon: IconRender;
};

const LEFT_TABS: TabDef[] = [
  {
    routeName: 'index',
    label: 'Home',
    icon: (color, size) => <Feather name="home" color={color} size={size} />,
  },
  {
    routeName: 'meals',
    label: 'Meals',
    icon: (color, size) => (
      <MaterialCommunityIcons name="silverware-fork-knife" color={color} size={size} />
    ),
  },
];

const RIGHT_TABS: TabDef[] = [
  {
    routeName: 'progress',
    label: 'Progress',
    icon: (color, size) => <Feather name="trending-up" color={color} size={size} />,
  },
];

const FAB_ROUTE = 'log-workout';
const MORE_ROUTE = 'more';

type Props = BottomTabBarProps & {
  onOpenMore: () => void;
};

export function BottomTabBar({ state, navigation, onOpenMore }: Props) {
  const insets = useSafeAreaInsets();

  const findRouteIndex = (name: string) =>
    state.routes.findIndex((r) => r.name === name);

  const handlePress = (routeName: string) => {
    const routeIndex = findRouteIndex(routeName);
    if (routeIndex === -1) return;
    const route = state.routes[routeIndex];

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    const isFocused = state.index === routeIndex;
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const isActive = (routeName: string) => {
    const idx = findRouteIndex(routeName);
    return idx !== -1 && state.index === idx;
  };

  const renderTab = (tab: TabDef) => {
    const active = isActive(tab.routeName);
    const color = active ? Colors.accentLight : Colors.textSecondary;
    return (
      <Pressable
        key={tab.routeName}
        onPress={() => handlePress(tab.routeName)}
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

  const fabActive = isActive(FAB_ROUTE);

  return (
    <View style={[styles.wrapper, { bottom: Math.max(insets.bottom, 14) }]}>
      <View style={styles.bar}>
        {LEFT_TABS.map(renderTab)}

        <Pressable
          onPress={() => handlePress(FAB_ROUTE)}
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
