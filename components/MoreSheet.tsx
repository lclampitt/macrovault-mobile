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
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

type IconRender = (color: string, size: number) => React.ReactNode;

type MoreItem = {
  href: Href;
  label: string;
  icon: IconRender;
  proBadge?: boolean;
};

const PRO_ITEMS: MoreItem[] = [
  {
    href: '/workouts',
    label: 'Workouts',
    icon: (color, size) => (
      <MaterialCommunityIcons name="dumbbell" color={color} size={size} />
    ),
    proBadge: true,
  },
  {
    href: '/goal-planner',
    label: 'Goal Planner',
    icon: (color, size) => <Feather name="target" color={color} size={size} />,
    proBadge: true,
  },
];

const GENERAL_ITEMS: MoreItem[] = [
  {
    href: '/activity',
    label: 'Activity',
    icon: (color, size) => (
      <MaterialCommunityIcons name="calendar-heart" color={color} size={size} />
    ),
  },
  {
    href: '/calculators',
    label: 'Calculators',
    icon: (color, size) => (
      <MaterialCommunityIcons name="calculator-variant" color={color} size={size} />
    ),
  },
  {
    href: '/exercise-library',
    label: 'Exercise Library',
    icon: (color, size) => <Feather name="book-open" color={color} size={size} />,
  },
  {
    href: '/measurements',
    label: 'Measurements',
    icon: (color, size) => (
      <MaterialCommunityIcons name="ruler" color={color} size={size} />
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (color, size) => <Feather name="settings" color={color} size={size} />,
  },
];

export const MoreSheet = forwardRef<BottomSheetModal>(function MoreSheet(_, ref) {
  const router = useRouter();
  const snapPoints = useMemo(() => ['70%'], []);

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
      <BottomSheetView style={styles.content}>
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

        <View style={[styles.sectionLabelRow, styles.sectionLabelPro]}>
          <MaterialCommunityIcons name="crown" size={11} color={Colors.accentLight} />
          <Text style={styles.sectionLabelProText}>PRO</Text>
        </View>
        <View style={styles.grid}>
          {PRO_ITEMS.map((item) => (
            <MoreCard key={item.label} item={item} onPress={() => navigate(item.href)} />
          ))}
          <View style={styles.cardSlot} />
        </View>

        <Text style={styles.sectionLabelGeneral}>GENERAL</Text>
        <View style={styles.grid}>
          {GENERAL_ITEMS.map((item) => (
            <MoreCard key={item.label} item={item} onPress={() => navigate(item.href)} />
          ))}
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
      </BottomSheetView>
    </BottomSheetModal>
  );
});

type MoreCardProps = {
  item: MoreItem;
  onPress: (e: GestureResponderEvent) => void;
};

function MoreCard({ item, onPress }: MoreCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.cardSlot, styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={item.label}
    >
      {item.proBadge ? (
        <View style={styles.proBadge}>
          <Text style={styles.proBadgeText}>Pro</Text>
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
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
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
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 4,
    paddingTop: 14,
    paddingBottom: 6,
  },
  sectionLabelPro: {},
  sectionLabelProText: {
    color: Colors.accentLight,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  sectionLabelGeneral: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
    paddingHorizontal: 4,
    paddingTop: 10,
    paddingBottom: 6,
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
  proBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: Colors.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  proBadgeText: {
    color: Colors.accentLight,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  themeRow: {
    marginTop: 16,
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
