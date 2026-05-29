import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Sparkles } from 'lucide-react-native';
import { DS, Font, Radius, Shadow } from '../../lib/design-system';

type Props = {
  onPress: () => void;
  loading?: boolean;
  progress?: { done: number; total: number };
};

/**
 * Full-width emerald CTA with the shimmer animation. When `loading` is true
 * the shimmer keeps running (matches the spec — "you can use the shimmer
 * animation that's already there as the loading indicator").
 */
export default function AISuggestWeekBanner({
  onPress,
  loading = false,
  progress,
}: Props) {
  const x = useSharedValue(0);

  useEffect(() => {
    // The shimmer runs constantly (idle pulse + loading both feel "alive").
    x.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
    return () => cancelAnimation(x);
  }, [x]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: -200 + x.value * 500, // slides a 200px-wide gradient
      },
    ],
  }));

  return (
    <View style={styles.outer}>
      <Pressable
        onPress={onPress}
        disabled={loading}
        style={({ pressed }) => [
          styles.btn,
          Shadow.emeraldGlow,
          styles.ring,
          pressed && !loading && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="AI suggest this week"
        accessibilityState={{ disabled: loading }}
      >
        {/* Solid emerald base. */}
        <View style={styles.solidBg} pointerEvents="none" />
        {/* Shimmer overlay — translates a subtle lighter-emerald band across. */}
        <Animated.View
          style={[styles.shimmerWrap, shimmerStyle]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={[
              'rgba(255, 255, 255, 0)',
              'rgba(255, 255, 255, 0.18)',
              'rgba(255, 255, 255, 0)',
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.shimmerInner}
          />
        </Animated.View>

        <View style={styles.contentRow}>
          <Sparkles size={14} color="#000" strokeWidth={2.5} />
          <Text style={styles.label}>
            {loading
              ? progress
                ? `Generating… ${progress.done}/${progress.total}`
                : 'Generating week…'
              : 'AI suggest this week'}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  btn: {
    width: '100%',
    height: 44,
    borderRadius: Radius.cardCompact,
    overflow: 'hidden',
    backgroundColor: DS.accent,
  },
  ring: {
    borderWidth: 1,
    borderColor: DS.accentBorderStrong,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  solidBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: DS.accent,
  },
  shimmerWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 200,
  },
  shimmerInner: {
    flex: 1,
    height: '100%',
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: '#000',
  },
});
