import { useEffect, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  Dimensions,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Defs,
  Ellipse,
  G,
  Path,
  Pattern,
  Rect,
} from 'react-native-svg';
import { SAKURA_BURGUNDY } from '../../lib/tokens';

// --------------------------------------------------------------------------
// SakuraAtmospherics — global decoration for the Sakura theme
//
// Two layers, both `pointerEvents="none"` so neither intercepts taps:
//   1. Seigaiha (青海波) wave pattern — static SVG `<Pattern>` tiled across
//      the viewport at ~7% opacity. Reads as a faint washi paper texture.
//   2. Eight falling cherry petals — react-native-reanimated translate +
//      rotate animations on absolute-positioned `<Animated.View>`s. Each
//      petal is an SVG with the proper notched-tip cherry blossom shape.
//
// Mount rules
// -----------
//   • Mounted ONCE in `_layout.tsx`, gated on `accent === 'rose'` (Sakura)
//     so Emerald users pay zero rendering cost (Petals + seigaiha both
//     unmount entirely).
//   • `position: absolute` + `pointerEvents="none"` so it never intercepts
//     taps and sits behind every screen's content.
//   • Sibling-of-stack ordering: rendered BEFORE the chrome + Stack in
//     `_layout.tsx` so cards (opaque `bgCard`) render ON TOP of it.
//     Petals fall in the *background* of all the boxes, visible in the
//     gaps between cards and behind the transparent body surface.
//   • The header SafeAreaView paints `tokens.bgPage` opaquely, so
//     atmospherics are hidden in the chrome zone. Petals visually "drop
//     in" from below the chrome rather than falling across the status
//     bar — keeps the chrome legible while the body carries the texture.
//   • The Log Workout card on the dashboard ALSO has its own local
//     petal field (14 petals scoped to the card's bounds) — that's a
//     hero treatment, separate from this ambient layer.
//
// Why explicit pixel dimensions
// -----------------------------
// react-native-svg's `<Svg width="100%" height="100%">` only fills the
// parent reliably when the parent has a layout-computed size. Inside an
// `absoluteFill` View `100%` can fall back to a default canvas size and
// tile only a fraction of the screen. Pinning to `Dimensions.get
// ('window')` guarantees the pattern fills the entire viewport uniformly.
//
// Reduced motion
// --------------
// Respects the system reduce-motion preference: when enabled, only the
// seigaiha pattern renders; the animated petal layer is skipped.
// --------------------------------------------------------------------------

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get('window');

type PetalSpec = {
  /** Left position as a 0–1 fraction of SCREEN_WIDTH. */
  leftPct: number;
  /** Pixel size of the petal. */
  size: number;
  /** Full fall cycle duration in ms. */
  duration: number;
  /** Animation start delay in ms. */
  delay: number;
  /** Peak opacity at the middle of the fall. */
  opacity: number;
  /** Total horizontal drift in pixels (positive = right, negative = left). */
  drift: number;
  /** Total rotation in degrees over the fall. */
  rotation: number;
};

// Eight petals — 5 "mid" layer (larger / closer) + 3 "far" layer (smaller /
// faded / slower). Sparse + slow on purpose — this is an ambient layer
// behind data-dense screens, not a focal effect. The dashboard's Log
// Workout card has its own dense local petal field for the hero moment.
const PETALS: PetalSpec[] = [
  { leftPct: 0.10, size: 14, duration: 18_000, delay: 0,      opacity: 0.45, drift: -40, rotation: 380 },
  { leftPct: 0.28, size: 16, duration: 21_000, delay: 4_000,  opacity: 0.40, drift: 55,  rotation: -460 },
  { leftPct: 0.50, size: 14, duration: 19_000, delay: 8_000,  opacity: 0.45, drift: -20, rotation: 440 },
  { leftPct: 0.72, size: 15, duration: 20_000, delay: 2_000,  opacity: 0.40, drift: 35,  rotation: -400 },
  { leftPct: 0.88, size: 13, duration: 22_000, delay: 12_000, opacity: 0.40, drift: -50, rotation: 360 },
  { leftPct: 0.20, size: 8,  duration: 25_000, delay: 6_000,  opacity: 0.30, drift: -25, rotation: 280 },
  { leftPct: 0.60, size: 9,  duration: 23_000, delay: 14_000, opacity: 0.30, drift: 30,  rotation: -360 },
  { leftPct: 0.80, size: 8,  duration: 26_000, delay: 10_000, opacity: 0.30, drift: -15, rotation: 320 },
];

export default function SakuraAtmospherics() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (mounted) setReduceMotion(v);
      })
      .catch(() => {
        /* swallow — default to motion enabled */
      });
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      mounted = false;
      sub?.remove();
    };
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <SeigaihaLayer />
      {reduceMotion ? null : <PetalsLayer />}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Seigaiha layer
// ---------------------------------------------------------------------------

/**
 * 青海波 wave pattern tiled across the viewport at ~7% opacity. Burgundy
 * ink on cream — feels like a faint washi paper texture rather than a
 * decoration competing for attention.
 */
function SeigaihaLayer() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg
        width={SCREEN_WIDTH}
        height={SCREEN_HEIGHT}
        opacity={0.07}
      >
        <Defs>
          <Pattern
            id="seigaiha"
            width={80}
            height={40}
            patternUnits="userSpaceOnUse"
          >
            <G
              fill="none"
              stroke={SAKURA_BURGUNDY}
              strokeWidth={0.6}
              opacity={0.5}
            >
              {/* Outer arcs */}
              <Path d="M 0 40 A 20 20 0 0 1 40 40" />
              <Path d="M 40 40 A 20 20 0 0 1 80 40" />
              <Path d="M -20 20 A 20 20 0 0 1 20 20" />
              <Path d="M 20 20 A 20 20 0 0 1 60 20" />
              <Path d="M 60 20 A 20 20 0 0 1 100 20" />
              {/* Inner arcs — give the pattern depth */}
              <Path d="M 0 40 A 12 12 0 0 1 24 40" opacity={0.6} />
              <Path d="M 40 40 A 12 12 0 0 1 64 40" opacity={0.6} />
              <Path d="M -20 20 A 12 12 0 0 1 4 20" opacity={0.6} />
              <Path d="M 20 20 A 12 12 0 0 1 44 20" opacity={0.6} />
              <Path d="M 60 20 A 12 12 0 0 1 84 20" opacity={0.6} />
            </G>
          </Pattern>
        </Defs>
        <Rect
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          fill="url(#seigaiha)"
        />
      </Svg>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Petals layer
// ---------------------------------------------------------------------------

function PetalsLayer() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {PETALS.map((spec, i) => (
        <Petal key={i} {...spec} />
      ))}
    </View>
  );
}

/**
 * Single falling petal. progress (0→1) drives translateY across the full
 * screen height + size buffer, translateX across the drift, rotation,
 * and a fade-in/hold/fade-out opacity curve.
 *
 * Each petal loops indefinitely; the staggered `delay` props keep the
 * eight petals out of phase so the fall feels natural rather than
 * synchronized.
 */
function Petal({
  leftPct,
  size,
  duration,
  delay,
  opacity,
  drift,
  rotation,
}: PetalSpec) {
  const progress = useSharedValue(0);
  const fallDistance = SCREEN_HEIGHT + size * 2;
  const startY = -size;
  const left = useMemo(() => SCREEN_WIDTH * leftPct, [leftPct]);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, {
          duration,
          // ease-in: slow at the top, faster as petals "fall" — feels
          // like a real petal accelerating under gravity then meeting
          // air resistance.
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
    const translateY = startY + p * fallDistance;
    const translateX = p * drift;
    const rotate = p * rotation;
    // Fade in over the first 5%, hold at `opacity`, fade out over the
    // last 10%. Keeps petals from popping into existence mid-fall.
    let alpha = opacity;
    if (p < 0.05) {
      alpha = opacity * (p / 0.05);
    } else if (p > 0.9) {
      alpha = opacity * (1 - (p - 0.9) / 0.1);
    }
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
          left,
          top: 0,
          width: size,
          height: size,
        },
        animatedStyle,
      ]}
    >
      <PetalSvg size={size} />
    </Animated.View>
  );
}

/**
 * Cherry blossom petal — wider at the bottom, notched at the top.
 * Three-layer SVG:
 *   1. Outer petal shape — soft pink fill with subtle deeper-rose stroke
 *   2. Inner cream highlight — gives the petal dimensionality
 *   3. Center vein — a single hairline down the spine
 */
function PetalSvg({ size }: { size: number }) {
  return (
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
  );
}
