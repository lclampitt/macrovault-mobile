import { forwardRef, useCallback, useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useSubscription } from '../hooks/useSubscription';

type IconRender = (color: string, size: number) => React.ReactNode;

type MoreItem = {
  href: Href;
  label: string;
  icon: IconRender;
  pro?: boolean; // requires a subscription
  tryFree?: boolean; // free users see a "Try free" badge instead of a lock
};

type MoreSection = {
  label: string;
  items: MoreItem[];
};

// Grouping mirrors the web sidebar (gainlytics-v2 Sidebar.jsx NAV_GROUPS).
const SECTIONS: MoreSection[] = [
  {
    label: 'ANALYZE',
    items: [
      {
        href: '/progress',
        label: 'Progress',
        icon: (c, s) => <Feather name="trending-up" color={c} size={s} />,
        pro: true,
      },
      {
        href: '/activity',
        label: 'Activity',
        icon: (c, s) => (
          <MaterialCommunityIcons name="calendar-heart" color={c} size={s} />
        ),
      },
      {
        href: '/measurements',
        label: 'Measurements',
        icon: (c, s) => (
          <MaterialCommunityIcons name="ruler" color={c} size={s} />
        ),
      },
      {
        href: '/calculators',
        label: 'Calculators',
        icon: (c, s) => (
          <MaterialCommunityIcons
            name="calculator-variant"
            color={c}
            size={s}
          />
        ),
      },
    ],
  },
  {
    label: 'PLAN',
    items: [
      {
        href: '/meals',
        label: 'Meal Planner',
        icon: (c, s) => (
          <MaterialCommunityIcons
            name="silverware-fork-knife"
            color={c}
            size={s}
          />
        ),
        pro: true,
      },
      {
        href: '/goal-planner',
        label: 'Goal Planner',
        icon: (c, s) => <Feather name="target" color={c} size={s} />,
        pro: true,
      },
      {
        href: '/workouts',
        label: 'Workouts',
        icon: (c, s) => (
          <MaterialCommunityIcons name="dumbbell" color={c} size={s} />
        ),
        pro: true,
        tryFree: true,
      },
    ],
  },
  {
    label: 'LIBRARY',
    items: [
      {
        href: '/exercise-library',
        label: 'Exercise Library',
        icon: (c, s) => <Feather name="book-open" color={c} size={s} />,
      },
    ],
  },
];

const SETTINGS_ITEM: MoreItem = {
  href: '/settings',
  label: 'Settings',
  icon: (c, s) => <Feather name="settings" color={c} size={s} />,
};

export const MoreSheet = forwardRef<BottomSheetModal>(function MoreSheet(_, ref) {
  const router = useRouter();
  const { isPro } = useSubscription();
  const snapPoints = useMemo(() => ['85%'], []);

  const handleDismiss = useCallback(() => {
    if (ref && typeof ref !== 'function') {
      ref.current?.dismiss();
    }
  }, [ref]);

  const navigate = useCallback(
    (href: Href) => {
      handleDismiss();
      // Small delay so the sheet collapse animation can start before navigating.
      setTimeout(() => router.push(href), 100);
    },
    [handleDismiss, router],
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.6}
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
      backdropComponent={renderBackdrop}
    >
      <View style={styles.topAccent} pointerEvents="none" />
      <BottomSheetScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>All pages</Text>
          <Pressable
            onPress={handleDismiss}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close menu"
          >
            <Feather name="x" size={20} color={Colors.textSecondary} />
          </Pressable>
        </View>

        {SECTIONS.map((section) => (
          <View key={section.label}>
            <Text style={styles.sectionLabel}>{section.label}</Text>
            <View style={styles.grid}>
              {section.items.map((item) => (
                <MoreCard
                  key={item.label}
                  item={item}
                  isPro={isPro}
                  onPress={() => navigate(item.href)}
                />
              ))}
            </View>
          </View>
        ))}

        <View style={styles.settingsWrap}>
          <Pressable
            onPress={() => navigate(SETTINGS_ITEM.href)}
            style={({ pressed }) => [
              styles.settingsRow,
              pressed && styles.cardPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={SETTINGS_ITEM.label}
          >
            <View style={styles.settingsIcon}>
              {SETTINGS_ITEM.icon(Colors.textSecondary, 18)}
            </View>
            <Text style={styles.settingsLabel}>{SETTINGS_ITEM.label}</Text>
            <Feather
              name="chevron-right"
              size={18}
              color={Colors.textMuted}
              style={styles.settingsChevron}
            />
          </Pressable>
        </View>

        <View style={styles.themeRow}>
          <View style={styles.themeDot} />
          <Text style={styles.themeText}>Teal</Text>
          <MaterialCommunityIcons
            name="palette-outline"
            size={16}
            color={Colors.textSecondary}
            style={styles.themePaletteIcon}
          />
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

type MoreCardProps = {
  item: MoreItem;
  isPro: boolean;
  onPress: (e: GestureResponderEvent) => void;
};

function MoreCard({ item, isPro, onPress }: MoreCardProps) {
  const locked = !!item.pro && !isPro;
  const showTryFree = locked && !!item.tryFree;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.cardSlot,
        styles.card,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={
        locked
          ? `${item.label}${showTryFree ? ', try free' : ', Pro feature'}`
          : item.label
      }
    >
      {showTryFree ? (
        <View style={styles.tryFreeBadge}>
          <Text style={styles.tryFreeText}>Try free</Text>
        </View>
      ) : locked ? (
        <View style={styles.lockBadge}>
          <Feather name="lock" size={11} color={Colors.textMuted} />
        </View>
      ) : null}
      <View style={styles.cardIcon}>{item.icon(Colors.textSecondary, 18)}</View>
      <Text style={styles.cardLabel} numberOfLines={1}>
        {item.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: Colors.surface,
  },
  handle: {
    backgroundColor: Colors.surfaceMuted,
    width: 36,
    height: 4,
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.accent,
    opacity: 0.7,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
    paddingHorizontal: 4,
    paddingTop: 16,
    paddingBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cardSlot: {
    flexBasis: '31.5%',
    flexGrow: 1,
    minHeight: 88,
  },
  card: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    position: 'relative',
  },
  cardPressed: {
    backgroundColor: Colors.surfaceMuted,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  lockBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 999,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tryFreeBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: Colors.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tryFreeText: {
    color: Colors.accentLight,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  settingsWrap: {
    marginTop: 18,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  settingsChevron: {
    marginLeft: 'auto',
  },
  themeRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    position: 'relative',
  },
  themeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.accent,
    position: 'absolute',
    left: 14,
  },
  themeText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  themePaletteIcon: {
    position: 'absolute',
    right: 14,
  },
});
