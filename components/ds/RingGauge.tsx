import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Motion } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  /** 0–100 percent. */
  percent: number;
  size?: number;
  strokeWidth?: number;
  /** Number of perimeter tick marks (12 = every 30° "instrument feel"). */
  ticks?: number;
  children?: React.ReactNode;
};

/**
 * Emerald ring on a #1A1A1A track with rounded stroke + 12 perimeter tick
 * marks for the "instrument" look. Animates from 0 → percent on mount over
 * 1.2s with cubic-bezier(0.16, 1, 0.3, 1).
 *
 * Drop-shadow on the stroke is approximated with a wider, low-opacity ring
 * behind the main one (react-native-svg's <Filter> is slow on Android).
 */
export default function RingGauge({
  percent,
  size = 110,
  strokeWidth = 6,
  ticks = 12,
  children,
}: Props) {
  const t = useTokens();
  const clamped = Math.max(0, Math.min(100, percent));
  const r = (size - strokeWidth - 8) / 2; // 8px inset for tick clearance
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(
      Motion.progressDelay,
      withTiming(clamped / 100, {
        duration: Motion.durationProgress + 100,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      }),
    );
  }, [clamped, v]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - v.value),
  }));

  const tickInner = r + strokeWidth / 2 + 1;
  const tickOuter = tickInner + 3;

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <Svg width={size} height={size}>
        {/* Tick marks (no rotation — drawn at absolute angles). */}
        <G>
          {Array.from({ length: ticks }).map((_, i) => {
            const angle = (i * (360 / ticks) * Math.PI) / 180;
            const x1 = cx + tickInner * Math.cos(angle);
            const y1 = cy + tickInner * Math.sin(angle);
            const x2 = cx + tickOuter * Math.cos(angle);
            const y2 = cy + tickOuter * Math.sin(angle);
            return (
              <Line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={t.borderDefault}
                strokeWidth={1}
              />
            );
          })}
        </G>

        {/* Rotate the ring -90° so 0% starts at the top. */}
        <G rotation={-90} origin={`${cx}, ${cy}`}>
          {/* Track */}
          <Circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={t.bgTrack}
            strokeWidth={strokeWidth}
          />
          {/* Faux glow — wider, low-opacity stroke behind the main one. */}
          <AnimatedCircle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={t.primary}
            strokeOpacity={0.35}
            strokeWidth={strokeWidth + 4}
            strokeLinecap="round"
            strokeDasharray={`${circumference}, ${circumference}`}
            animatedProps={animatedProps}
          />
          {/* Sharp emerald stroke. */}
          <AnimatedCircle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={t.primary}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference}, ${circumference}`}
            animatedProps={animatedProps}
          />
        </G>
      </Svg>

      {/* Center content */}
      <View style={styles.center} pointerEvents="none">
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
