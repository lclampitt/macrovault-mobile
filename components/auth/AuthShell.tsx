import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { DS } from '../../lib/design-system';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

/** Black canvas + drifting emerald ambient glows top-left + bottom-right. */
export default function AuthShell({ children, style }: Props) {
  const drift = useSharedValue(0);
  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [drift]);

  const topGlow = useAnimatedStyle(() => ({
    transform: [
      { translateX: drift.value * 20 },
      { translateY: drift.value * -10 },
      { scale: 1 + drift.value * 0.1 },
    ],
    opacity: 0.45 + drift.value * 0.2,
  }));
  const bottomGlow = useAnimatedStyle(() => ({
    transform: [
      { translateX: -drift.value * 20 },
      { translateY: -drift.value * -10 },
      { scale: 1 + drift.value * 0.1 },
    ],
    opacity: 0.45 + drift.value * 0.2,
  }));

  return (
    <SafeAreaView style={[styles.root, style]} edges={['top', 'bottom']}>
      <Animated.View
        pointerEvents="none"
        style={[styles.glow, styles.glowTop, topGlow]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.glow, styles.glowBottom, bottomGlow]}
      />
      <View style={styles.contentWrap}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DS.bg,
  },
  contentWrap: {
    flex: 1,
    zIndex: 2,
  },
  glow: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    // RN doesn't ship blur on Views; the rgba alpha + opacity drift fakes it
    // well enough on a black bg. expo-blur would be overkill here.
  },
  glowTop: {
    top: -200,
    left: -100,
  },
  glowBottom: {
    bottom: -200,
    right: -100,
  },
});
