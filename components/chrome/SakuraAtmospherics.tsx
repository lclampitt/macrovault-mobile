import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Defs, G, Path, Pattern, Rect } from 'react-native-svg';
import { SAKURA_BURGUNDY } from '../../lib/tokens';

// --------------------------------------------------------------------------
// SakuraAtmospherics — global decoration for the Sakura theme
//
// Scoped back from the original "seigaiha + global falling petals" design
// to ONLY the seigaiha (青海波) wave pattern. Global petals introduced too
// many edge cases (header band, fall-clipping, z-order vs. cards) — they
// are now exclusively a "hero" treatment inside `LogWorkoutCard`, which
// owns its own local petal field scoped to the card's bounds.
//
// What this layer renders
// -----------------------
//   1. Seigaiha (青海波) wave pattern — static SVG `<Pattern>` tiled across
//      the viewport at ~7% opacity. Reads as a faint washi paper texture
//      uniformly across the entire screen — header, card gaps, footer
//      area — wherever something opaque doesn't sit on top of it.
//
// Mount rules
// -----------
//   • Mounted ONCE in `_layout.tsx`, gated on `accent === 'rose'` (Sakura)
//     so Emerald users pay zero rendering cost.
//   • `position: absolute` + `pointerEvents="none"` so it never intercepts
//     taps and sits behind every screen's content.
//   • Sibling-of-stack ordering: rendered BEFORE the chrome + Stack in
//     `_layout.tsx` so cards (opaque `bgCard` surfaces) render ON TOP of
//     it. The pattern shows through transparent screens, transparent
//     headers, and the gaps between cards.
//
// Why explicit pixel dimensions
// -----------------------------
// react-native-svg's `<Svg width="100%" height="100%">` only fills the
// parent reliably when the parent has a layout-computed size. Inside an
// `absoluteFill` View (which has `position:absolute; top/left/right/
// bottom: 0` but no intrinsic width/height in the eyes of the SVG
// renderer), `100%` can fall back to a default size and tile only a
// fraction of the screen. The visible result was a denser pattern band
// at the top and sparse / missing pattern below it. Pinning the Svg to
// `Dimensions.get('window')` guarantees the pattern fills the entire
// viewport uniformly.
// --------------------------------------------------------------------------

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get('window');

export default function SakuraAtmospherics() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <SeigaihaLayer />
    </View>
  );
}

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
