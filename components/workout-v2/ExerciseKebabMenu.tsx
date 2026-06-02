import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  LineChart,
  MoveVertical,
  Replace,
  SkipForward,
  Trash2,
} from 'lucide-react-native';
import { Font } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';

const DELETE_COLOR = '#E5736A';

type Props = {
  visible: boolean;
  /** Exercise name used in accessibility labels ("Skip Bench Press for this session"). */
  exerciseName: string;
  onSkip: () => void;
  onReplace?: () => void;
  onReorder?: () => void;
  onHistory?: () => void;
  onRemove?: () => void;
  /** Fired when the user taps off the menu — caller closes it. */
  onDismiss: () => void;
};

/**
 * Exercise-level dropdown menu. Skip is the FIRST item and gets the emerald-
 * tinted active treatment per spec, with a "This session" microtype clarifying
 * the action is temporary.
 *
 * The menu floats absolutely below the kebab button. Tap-outside dismissal
 * is handled by the surrounding card view (it intercepts the touch via a
 * fullscreen Pressable backdrop).
 */
export default function ExerciseKebabMenu({
  visible,
  exerciseName,
  onSkip,
  onReplace,
  onReorder,
  onHistory,
  onRemove,
  onDismiss,
}: Props) {
  const t = useTokens();
  const open = useSharedValue(0);
  useEffect(() => {
    open.value = withTiming(visible ? 1 : 0, {
      duration: 200,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
  }, [visible, open]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: open.value,
    transform: [
      { translateY: -4 + open.value * 4 },
      { scale: 0.96 + open.value * 0.04 },
    ],
  }));

  if (!visible) return null;

  return (
    <>
      {/* Tap-off backdrop — full screen, transparent, intercepts touches. */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onDismiss}
        accessibilityElementsHidden
      />
      <Animated.View
        style={[
          styles.menu,
          { backgroundColor: t.bgCardElevated, borderColor: t.borderStrong },
          containerStyle,
        ]}
        accessibilityRole="menu"
      >
        <Pressable
          onPress={() => {
            onSkip();
            onDismiss();
          }}
          style={({ pressed }) => [
            styles.item,
            { backgroundColor: t.primaryTintBg },
            pressed && { backgroundColor: t.primaryTintBorder },
          ]}
          accessibilityRole="menuitem"
          accessibilityLabel={`Skip ${exerciseName} for this session`}
        >
          <SkipForward size={14} color={t.primary} strokeWidth={2.5} />
          <Text style={[styles.itemLabel, styles.itemLabelSkip, { color: t.primary }]}>
            Skip exercise
          </Text>
          <Text style={[styles.itemTrailing, { color: t.primary }]}>This session</Text>
        </Pressable>

        <View style={[styles.divider, { backgroundColor: t.borderDefault }]} />

        <Pressable
          onPress={() => {
            onReplace?.();
            onDismiss();
          }}
          disabled={!onReplace}
          style={({ pressed }) => [
            styles.item,
            pressed && { backgroundColor: t.borderDefault },
            !onReplace && styles.itemDisabled,
          ]}
          accessibilityRole="menuitem"
        >
          <Replace size={14} color={t.textSecondary} strokeWidth={2} />
          <Text style={[styles.itemLabel, { color: t.textPrimary }]}>Replace exercise</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            onReorder?.();
            onDismiss();
          }}
          disabled={!onReorder}
          style={({ pressed }) => [
            styles.item,
            pressed && { backgroundColor: t.borderDefault },
            !onReorder && styles.itemDisabled,
          ]}
          accessibilityRole="menuitem"
        >
          <MoveVertical size={14} color={t.textSecondary} strokeWidth={2} />
          <Text style={[styles.itemLabel, { color: t.textPrimary }]}>Reorder</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            onHistory?.();
            onDismiss();
          }}
          disabled={!onHistory}
          style={({ pressed }) => [
            styles.item,
            pressed && { backgroundColor: t.borderDefault },
            !onHistory && styles.itemDisabled,
          ]}
          accessibilityRole="menuitem"
        >
          <LineChart size={14} color={t.textSecondary} strokeWidth={2} />
          <Text style={[styles.itemLabel, { color: t.textPrimary }]}>View history</Text>
        </Pressable>

        <View style={[styles.divider, { backgroundColor: t.borderDefault }]} />

        <Pressable
          onPress={() => {
            onRemove?.();
            onDismiss();
          }}
          disabled={!onRemove}
          style={({ pressed }) => [
            styles.item,
            pressed && { backgroundColor: t.borderDefault },
            !onRemove && styles.itemDisabled,
          ]}
          accessibilityRole="menuitem"
        >
          <Trash2 size={14} color={DELETE_COLOR} strokeWidth={2} />
          <Text style={[styles.itemLabel, { color: DELETE_COLOR }]}>
            Remove from template
          </Text>
        </Pressable>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    top: 52,
    right: 0,
    minWidth: 200,
    padding: 4,
    borderWidth: 1,
    borderRadius: 12,
    zIndex: 50,
    shadowColor: '#000',
    shadowOpacity: 0.7,
    shadowOffset: { width: 0, height: 20 },
    shadowRadius: 40,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  itemDisabled: {
    opacity: 0.4,
  },
  itemLabel: {
    flex: 1,
    fontFamily: Font.semibold,
    fontSize: 12,
  },
  itemLabelSkip: {
    fontFamily: Font.bold,
  },
  itemTrailing: {
    fontFamily: Font.medium,
    fontSize: 9,
    opacity: 0.6,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
});
