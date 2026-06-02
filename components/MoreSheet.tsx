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
import {
  BookOpen,
  ChevronRight,
  Heart,
  Lock,
  Settings as SettingsIcon,
  Target,
  Utensils,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { Font, Radius } from '../lib/design-system';
import { useTokens } from '../lib/theme-context';
import type { Tokens } from '../lib/tokens';
import { useSubscription } from '../hooks/useSubscription';

type MoreItem = {
  href: Href;
  label: string;
  description: string;
  Icon: LucideIcon;
  pro?: boolean;
  tryFree?: boolean;
};

type MoreSection = {
  label: string;
  caption: string;
  items: MoreItem[];
};

// NOTE: This menu used to have 9 tiles across three sections; the IA
// simplification pass moved most of it elsewhere:
//   • Progress / Activity / Measurements → Stats tab (Overview / Activity /
//     Measurements sub-tabs)
//   • Workouts                            → the floating + (Start workout)
//   • Calculators                         → removed entirely (the underlying
//     math still powers Goal Planner)
// What remains is the small set of power features that don't fit any tab:
// Fitness (HealthKit), Meal Planner (week-ahead), Goal Planner, and the
// Exercise Library. Settings stays pinned at the bottom.
const SECTIONS: MoreSection[] = [
  {
    label: 'ANALYZE',
    caption: 'Look at what already happened',
    items: [
      {
        href: '/fitness',
        label: 'Fitness',
        description: 'Apple Watch · HR · burn',
        Icon: Heart,
      },
    ],
  },
  {
    label: 'PLAN',
    caption: 'Set the next move',
    items: [
      {
        href: '/meals',
        label: 'Meal Planner',
        description: 'Week-ahead plate',
        Icon: Utensils,
        pro: true,
      },
      {
        href: '/goal-planner',
        label: 'Goal Planner',
        description: 'Cut · maintain · bulk',
        Icon: Target,
        pro: true,
      },
    ],
  },
  {
    label: 'LIBRARY',
    caption: 'Reference material',
    items: [
      {
        href: '/exercise-library',
        label: 'Exercise Library',
        description: 'Catalog + history',
        Icon: BookOpen,
      },
    ],
  },
];

const SETTINGS_ITEM: MoreItem = {
  href: '/settings',
  label: 'Settings',
  description: 'Account, preferences, data',
  Icon: SettingsIcon,
};

export const MoreSheet = forwardRef<BottomSheetModal>(function MoreSheet(_, ref) {
  const router = useRouter();
  const { isPro } = useSubscription();
  const t = useTokens();
  const snapPoints = useMemo(() => ['88%'], []);

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
        opacity={0.7}
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      // Sheet wears the page color so the cards inside read as elevated
      // surfaces (matches the dashboard pattern: white cards on cream page
      // in light mode, dark cards on near-black page in dark mode).
      backgroundStyle={[styles.sheetBg, { backgroundColor: t.bgPage }]}
      handleIndicatorStyle={[
        styles.handle,
        { backgroundColor: t.textQuaternary },
      ]}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <Pressable
            onPress={handleDismiss}
            hitSlop={12}
            style={[
              styles.closeBtn,
              { backgroundColor: t.bgCardElevated },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Close menu"
          >
            <X size={16} color={t.textSecondary} strokeWidth={2} />
          </Pressable>
        </View>

        {SECTIONS.map((section) => (
          <View key={section.label} style={styles.sectionWrap}>
            <View style={styles.sectionLabelRow}>
              <Text style={[styles.sectionLabel, { color: t.textTertiary }]}>
                {section.label}
              </Text>
              <Text
                style={[styles.sectionCaption, { color: t.textQuaternary }]}
              >
                {section.caption}
              </Text>
            </View>
            <View style={styles.grid}>
              {section.items.map((item) => (
                <MoreCard
                  key={item.label}
                  item={item}
                  tokens={t}
                  isPro={isPro}
                  onPress={() => navigate(item.href)}
                />
              ))}
            </View>
          </View>
        ))}

        <Pressable
          onPress={() => navigate(SETTINGS_ITEM.href)}
          style={({ pressed }) => [
            styles.settingsRow,
            {
              backgroundColor: t.bgCard,
              borderColor: t.borderDefault,
            },
            pressed && [
              styles.cardPressed,
              { backgroundColor: t.bgCardElevated },
            ],
          ]}
          accessibilityRole="button"
          accessibilityLabel={SETTINGS_ITEM.label}
        >
          <View
            style={[
              styles.settingsIcon,
              {
                backgroundColor: t.primaryTintBg,
                borderColor: t.primaryTintBorder,
              },
            ]}
          >
            <SETTINGS_ITEM.Icon size={18} color={t.primary} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingsLabel, { color: t.textPrimary }]}>
              {SETTINGS_ITEM.label}
            </Text>
            <Text
              style={[styles.settingsDescription, { color: t.textTertiary }]}
            >
              {SETTINGS_ITEM.description}
            </Text>
          </View>
          <ChevronRight size={16} color={t.textTertiary} strokeWidth={2} />
        </Pressable>

        {/* NOTE: A theme/accent picker used to live here. Replaced by the
            Appearance sheet wired to the brand bar's palette icon. */}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

type MoreCardProps = {
  item: MoreItem;
  /** Passed from the parent — see ModePill in AppearanceSheet.tsx for why
   *  we thread tokens down instead of calling useTokens() inside the sub-
   *  component (BottomSheetModal portal doesn't always re-render its
   *  inner sub-components on theme changes). */
  tokens: Tokens;
  isPro: boolean;
  onPress: (e: GestureResponderEvent) => void;
};

function MoreCard({ item, tokens: t, isPro, onPress }: MoreCardProps) {
  const locked = !!item.pro && !isPro;
  const showTryFree = locked && !!item.tryFree;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.cardSlot,
        styles.card,
        {
          backgroundColor: t.bgCard,
          borderColor: t.borderDefault,
        },
        pressed && [
          styles.cardPressed,
          { backgroundColor: t.bgCardElevated },
        ],
      ]}
      accessibilityRole="button"
      accessibilityLabel={
        locked
          ? `${item.label}${showTryFree ? ', try free' : ', Pro feature'}`
          : item.label
      }
    >
      {showTryFree ? (
        <View
          style={[
            styles.tryFreeBadge,
            {
              backgroundColor: t.primaryTintBg,
              borderColor: t.primaryTintBorder,
            },
          ]}
        >
          <Text style={[styles.tryFreeText, { color: t.primary }]}>
            Try free
          </Text>
        </View>
      ) : locked ? (
        <View
          style={[
            styles.lockBadge,
            {
              backgroundColor: t.bgCard,
              borderColor: t.borderDefault,
            },
          ]}
        >
          <Lock size={10} color={t.textTertiary} strokeWidth={2} />
        </View>
      ) : null}
      <View
        style={[
          styles.cardIcon,
          {
            backgroundColor: t.primaryTintBg,
            borderColor: t.primaryTintBorder,
          },
        ]}
      >
        <item.Icon size={18} color={t.primary} strokeWidth={2} />
      </View>
      <Text
        style={[styles.cardLabel, { color: t.textPrimary }]}
        numberOfLines={1}
      >
        {item.label}
      </Text>
      <Text
        style={[styles.cardDescription, { color: t.textTertiary }]}
        numberOfLines={2}
      >
        {item.description}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sheetBg: {
    // backgroundColor inline from tokens
  },
  handle: {
    width: 36,
    height: 4,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 4,
    paddingTop: 2,
    paddingBottom: 4,
  },
  headerLeft: {
    flex: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionWrap: {
    marginTop: 18,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  sectionLabel: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  sectionCaption: {
    fontFamily: Font.medium,
    fontSize: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cardSlot: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 108,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radius.card,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 6,
    position: 'relative',
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  cardLabel: {
    fontFamily: Font.bold,
    fontSize: 13,
    letterSpacing: -0.2,
  },
  cardDescription: {
    fontFamily: Font.medium,
    fontSize: 10,
    lineHeight: 13,
  },
  lockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderWidth: 1,
    borderRadius: 999,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tryFreeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tryFreeText: {
    fontFamily: Font.bold,
    fontSize: 9,
    letterSpacing: 0.4,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: Radius.card,
  },
  settingsIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: {
    fontFamily: Font.bold,
    fontSize: 14,
    letterSpacing: -0.2,
  },
  settingsDescription: {
    fontFamily: Font.medium,
    fontSize: 11,
    marginTop: 2,
  },
});
