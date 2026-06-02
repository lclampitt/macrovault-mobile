import { LinearGradient } from 'expo-linear-gradient';
import { useTokens } from '../../lib/theme-context';

type Props = {
  /** Pixel height of the overlay zone. Defaults to 280 — covers status bar
   *  + chrome header with room to spare; the actual gradient fades to
   *  transparent at ~60% of this so the bottom 40% is invisible. */
  height?: number;
};

/**
 * Ambient emerald glow at the very top of the screen. Vertical linear
 * fade — emerald at the top edge, transparent at ~60% down — so the
 * glow reads as a soft halo bleeding from above the status bar rather
 * than a tinted band painted across the entire header zone.
 *
 * History
 * -------
 * v1 used an SVG `<RadialGradient>` with `cx="50%" cy="0%"` and stops
 * `0%/35%/70%`. The 35% mid-stop kept the emerald visible across the
 * full header height — in light mode it read as a mint tint across the
 * cream MacroVault row, and in dark mode it brought back the subtle
 * green-on-black band the chrome was supposed to avoid.
 *
 * v2 (this) is a single linear top→bottom fade. Locations are clamped so
 * the gradient is fully transparent by the time we reach the day banner
 * underneath the header, regardless of header height. The base colors
 * come from `tokens.gradientPageGlowTop` so light mode is ~half the
 * intensity of dark.
 *
 * Always non-interactive (`pointerEvents="none"`). Rendered as the FIRST
 * child of the app shell's root View so document order paints it under
 * every subsequent sibling — no explicit zIndex needed (any zIndex here
 * would force the chrome / MoreSheet portal into the same stacking
 * context, which would hide them).
 */
export default function TopGradientGlow({ height = 280 }: Props) {
  const t = useTokens();
  const [stopTop, stopBottom] = t.gradientPageGlowTop;
  return (
    <LinearGradient
      pointerEvents="none"
      colors={[stopTop, stopBottom]}
      // Transparent stop pinned at 60% so the fade is done well above the
      // first card. The 60-100% region renders as fully transparent.
      locations={[0, 0.6]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height,
      }}
    />
  );
}
