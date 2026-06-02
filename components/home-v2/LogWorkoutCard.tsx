import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Defs,
  Ellipse,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { ArrowRight, Dumbbell } from 'lucide-react-native';
import { Font } from '../../lib/design-system';
import { useTheme, useTokens } from '../../lib/theme-context';
import { SAKURA_BURGUNDY } from '../../lib/tokens';

type Props = {
  onStart: () => void;
};

/**
 * Dashboard "Log today's workout" card.
 *
 * Implementation maps the attached JSX spec 1:1:
 *   • Card chrome: linear-gradient(180deg, .12 → .04 → .02) + emerald-tinted border
 *   • Two ambient glow circles (top-left + bottom-right), each ambient-drifting
 *     on different durations (6s / 8s w/ 2s delay) so they never sync
 *   • One floating dumbbell, three nested layers so translateY, opacity, and
 *     rotate(-15deg) don't fight each other
 *   • Foreground: pulse dot, "READY TO LIFT?" eyebrow, headline, sub, CTA
 *     with continuous shine sweep
 *
 * Implementation note: the spec uses CSS `filter: blur(40px)` on the glow
 * circles. React Native has no equivalent primitive, so the glow circles
 * here render as soft alpha-falloff via LinearGradient — close enough at
 * the spec's positioning (which has both circles overflowing the card),
 * and we don't pay the cost of a real blur shader.
 */
export default function LogWorkoutCard({ onStart }: Props) {
  const t = useTokens();
  const { accent } = useTheme();
  // Sakura swaps the floating dumbbell silhouette for a denser local
  // petal layer + vertical 修行 kanji column. The base linear wash and
  // atmospheric radials also swap from emerald/mint to rose hues.
  const isSakura = accent === 'rose';
  // ---- Shared values ----
  const ambient = useSharedValue(0);
  const floatY = useSharedValue(0);
  const floatOpacity = useSharedValue(0);
  const pulse = useSharedValue(0);
  const shine = useSharedValue(0);

  useEffect(() => {
    const ease = Easing.inOut(Easing.quad);
    // One ambient breath shared across the whole card. Replaces the two
    // discrete glow circles from the spec — RN has no `filter: blur`, so
    // those rendered as visible bubbles instead of atmospheric haze.
    ambient.value = withRepeat(withTiming(1, { duration: 7000, easing: ease }), -1, true);
    floatY.value = withRepeat(withTiming(1, { duration: 5000, easing: ease }), -1, true);
    floatOpacity.value = withRepeat(
      withTiming(1, { duration: 6000, easing: ease }),
      -1,
      true,
    );
    pulse.value = withRepeat(withTiming(1, { duration: 2000, easing: ease }), -1, true);
    shine.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [ambient, floatY, floatOpacity, pulse, shine]);

  // ---- Animated styles ----
  const ambientStyle = useAnimatedStyle(() => ({
    opacity: 0.85 + ambient.value * 0.15,
  }));
  const floatYStyle = useAnimatedStyle(() => ({
    // Drift bumped to ±20px so the rise/fall is clearly visible.
    transform: [{ translateY: floatY.value * -20 }],
  }));
  const floatOpacityStyle = useAnimatedStyle(() => ({
    // 0.08 floor → 0.14 peak (was 0.06 → 0.10). Still watermark-subtle but
    // the breath is unmistakably alive instead of bordering on static.
    opacity: 0.08 + floatOpacity.value * 0.06,
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 1 - pulse.value * 0.6,
    transform: [{ scale: 1 - pulse.value * 0.2 }],
  }));
  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -300 + shine.value * 600 }],
  }));

  return (
    <View
      style={[
        styles.outer,
        {
          backgroundColor: t.bgCard,
          borderColor: t.primaryTintBorder,
        },
        t.shadowPrimaryGlow,
      ]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel="Start a workout"
    >
      {/* Base linear wash — emerald-tinted for Emerald, rose-tinted for
          Sakura. Same falloff curve in both cases. */}
      <LinearGradient
        colors={
          isSakura
            ? [
                'rgba(232, 155, 174, 0.14)',
                'rgba(232, 155, 174, 0.06)',
                'rgba(232, 155, 174, 0.02)',
              ]
            : [
                'rgba(16, 185, 129, 0.14)',
                'rgba(16, 185, 129, 0.06)',
                'rgba(16, 185, 129, 0.02)',
              ]
        }
        locations={[0, 0.55, 1]}
        style={styles.bg}
      />

      {/* Atmospheric radial overlay — two soft radial sources in opposite
          corners that dissolve into the base wash. Hue swaps with theme:
          emerald + mint for Emerald, deep + light rose for Sakura. */}
      <Animated.View
        pointerEvents="none"
        style={[styles.ambient, ambientStyle]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <Defs>
            <RadialGradient id="lwTop" cx="25%" cy="15%" r="85%" fx="25%" fy="15%">
              <Stop
                offset="0%"
                stopColor={isSakura ? '#E89BAE' : '#10B981'}
                stopOpacity={0.28}
              />
              <Stop
                offset="55%"
                stopColor={isSakura ? '#E89BAE' : '#10B981'}
                stopOpacity={0.06}
              />
              <Stop
                offset="100%"
                stopColor={isSakura ? '#E89BAE' : '#10B981'}
                stopOpacity={0}
              />
            </RadialGradient>
            <RadialGradient id="lwBottom" cx="85%" cy="85%" r="75%" fx="85%" fy="85%">
              <Stop
                offset="0%"
                stopColor={isSakura ? '#FFC8D7' : '#34D399'}
                stopOpacity={0.16}
              />
              <Stop
                offset="60%"
                stopColor={isSakura ? '#FFC8D7' : '#34D399'}
                stopOpacity={0.04}
              />
              <Stop
                offset="100%"
                stopColor={isSakura ? '#FFC8D7' : '#34D399'}
                stopOpacity={0}
              />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={100} height={100} fill="url(#lwTop)" />
          <Rect x={0} y={0} width={100} height={100} fill="url(#lwBottom)" />
        </Svg>
      </Animated.View>

      {/* Decoration layer — Sakura: high-density local petals + vertical
          kanji column. Emerald: floating dumbbell silhouette. */}
      {isSakura ? (
        <>
          <LocalPetalsLayer />
          <VerticalKanjiColumn />
        </>
      ) : (
        <Animated.View
          style={[styles.dumbbellOuter, floatYStyle]}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Animated.View style={[styles.dumbbellMiddle, floatOpacityStyle]}>
            <View style={styles.dumbbellInner}>
              {/* On dark: white silhouette. On light: warm-dark silhouette
                  (matches the mockup — dumbbell uses textPrimary so it
                  reads correctly against the cream card. */}
              <Dumbbell size={180} color={t.textPrimary} strokeWidth={1.5} />
            </View>
          </Animated.View>
        </Animated.View>
      )}

      {/* Foreground content — wrapped so it sits above the glow + dumbbell
          layers (which are absolute-positioned). */}
      <View style={styles.fg}>
        <View style={styles.eyebrowRow}>
          <Animated.View
            style={[
              styles.pulseDot,
              { backgroundColor: t.primary },
              pulseStyle,
            ]}
          />
          <Text style={[styles.eyebrow, { color: t.primary }]}>
            READY TO LIFT?
          </Text>
        </View>

        <Text style={[styles.headline, { color: t.textPrimary }]}>
          Log today's workout.
        </Text>
        <Text style={[styles.sub, { color: t.textSecondary }]}>
          Pick a template or start fresh. Every set counts.
        </Text>

        <Pressable
          onPress={onStart}
          accessibilityRole="button"
          accessibilityLabel="Start a workout session"
          style={({ pressed }) => [
            styles.ctaBtn,
            { backgroundColor: t.primary },
            t.shadowPrimaryGlow,
            pressed && styles.ctaPressed,
          ]}
        >
          <LinearGradient
            colors={[t.primaryGradientStart, t.primaryGradientEnd]}
            style={styles.ctaGradient}
          />
          {/* Inner top-edge highlight — fakes the inset 0 1px 0 white shadow */}
          <View pointerEvents="none" style={styles.ctaTopHighlight} />
          {/* Continuous shine sweep */}
          <Animated.View
            pointerEvents="none"
            style={[styles.shineTrack, shineStyle]}
          >
            <LinearGradient
              colors={[
                'transparent',
                'rgba(255, 255, 255, 0.15)',
                'transparent',
              ]}
              locations={[0.3, 0.5, 0.7]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.shineFill}
            />
          </Animated.View>
          <View style={styles.ctaContent}>
            <Text style={[styles.ctaText, { color: t.textOnPrimary }]}>
              Start session
            </Text>
            <ArrowRight size={16} color={t.textOnPrimary} strokeWidth={3} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const CARD_RADIUS = 16;

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: 20,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 20,
  },
  bg: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: CARD_RADIUS,
  },
  ambient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dumbbellOuter: {
    position: 'absolute',
    // Shifted off the right edge so the bell silhouette feels like it's
    // bleeding out of the card rather than centered as a stamp. Anchored
    // toward the top so the lower bell head lands near the headline row.
    right: -20,
    top: 4,
    width: 180,
    height: 180,
  },
  dumbbellMiddle: {
    width: '100%',
    height: '100%',
  },
  dumbbellInner: {
    width: '100%',
    height: '100%',
    transform: [{ rotate: '75deg' }],
  },
  fg: {
    position: 'relative',
    zIndex: 2,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eyebrow: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 2,
  },
  headline: {
    fontFamily: Font.bold,
    fontSize: 24,
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  sub: {
    marginTop: 8,
    fontFamily: Font.medium,
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 240,
  },
  ctaBtn: {
    marginTop: 20,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
  },
  ctaPressed: {
    transform: [{ scale: 0.98 }],
  },
  ctaGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  ctaTopHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  ctaContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    fontFamily: Font.bold,
    fontSize: 14,
    letterSpacing: -0.1,
  },
  shineTrack: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 300,
  },
  shineFill: {
    flex: 1,
  },
  // ----- Sakura-only decoration layers -----
  petalsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  kanjiColumn: {
    position: 'absolute',
    // Pulled in from the corner so the column reads as quiet ornament
    // inside the card rather than hugging the edge.
    top: 16,
    right: 20,
    alignItems: 'center',
    opacity: 0.5,
    zIndex: 1,
  },
  kanjiText: {
    fontFamily: Platform.select({
      ios: 'Hiragino Mincho ProN',
      // Android renders CJK via the system serif fallback. Using the
      // generic 'serif' family avoids bundling Noto Serif JP for v1 —
      // the visual is slightly less polished than the bundled version
      // but still clearly the right characters.
      android: 'serif',
      default: 'serif',
    }),
    fontSize: 18,
    fontWeight: '700',
    color: SAKURA_BURGUNDY,
    lineHeight: 18,
    letterSpacing: -0.36,
  },
  kanjiDivider: {
    width: 8,
    height: 1,
    backgroundColor: SAKURA_BURGUNDY,
    opacity: 0.5,
    marginVertical: 4,
  },
});

// ---------------------------------------------------------------------------
// Sakura-specific decoration components (only rendered when accent === 'rose')
// ---------------------------------------------------------------------------

// 14 petals scoped to the card bounds. Specs are denser + faster than the
// global SakuraAtmospherics layer per the spec:
//   • 3 near layer (size 20-22, opacity 0.90-0.95, duration ~9000-11000ms)
//   • 6 mid layer (size 14-16, opacity 0.80-0.85, duration ~11000-13000ms)
//   • 5 far layer (size 8-9, opacity 0.30-0.50, duration ~15000-17000ms)
//
// `fallDistance` is hardcoded to 320px (~the card's intrinsic height) so
// petals reset at the card bottom rather than the screen bottom — the
// effect feels contained to the card.
const CARD_FALL_DISTANCE = 320;

type LocalPetalSpec = {
  leftPct: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  drift: number;
  rotation: number;
};

const LOCAL_PETALS: LocalPetalSpec[] = [
  // Near layer — large, prominent, fast
  { leftPct: 0.15, size: 20, duration: 9_000, delay: 0, opacity: 0.95, drift: -30, rotation: 380 },
  { leftPct: 0.45, size: 22, duration: 11_000, delay: 2_500, opacity: 0.90, drift: 40, rotation: -520 },
  { leftPct: 0.75, size: 21, duration: 10_000, delay: 5_000, opacity: 0.95, drift: -20, rotation: 460 },
  // Mid layer — medium spread across
  { leftPct: 0.08, size: 14, duration: 12_000, delay: 1_000, opacity: 0.80, drift: 25, rotation: -340 },
  { leftPct: 0.25, size: 16, duration: 13_000, delay: 3_500, opacity: 0.85, drift: -35, rotation: 440 },
  { leftPct: 0.38, size: 15, duration: 11_500, delay: 6_000, opacity: 0.80, drift: 30, rotation: -460 },
  { leftPct: 0.55, size: 14, duration: 12_500, delay: 4_000, opacity: 0.85, drift: 18, rotation: 320 },
  { leftPct: 0.68, size: 16, duration: 11_000, delay: 7_000, opacity: 0.80, drift: -40, rotation: -400 },
  { leftPct: 0.88, size: 15, duration: 12_000, delay: 8_500, opacity: 0.85, drift: 22, rotation: 360 },
  // Far layer — small, slower, more transparent
  { leftPct: 0.18, size: 8, duration: 16_000, delay: 500, opacity: 0.45, drift: -15, rotation: 280 },
  { leftPct: 0.35, size: 9, duration: 17_000, delay: 4_500, opacity: 0.50, drift: 20, rotation: -360 },
  { leftPct: 0.50, size: 8, duration: 15_000, delay: 8_000, opacity: 0.40, drift: -10, rotation: 320 },
  { leftPct: 0.65, size: 9, duration: 16_500, delay: 2_000, opacity: 0.45, drift: 15, rotation: -380 },
  { leftPct: 0.82, size: 8, duration: 17_000, delay: 6_000, opacity: 0.50, drift: -12, rotation: 340 },
];

function LocalPetalsLayer() {
  return (
    <View style={styles.petalsContainer} pointerEvents="none">
      {LOCAL_PETALS.map((spec, i) => (
        <LocalPetal key={i} {...spec} />
      ))}
    </View>
  );
}

function LocalPetal({
  leftPct,
  size,
  duration,
  delay,
  opacity,
  drift,
  rotation,
}: LocalPetalSpec) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, {
          duration,
          easing: Easing.bezier(0.33, 0, 0.67, 1),
        }),
        -1,
        false,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const translateY = -size + p * (CARD_FALL_DISTANCE + size * 2);
    const translateX = p * drift;
    const rotate = p * rotation;
    let alpha = opacity;
    if (p < 0.05) alpha = opacity * (p / 0.05);
    else if (p > 0.9) alpha = opacity * (1 - (p - 0.9) / 0.1);
    return {
      transform: [
        { translateY },
        { translateX },
        { rotate: `${rotate}deg` },
      ],
      opacity: alpha,
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: `${leftPct * 100}%`,
          top: 0,
          width: size,
          height: size,
        },
        animatedStyle,
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 20 20">
        <Path
          d="M 10 19 Q 3 17, 2 11 Q 2 5, 7 2 Q 9 4, 10 5 Q 11 4, 13 2 Q 18 5, 18 11 Q 17 17, 10 19 Z"
          fill="#F5C9D4"
          stroke="#E89BAE"
          strokeWidth={0.3}
          opacity={0.95}
        />
        <Ellipse cx={10} cy={13} rx={3.5} ry={4} fill="#FFE8F0" opacity={0.55} />
        <Path
          d="M 10 6 L 10 17"
          stroke="#E89BAE"
          strokeWidth={0.2}
          opacity={0.4}
        />
      </Svg>
    </Animated.View>
  );
}

/**
 * Vertical kanji column — 修行 (shugyō, "training / discipline"). Two
 * characters stacked with a thin horizontal divider between them, sized
 * to feel like a hanmoji column-stamp in the upper-right corner of the
 * card. Burgundy at 50% opacity so it reads as quiet ornament rather
 * than competing with the headline.
 */
function VerticalKanjiColumn() {
  return (
    <View
      style={styles.kanjiColumn}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text style={styles.kanjiText}>修</Text>
      <View style={styles.kanjiDivider} />
      <Text style={styles.kanjiText}>行</Text>
    </View>
  );
}
