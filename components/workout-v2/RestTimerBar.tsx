import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Timer, X } from 'lucide-react-native';
import { Font, Tabular } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  /** Seconds elapsed since rest started (0 → target). */
  elapsed: number;
  target: number;
  onAdd15: () => void;
  onCancel: () => void;
  /** Open the rest-length picker. */
  onEditTarget: () => void;
};

const SIZE = 36;
const STROKE = 3;
const R = (SIZE - STROKE) / 2 - 1;
const C = 2 * Math.PI * R;

function fmtTime(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Sticky rest timer. Circular progress ring + countdown + +15s + dismiss.
 * Slides into the header area whenever a set is marked complete.
 */
export default function RestTimerBar({
  elapsed,
  target,
  onAdd15,
  onCancel,
  onEditTarget,
}: Props) {
  const t = useTokens();
  const remaining = Math.max(0, target - elapsed);
  const pct = target > 0 ? Math.min(1, elapsed / target) : 0;

  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(pct, {
      duration: 900,
      easing: Easing.linear,
    });
  }, [pct, progress]);

  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: C * (1 - progress.value),
  }));

  return (
    <View style={[styles.outer, { borderBottomColor: t.borderDefault }]}>
      <View
        style={[
          styles.bar,
          { backgroundColor: t.bgCard, borderColor: t.primaryTintBorder },
        ]}
      >
        <LinearGradient
          colors={t.gradientCardTinted}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <View style={styles.ringWrap}>
          <Svg width={SIZE} height={SIZE}>
            {/* Track */}
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke={t.primaryTintBorder}
              strokeWidth={STROKE}
            />
            {/* Progress — rotated -90° so it starts at 12 o'clock */}
            <AnimatedCircle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke={t.primary}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={C}
              animatedProps={ringProps}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          </Svg>
          <View style={styles.ringIcon} pointerEvents="none">
            <Timer size={13} color={t.primary} strokeWidth={2.5} />
          </View>
        </View>

        <Pressable
          onPress={onEditTarget}
          style={({ pressed }) => [styles.text, pressed && styles.textPressed]}
          accessibilityRole="button"
          accessibilityLabel="Change rest length"
        >
          <Text style={[styles.label, { color: t.primary }]}>REST · TAP TO CHANGE</Text>
          <Text
            style={[styles.value, Tabular, { color: t.textPrimary }]}
            accessibilityLiveRegion="polite"
          >
            {fmtTime(remaining)}
          </Text>
        </Pressable>

        <View style={styles.actions}>
          <Pressable
            onPress={onAdd15}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: t.bgPage, borderColor: t.borderDefault },
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Add 15 seconds"
          >
            <Text style={[styles.add15, Tabular, { color: t.primary }]}>+15</Text>
          </Pressable>
          <Pressable
            onPress={onCancel}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: t.bgPage, borderColor: t.borderDefault },
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Cancel rest timer"
          >
            <X size={13} color={t.textSecondary} strokeWidth={2} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  ringWrap: {
    width: SIZE,
    height: SIZE,
    position: 'relative',
  },
  ringIcon: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    paddingVertical: 2,
  },
  textPressed: {
    opacity: 0.7,
  },
  label: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  value: {
    fontFamily: Font.bold,
    fontSize: 15,
    letterSpacing: -0.3,
  },
  actions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    transform: [{ scale: 0.9 }],
  },
  add15: {
    fontFamily: Font.bold,
    fontSize: 10,
  },
});
