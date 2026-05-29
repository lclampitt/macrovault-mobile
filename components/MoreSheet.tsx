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
  Activity,
  BookOpen,
  Calculator,
  CalendarHeart,
  ChevronRight,
  Dumbbell,
  Heart,
  Lock,
  Ruler,
  Settings as SettingsIcon,
  Target,
  TrendingUp,
  Utensils,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { DS, Font, Radius } from '../lib/design-system';
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

// NOTE: Order + groupings match the brief. ANALYZE = backward-looking; PLAN =
//   forward-looking; LIBRARY = static reference. Settings sits separately so
//   it's always one tap from the bottom regardless of plan changes.
const SECTIONS: MoreSection[] = [
  {
    label: 'ANALYZE',
    caption: 'Look at what already happened',
    items: [
      {
        href: '/progress',
        label: 'Progress',
        description: 'Weight, body comp, macros',
        Icon: TrendingUp,
        pro: true,
      },
      {
        href: '/activity',
        label: 'Activity',
        description: 'Logging consistency calendar',
        Icon: CalendarHeart,
      },
      {
        href: '/fitness',
        label: 'Fitness',
        description: 'Apple Watch · HR · burn',
        Icon: Heart,
      },
      {
        href: '/measurements',
        label: 'Measurements',
        description: 'Track every metric',
        Icon: Ruler,
      },
      {
        href: '/calculators',
        label: 'Calculators',
        description: 'Macros and 1RM',
        Icon: Calculator,
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
      {
        href: '/workouts',
        label: 'Workouts',
        description: 'Templates & history',
        Icon: Dumbbell,
        pro: true,
        tryFree: true,
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
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
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
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Close menu"
          >
            <X size={16} color={DS.textSecondary} strokeWidth={2} />
          </Pressable>
        </View>

        {SECTIONS.map((section) => (
          <View key={section.label} style={styles.sectionWrap}>
            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabel}>{section.label}</Text>
              <Text style={styles.sectionCaption}>{section.caption}</Text>
            </View>
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
            <SETTINGS_ITEM.Icon size={18} color={DS.accent} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingsLabel}>{SETTINGS_ITEM.label}</Text>
            <Text style={styles.settingsDescription}>
              {SETTINGS_ITEM.description}
            </Text>
          </View>
          <ChevronRight size={16} color={DS.textTertiary} strokeWidth={2} />
        </Pressable>

        {/* NOTE: A theme/accent picker used to live here. Replaced by the
            Appearance sheet wired to the brand bar's palette icon. */}
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
          <Lock size={10} color={DS.textTertiary} strokeWidth={2} />
        </View>
      ) : null}
      <View style={styles.cardIcon}>
        <item.Icon size={18} color={DS.accent} strokeWidth={2} />
      </View>
      <Text style={styles.cardLabel} numberOfLines={1}>
        {item.label}
      </Text>
      <Text style={styles.cardDescription} numberOfLines={2}>
        {item.description}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: DS.surface,
  },
  handle: {
    backgroundColor: DS.border,
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
    backgroundColor: DS.surfaceFlat,
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
    color: DS.textTertiary,
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  sectionCaption: {
    color: DS.textQuaternary,
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
    backgroundColor: DS.bg,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: Radius.card,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 6,
    position: 'relative',
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: DS.surfaceFlat,
  },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: DS.accentSoft,
    borderWidth: 1,
    borderColor: DS.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  cardLabel: {
    color: DS.text,
    fontFamily: Font.bold,
    fontSize: 13,
    letterSpacing: -0.2,
  },
  cardDescription: {
    color: DS.textTertiary,
    fontFamily: Font.medium,
    fontSize: 10,
    lineHeight: 13,
  },
  lockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: DS.surface,
    borderColor: DS.border,
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
    backgroundColor: DS.accentSoft,
    borderColor: DS.accentBorder,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tryFreeText: {
    color: DS.accent,
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
    backgroundColor: DS.bg,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: Radius.card,
  },
  settingsIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: DS.accentSoft,
    borderColor: DS.accentBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: {
    color: DS.text,
    fontFamily: Font.bold,
    fontSize: 14,
    letterSpacing: -0.2,
  },
  settingsDescription: {
    color: DS.textTertiary,
    fontFamily: Font.medium,
    fontSize: 11,
    marginTop: 2,
  },
});

// NOTE: I removed the unused Activity import? — keeping it imported for the
// next pass when "Workouts" can branch to a separate activity dashboard view.
void Activity;
