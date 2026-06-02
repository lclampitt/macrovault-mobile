import { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Motion } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';

type Props = {
  /** 0–1 fill ratio (clamped). */
  value: number;
  color?: string;
  /** Stagger delay applied on mount, in ms. */
  delay?: number;
  /** Track height (px). */
  height?: number;
  style?: ViewStyle;
};

/**
 * 3px progress bar with #1A1A1A track, scaleX animation from 0 → value over
 * 1s using cubic-bezier(0.16, 1, 0.3, 1), with the staggered 100ms delays
 * the spec calls for.
 */
export default function ProgressBar({
  value,
  color,
  delay = 0,
  height = 3,
  style,
}: Props) {
  const t = useTokens();
  const fillColor = color ?? t.primary;
  const clamped = Math.max(0, Math.min(1, value));
  const v = useSharedValue(0);

  useEffect(() => {
    v.value = withDelay(
      Motion.progressDelay + delay,
      withTiming(clamped, {
        duration: Motion.durationProgress,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
    );
  }, [clamped, delay, v]);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: v.value }],
  }));

  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: height / 2, backgroundColor: t.bgTrack },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          { backgroundColor: fillColor, height, borderRadius: height / 2 },
          fillStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    transformOrigin: 'left center',
  },
});
