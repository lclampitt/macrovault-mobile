import { useEffect } from 'react';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTokens } from '../../lib/theme-context';

type Props = {
  size?: number;
};

/**
 * Live-status dot. Infinite 2s ease-in-out, opacity 1 → 0.5, scale 1 → 0.85.
 */
export default function PulseDot({ size = 6 }: Props) {
  const t = useTokens();
  const v = useSharedValue(0);

  useEffect(() => {
    v.value = withRepeat(
      withTiming(1, {
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(v);
    };
  }, [v]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - v.value * 0.5,
    transform: [{ scale: 1 - v.value * 0.15 }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: t.primary,
        },
        animatedStyle,
      ]}
    />
  );
}
