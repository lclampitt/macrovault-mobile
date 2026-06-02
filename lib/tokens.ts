// MacroVault — Semantic Token System
// ---------------------------------------------------------------------------
// Single source of truth for color, shadow, and gradient tokens. Tokens are
// named by PURPOSE (`bgPage`, `textPrimary`, `primaryTintBg`), not by COLOR
// — the same key holds different values in dark vs light vs sakura. That's
// what makes mode switching trivial once a screen consumes `useTokens()`.
//
// Pattern in consumers
// --------------------
//   import { useTokens } from '../../lib/theme-context';
//   const t = useTokens();
//   <View style={[styles.card, { backgroundColor: t.bgCard }]}>...
//
// `useTokens()` re-renders the component whenever mode/theme changes, so
// the tokens object swap is enough to flip the UI — no manual subscribe.
//
// What stays the same in every mode
// ---------------------------------
// • Emerald brand (`primary`) — `#10B981`. Reads strongly on both black AND
//   cream backgrounds, so we don't shift it.
// • Macros (protein/carbs/fat) — semantic meaning, not aesthetic.
// • Special-purpose status colors (edit / destructive / warning).
// • `textOnPrimary` — always near-black (sits on emerald).
//
// What changes between dark and light
// -----------------------------------
// • Page + card backgrounds (black ↔ warm cream / white)
// • Border tones (near-black ↔ warm tan)
// • Text greys (white-down-to-quaternary ↔ wine-dark-down-to-tan)
// • Emerald-tinted overlays: same hue, alpha lifted in light so the tint
//   reads against cream.
// • Shadows: heavy black drops ↔ soft brown-tinted drops.
// • Status bar style.

import type { ViewStyle } from 'react-native';

// ---------------------------------------------------------------------------
// Identifiers
// ---------------------------------------------------------------------------

/** Render mode within a theme that supports it. Sakura is always light. */
export type Mode = 'dark' | 'light';

/** Top-level appearance theme. Emerald has dark + light; Sakura is light-only. */
export type AppearanceTheme = 'emerald' | 'sakura';

// ---------------------------------------------------------------------------
// Token shape
// ---------------------------------------------------------------------------

export type Tokens = Readonly<{
  // --- Backgrounds ---
  bgPage: string;
  bgCard: string;
  bgCardElevated: string;
  bgInput: string;
  bgOverlay: string;
  bgSkeleton: string;
  bgSkeletonShimmer: string;
  /** Empty / "no data" track behind progress bars + week cells. */
  bgTrack: string;

  // --- Borders ---
  borderDefault: string;
  borderSubtle: string;
  borderStrong: string;

  // --- Text ---
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textQuaternary: string;
  textOnPrimary: string;

  // --- Brand ---
  primary: string;
  primaryGradientStart: string;
  primaryGradientEnd: string;
  primaryTintBg: string;
  primaryTintBorder: string;
  primaryBorderStrong: string;
  primaryGlow: string;

  // --- Macros (stable across modes) ---
  macroProtein: string;
  macroCarbs: string;
  macroFat: string;

  // --- Special-purpose (stable across modes) ---
  edit: string;
  destructive: string;
  warning: string;

  // --- Charts ---
  chartGrid: string;
  chartAxisLabel: string;
  chartFillStart: string;
  chartFillEnd: string;
  activityEmpty: string;

  // --- Shadows (RN style objects, not CSS strings) ---
  shadowCard: ViewStyle;
  shadowElevated: ViewStyle;
  shadowPrimaryGlow: ViewStyle;

  // --- Gradient palettes ---
  gradientCardTinted: readonly [string, string];
  /** Vertical emerald-to-transparent fade for the top-of-screen ambient
   *  glow. Single linear fade (was a 3-stop radial that painted the whole
   *  header zone with a visible mint tint). */
  gradientPageGlowTop: readonly [string, string];
  gradientBottomNavFade: readonly [string, string];

  // --- iOS chrome ---
  statusBarStyle: 'light' | 'dark';
}>;

// ---------------------------------------------------------------------------
// Mode-stable values
// ---------------------------------------------------------------------------

const STABLE = {
  textOnPrimary: '#000',
  macroProtein: '#10B981',
  macroCarbs: '#6EE7B7',
  macroFat: '#34D399',
  edit: '#F59F00',
  destructive: '#E5736A',
  warning: '#A87C5E',
} as const;

// ---------------------------------------------------------------------------
// DARK (Emerald · Dark) — matches the existing static `DS` palette exactly
// ---------------------------------------------------------------------------

const darkTokens: Tokens = Object.freeze({
  bgPage: '#000',
  bgCard: '#0A0A0A',
  bgCardElevated: '#0F0F0F',
  bgInput: '#0F0F0F',
  bgOverlay: 'rgba(0, 0, 0, 0.4)',
  bgSkeleton: '#1A1A1A',
  bgSkeletonShimmer: 'rgba(255, 255, 255, 0.04)',
  bgTrack: '#1A1A1A',

  borderDefault: '#1A1A1A',
  borderSubtle: '#141414',
  borderStrong: '#2A2A2A',

  textPrimary: '#FFFFFF',
  textSecondary: '#999999',
  textTertiary: '#666666',
  textQuaternary: '#444444',
  textOnPrimary: STABLE.textOnPrimary,

  primary: '#10B981',
  primaryGradientStart: '#10B981',
  primaryGradientEnd: '#059669',
  primaryTintBg: 'rgba(16, 185, 129, 0.12)',
  primaryTintBorder: 'rgba(16, 185, 129, 0.18)',
  primaryBorderStrong: 'rgba(16, 185, 129, 0.3)',
  primaryGlow: 'rgba(16, 185, 129, 0.4)',

  macroProtein: STABLE.macroProtein,
  macroCarbs: STABLE.macroCarbs,
  macroFat: STABLE.macroFat,
  edit: STABLE.edit,
  destructive: STABLE.destructive,
  warning: STABLE.warning,

  chartGrid: 'rgba(255, 255, 255, 0.05)',
  chartAxisLabel: '#666666',
  chartFillStart: 'rgba(16, 185, 129, 0.24)',
  chartFillEnd: 'rgba(16, 185, 129, 0)',
  activityEmpty: 'rgba(255, 255, 255, 0.06)',

  shadowCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  shadowElevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 60,
    elevation: 16,
  },
  shadowPrimaryGlow: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },

  gradientCardTinted: ['rgba(16, 185, 129, 0.06)', 'rgba(16, 185, 129, 0.02)'] as const,
  gradientPageGlowTop: [
    'rgba(16, 185, 129, 0.10)',
    'rgba(16, 185, 129, 0)',
  ] as const,
  gradientBottomNavFade: ['rgba(0, 0, 0, 0)', '#000'] as const,

  statusBarStyle: 'light',
});

// ---------------------------------------------------------------------------
// LIGHT (Emerald · Light) — warm cream per the validated mockup
// ---------------------------------------------------------------------------

const lightTokens: Tokens = Object.freeze({
  bgPage: '#FAF7F2',
  bgCard: '#FFFFFF',
  bgCardElevated: '#FFFFFF',
  bgInput: '#FFFFFF',
  bgOverlay: 'rgba(26, 23, 20, 0.3)',
  bgSkeleton: '#EFEAE1',
  bgSkeletonShimmer: 'rgba(255, 255, 255, 0.6)',
  bgTrack: '#EAE4D8',

  borderDefault: '#EFEAE1',
  borderSubtle: '#F5F1E8',
  borderStrong: '#DDD5C5',

  textPrimary: '#1A1714',
  textSecondary: '#6B6359',
  textTertiary: '#9B9389',
  textQuaternary: '#C4B9A8',
  textOnPrimary: STABLE.textOnPrimary,

  primary: '#10B981',
  primaryGradientStart: '#10B981',
  primaryGradientEnd: '#059669',
  primaryTintBg: 'rgba(16, 185, 129, 0.08)',
  primaryTintBorder: 'rgba(16, 185, 129, 0.28)',
  primaryBorderStrong: 'rgba(16, 185, 129, 0.45)',
  primaryGlow: 'rgba(16, 185, 129, 0.35)',

  macroProtein: STABLE.macroProtein,
  macroCarbs: STABLE.macroCarbs,
  macroFat: STABLE.macroFat,
  edit: STABLE.edit,
  destructive: STABLE.destructive,
  warning: STABLE.warning,

  chartGrid: 'rgba(26, 23, 20, 0.06)',
  chartAxisLabel: '#9B9389',
  chartFillStart: 'rgba(16, 185, 129, 0.16)',
  chartFillEnd: 'rgba(16, 185, 129, 0)',
  activityEmpty: '#E5DED1',

  shadowCard: {
    shadowColor: '#4C4031',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  shadowElevated: {
    shadowColor: '#4C4031',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18,
    shadowRadius: 60,
    elevation: 12,
  },
  shadowPrimaryGlow: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },

  gradientCardTinted: ['rgba(16, 185, 129, 0.07)', 'rgba(16, 185, 129, 0.02)'] as const,
  // Top page glow ~50% intensity vs dark — emerald-on-cream is noisier.
  gradientPageGlowTop: [
    'rgba(16, 185, 129, 0.05)',
    'rgba(16, 185, 129, 0)',
  ] as const,
  gradientBottomNavFade: ['rgba(250, 247, 242, 0)', '#FAF7F2'] as const,

  statusBarStyle: 'dark',
});

// ---------------------------------------------------------------------------
// SAKURA (light-only, rose-cream) — separate aesthetic, NOT light-emerald
// ---------------------------------------------------------------------------

// Saturation-bumped rose family — the previous values (#C66E89 etc.)
// read as muted dusty rose on physical devices. The new values keep the
// hue in cherry-blossom territory but with the chroma needed to feel
// like a brand color rather than a wash.
const SAKURA_PRIMARY = '#D85A85';
const SAKURA_GRADIENT_START = '#F08AAC';
const SAKURA_GRADIENT_END = '#C2436F';

// Burgundy used for the seigaiha pattern + kanji column + warm card shadows.
// Exported because the SakuraAtmospherics component renders directly with
// these colors (it's a static decoration, not a theme-token consumer).
export const SAKURA_BURGUNDY = '#7B2D4B';

const sakuraTokens: Tokens = Object.freeze({
  bgPage: '#FAF3F0',
  bgCard: '#FFFFFF',
  bgCardElevated: '#FFFFFF',
  bgInput: '#FFFFFF',
  bgOverlay: 'rgba(42, 31, 38, 0.30)',
  bgSkeleton: '#F0E5E0',
  bgSkeletonShimmer: 'rgba(255, 255, 255, 0.6)',
  bgTrack: '#EADDD7',

  borderDefault: '#F0E5E0',
  borderSubtle: '#F7EDE8',
  borderStrong: '#E0D0CB',

  // Warm dark plum scale per spec — tightened from the previous values so
  // captions and microtype don't disappear on white cards.
  textPrimary: '#2A1F26',
  textSecondary: '#6B5862',
  textTertiary: '#9B8B95',
  textQuaternary: '#B8A8B2',
  // WHITE on rose CTAs (not black like Emerald). Critical contrast tweak —
  // black on rose looks muddy; white reads as confident polish.
  textOnPrimary: '#FFFFFF',

  primary: SAKURA_PRIMARY,
  primaryGradientStart: SAKURA_GRADIENT_START,
  primaryGradientEnd: SAKURA_GRADIENT_END,
  primaryTintBg: 'rgba(216, 90, 133, 0.06)',
  primaryTintBorder: 'rgba(216, 90, 133, 0.30)',
  primaryBorderStrong: 'rgba(216, 90, 133, 0.45)',
  primaryGlow: 'rgba(216, 90, 133, 0.32)',

  // Macros shift to the rose family for theme cohesion (the spec calls
  // for this explicitly — keeps the semantic ordering protein/carbs/fat
  // via shape + position, but the palette stays warm rose). Rebalanced
  // to the saturation-bumped family so protein matches the new primary.
  macroProtein: '#D85A85', // primary rose (matches new primary)
  macroCarbs: '#F08AAC', // lighter rose
  macroFat: '#E47094', // mid rose

  // Special-purpose colors shift to feel cohesive with the rose palette.
  edit: '#B8772E', // burnt orange (replaces bright amber)
  destructive: '#C5564E', // deeper coral
  warning: '#8A6342', // muted tan

  chartGrid: 'rgba(42, 31, 38, 0.07)',
  chartAxisLabel: '#9B8B95',
  chartFillStart: 'rgba(216, 90, 133, 0.27)',
  chartFillEnd: 'rgba(216, 90, 133, 0.02)',
  activityEmpty: '#EADDD7',

  // Burgundy-tinted soft shadows — feel like ink-on-washi rather than
  // the cool brown drop we use in the warm-cream Light mode.
  shadowCard: {
    shadowColor: SAKURA_BURGUNDY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  shadowElevated: {
    shadowColor: SAKURA_BURGUNDY,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18,
    shadowRadius: 60,
    elevation: 12,
  },
  shadowPrimaryGlow: {
    // SAKURA_PRIMARY is now the saturation-bumped value (#D85A85), so
    // this glow tracks the new family automatically.
    shadowColor: SAKURA_PRIMARY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 24,
    elevation: 8,
  },

  gradientCardTinted: ['rgba(216, 90, 133, 0.08)', 'rgba(216, 90, 133, 0.03)'] as const,
  // Top page glow uses the LIGHTER rose (the saturation-bumped lighter
  // shade #F08AAC → 240, 138, 172). Deeper rose tones look muddy at low
  // opacity over cream — the lighter family keeps the halo readable.
  gradientPageGlowTop: [
    'rgba(240, 138, 172, 0.20)',
    'rgba(240, 138, 172, 0)',
  ] as const,
  gradientBottomNavFade: ['rgba(250, 243, 240, 0)', '#FAF3F0'] as const,

  statusBarStyle: 'dark',
});

// ---------------------------------------------------------------------------
// Factory + default
// ---------------------------------------------------------------------------

export function tokensFor(mode: Mode, theme: AppearanceTheme = 'emerald'): Tokens {
  if (theme === 'sakura') return sakuraTokens;
  return mode === 'light' ? lightTokens : darkTokens;
}

/** Fallback used when no ThemeProvider is mounted (storybook / unit tests). */
export const DEFAULT_TOKENS: Tokens = darkTokens;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a 6- or 3-digit hex color to an `rgba(...)` string with the
 * supplied alpha (0–1).
 *
 *   alphaize('#10B981', 0.8)  →  'rgba(16, 185, 129, 0.8)'
 *   alphaize('#D85A85', 0.25) →  'rgba(216, 90, 133, 0.25)'
 *
 * Used to derive alpha-varied tints from `tokens.primary` so emerald and
 * sakura share the same bar/heatmap-cell tones without each consumer
 * carrying parallel hardcoded rgba strings.
 *
 * Passes through anything that doesn't look like a 6/3-digit hex (e.g.
 * an existing `rgba(...)` string) — the input is returned unchanged.
 */
export function alphaize(hex: string, alpha: number): string {
  if (!hex.startsWith('#')) return hex;
  const body = hex.slice(1);
  const expanded =
    body.length === 3
      ? body
          .split('')
          .map((c) => c + c)
          .join('')
      : body;
  if (expanded.length !== 6) return hex;
  const r = parseInt(expanded.slice(0, 2), 16);
  const g = parseInt(expanded.slice(2, 4), 16);
  const b = parseInt(expanded.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
