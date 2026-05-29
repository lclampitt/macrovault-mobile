// MacroVault Design System v2 — emerald-on-black, "gym-coded industrial".
//
// This module is the single source of truth for the new design language.
// Existing screens that haven't been migrated yet still use the legacy
// teal palette in `constants/Colors.ts`. New work imports from here.

import { Platform, type TextStyle } from 'react-native';

// --------------------------------------------------------------------------
// Color tokens
// --------------------------------------------------------------------------
export const DS = {
  // Canvas
  bg: '#000',

  // Cards
  surface: '#0A0A0A',
  surfaceFlat: '#0F0F0F', // slightly lighter for inactive cells (e.g. week strip)
  border: '#1A1A1A',
  divider: '#141414',

  // Emerald scale
  accent: '#10B981',
  accentLight: '#6EE7B7', // carb readout
  accentMid: '#34D399', // fat readout
  accentSoft: 'rgba(16, 185, 129, 0.12)',
  accentSofter: 'rgba(16, 185, 129, 0.06)',
  accentBorder: 'rgba(16, 185, 129, 0.18)',
  accentBorderStrong: 'rgba(16, 185, 129, 0.3)',
  accentBracket: 'rgba(16, 185, 129, 0.4)',
  accentGlow: 'rgba(16, 185, 129, 0.5)',
  accentGlowOuter: 'rgba(16, 185, 129, 0.4)',

  // Text scale
  text: '#FFFFFF',
  textSecondary: '#999999',
  textTertiary: '#666666',
  textQuaternary: '#444444',
  textDimmest: '#333333',

  // Status (only the emerald or warmer; never red/blue per spec)
  trendUp: '#10B981',
  trendDown: '#10B981', // intentional — spec forbids red trends
} as const;

// --------------------------------------------------------------------------
// Radii (rounded-2xl / rounded-xl / rounded-md from spec)
// --------------------------------------------------------------------------
export const Radius = {
  card: 16, // major cards
  cardCompact: 12, // compact cards & buttons
  pill: 6, // exercise chips
  badge: 4, // emerald status badges
  full: 999,
} as const;

// --------------------------------------------------------------------------
// Spacing
// --------------------------------------------------------------------------
export const Spacing = {
  page: 20, // horizontal page padding (px-5)
  cardLg: 20, // hero cards (p-5)
  card: 16, // standard cards (p-4)
  cardSm: 12, // compact cards (p-3)
  stack: 12, // mb-3 between cards
} as const;

// --------------------------------------------------------------------------
// Inter typography — pairs with @expo-google-fonts/inter loaded in _layout.
// --------------------------------------------------------------------------
export const Font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

/** Reusable tabular-numerics modifier — use on every number that columns. */
export const Tabular: TextStyle = { fontVariant: ['tabular-nums'] };

// Common type stacks. Use these instead of inlining font/size/weight.
export const Type = {
  wordmark: {
    fontFamily: Font.bold,
    fontSize: 22,
    letterSpacing: -0.5, // tracking-tight equivalent
    color: DS.text,
  } as TextStyle,
  heroNumber: (size = 52): TextStyle => ({
    fontFamily: Font.bold,
    fontSize: size,
    letterSpacing: size * -0.03,
    color: DS.text,
    ...Tabular,
  }),
  heroNumberSmall: (size = 28): TextStyle => ({
    fontFamily: Font.bold,
    fontSize: size,
    letterSpacing: size * -0.025,
    color: DS.text,
    ...Tabular,
  }),
  sectionLabel: {
    fontFamily: Font.semibold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: DS.textTertiary,
  } as TextStyle,
  sectionLabelEmerald: {
    fontFamily: Font.bold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: DS.accent,
  } as TextStyle,
  cardTitle: {
    fontFamily: Font.bold,
    fontSize: 26,
    letterSpacing: -0.5,
    color: DS.text,
  } as TextStyle,
  listTitle: {
    fontFamily: Font.semibold,
    fontSize: 13,
    color: DS.text,
  } as TextStyle,
  body: {
    fontFamily: Font.medium,
    fontSize: 13,
    color: DS.text,
  } as TextStyle,
  bodySmall: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.textSecondary,
  } as TextStyle,
  meta: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DS.textTertiary,
  } as TextStyle,
} as const;

// --------------------------------------------------------------------------
// Shadows / glows
// --------------------------------------------------------------------------
export const Shadow = {
  /** Emerald CTA glow: 1px ring + 32px outer haze. iOS only; Android uses elevation. */
  emeraldGlow:
    Platform.OS === 'ios'
      ? {
          shadowColor: DS.accent,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
        }
      : { elevation: 8 },
  /** Lighter glow for ring strokes etc. */
  emeraldHalo:
    Platform.OS === 'ios'
      ? {
          shadowColor: DS.accent,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 8,
        }
      : { elevation: 4 },
} as const;

// --------------------------------------------------------------------------
// Motion presets (used by Reanimated entering animations)
// --------------------------------------------------------------------------
export const Motion = {
  // cubic-bezier(0.16, 1, 0.3, 1) — the spec's standard easing
  durationRise: 500,
  staggerStep: 60,
  durationProgress: 1100,
  progressDelay: 300,
} as const;
