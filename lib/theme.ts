// Runtime theming. `buildTheme(mode, accent)` returns a palette with the
// SAME keys as constants/Colors.ts so migrating a screen is a near drop-in:
//   import { Colors } from '../constants/Colors'  ->  const c = useTheme()
//   Colors.accent                                  ->  c.accent

export type ThemeMode = 'dark' | 'light';

export type AccentId =
  | 'teal'
  | 'blue'
  | 'orange'
  | 'rose'
  | 'violet'
  | 'crimson'
  | 'spectrum'
  | 'xp-aqua'
  | 'myspace'
  | 'y2k-chrome';

export type AccentMeta = {
  id: AccentId;
  label: string;
  color: string; // solid swatch / accent base
  retro: boolean; // retro accents are dark-mode only
};

// Order + values match Sidebar.jsx QUICK_THEMES (what appearance.png shows).
export const ACCENTS: AccentMeta[] = [
  { id: 'teal', label: 'Teal', color: '#1D9E75', retro: false },
  { id: 'blue', label: 'Blue', color: '#3B82F6', retro: false },
  { id: 'orange', label: 'Orange', color: '#F97316', retro: false },
  { id: 'rose', label: 'Rose', color: '#F43F5E', retro: false },
  { id: 'violet', label: 'Violet', color: '#8B5CF6', retro: false },
  { id: 'crimson', label: 'Crimson', color: '#DC2626', retro: false },
  { id: 'spectrum', label: 'Spectrum', color: '#7C3AED', retro: false },
  { id: 'xp-aqua', label: 'XP Aqua', color: '#00BFFF', retro: true },
  { id: 'myspace', label: 'MySpace', color: '#FF00FF', retro: true },
  { id: 'y2k-chrome', label: 'Y2K Chrome', color: '#FFD700', retro: true },
];

export function isRetroAccent(id: AccentId): boolean {
  return ACCENTS.find((a) => a.id === id)?.retro ?? false;
}

export function accentColor(id: AccentId): string {
  return ACCENTS.find((a) => a.id === id)?.color ?? '#1D9E75';
}

/* ── color math ─────────────────────────────────────────────── */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const v =
    h.length === 3
      ? h
          .split('')
          .map((x) => x + x)
          .join('')
      : h;
  return [
    parseInt(v.slice(0, 2), 16),
    parseInt(v.slice(2, 4), 16),
    parseInt(v.slice(4, 6), 16),
  ];
}

function mix(hex: string, withHex: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(hex);
  const [r2, g2, b2] = hexToRgb(withHex);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${[r, g, b]
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('')}`;
}

function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/* ── fixed (non-accent) macro/activity colors ───────────────── */
const FIXED = {
  proteinColor: '#A78BFA',
  fatColor: '#FCA130',
  favoriteStar: '#FCA130',
  cardioIcon: '#A78BFA',
  cardioIconBg: 'rgba(167, 139, 250, 0.15)',
  activityWorkout: '#A78BFA',
  activityBoth: '#FCA130',
  activityWorkoutBg: 'rgba(167, 139, 250, 0.18)',
  activityWorkoutBorder: 'rgba(167, 139, 250, 0.35)',
  activityWorkoutTint: 'rgba(167, 139, 250, 0.4)',
  activityBothBg: 'rgba(252, 161, 48, 0.18)',
  activityBothBorder: 'rgba(252, 161, 48, 0.35)',
  activityBothTint: 'rgba(252, 161, 48, 0.4)',
  activityTodayBorder: 'rgba(252, 161, 48, 0.7)',
  error: '#EF4444',
  errorBg: 'rgba(239, 68, 68, 0.08)',
  errorBorder: 'rgba(239, 68, 68, 0.2)',
};

function baseTokens(mode: ThemeMode) {
  if (mode === 'light') {
    return {
      background: '#FAFAF7',
      surface: '#F5F5F0',
      surfaceMuted: '#FFFFFF',
      textPrimary: '#1A1A18',
      textSecondary: '#5A5A52',
      textMuted: '#8A8A80',
      textHint: '#A8A89E',
      border: 'rgba(0, 0, 0, 0.08)',
      borderSubtle: 'rgba(0, 0, 0, 0.05)',
      trackMuted: 'rgba(0, 0, 0, 0.06)',
      overlay: 'rgba(0, 0, 0, 0.4)',
      chartGrid: 'rgba(0, 0, 0, 0.07)',
      chartAxisLabel: '#8A8A80',
      activityEmpty: 'rgba(0, 0, 0, 0.06)',
      monthCellBg: 'rgba(0, 0, 0, 0.03)',
      // The floating nav stays dark glass in both modes (matches web).
      navSurface: 'rgba(20, 23, 30, 0.94)',
    };
  }
  return {
    background: '#0f1117',
    surface: '#14171E',
    surfaceMuted: '#1E2536',
    textPrimary: '#F4F5F7',
    textSecondary: '#9AA0A6',
    textMuted: '#6B7280',
    textHint: '#4B5563',
    border: 'rgba(255, 255, 255, 0.06)',
    borderSubtle: 'rgba(255, 255, 255, 0.04)',
    trackMuted: 'rgba(255, 255, 255, 0.05)',
    overlay: 'rgba(0, 0, 0, 0.6)',
    chartGrid: 'rgba(255, 255, 255, 0.06)',
    chartAxisLabel: '#6B7280',
    activityEmpty: 'rgba(255, 255, 255, 0.06)',
    monthCellBg: 'rgba(255, 255, 255, 0.03)',
    navSurface: '#14171E',
  };
}

export type Theme = ReturnType<typeof buildTheme>;

export function buildTheme(mode: ThemeMode, accentId: AccentId) {
  const base = baseTokens(mode);

  // Teal keeps the hand-tuned originals so the default look never regresses.
  const accent = accentColor(accentId);
  const accentLight =
    accentId === 'teal' ? '#5DCAA5' : mix(accent, '#FFFFFF', 0.4);
  const accentDark =
    accentId === 'teal' ? '#0F6E56' : mix(accent, '#000000', 0.32);

  const accentSoft = rgba(accent, 0.14);
  const accentSofter = rgba(accent, 0.08);
  const borderAccent = rgba(accent, 0.5);
  const borderAccentSoft = rgba(accent, 0.3);

  return {
    ...base,
    accent,
    accentLight,
    accentDark,
    accentSoft,
    accentSofter,
    borderAccent,
    borderAccentSoft,

    // Macro: protein/fat fixed; carbs follows the accent (web parity).
    proteinColor: FIXED.proteinColor,
    carbsColor: accentLight,
    fatColor: FIXED.fatColor,

    // Activity: workout/both fixed; meals follows the accent.
    activityWorkout: FIXED.activityWorkout,
    activityMeals: accentLight,
    activityBoth: FIXED.activityBoth,
    activityWorkoutBg: FIXED.activityWorkoutBg,
    activityWorkoutBorder: FIXED.activityWorkoutBorder,
    activityWorkoutTint: FIXED.activityWorkoutTint,
    activityMealsBg: rgba(accent, 0.18),
    activityMealsBorder: rgba(accent, 0.35),
    activityMealsTint: rgba(accent, 0.4),
    activityBothBg: FIXED.activityBothBg,
    activityBothBorder: FIXED.activityBothBorder,
    activityBothTint: FIXED.activityBothTint,
    activityTodayBorder: FIXED.activityTodayBorder,

    // Chart lines track the accent.
    chartWeightLine: accent,
    chartBodyFatLine: accentLight,

    favoriteStar: FIXED.favoriteStar,
    cardioIcon: FIXED.cardioIcon,
    cardioIconBg: FIXED.cardioIconBg,

    error: FIXED.error,
    errorBg: FIXED.errorBg,
    errorBorder: FIXED.errorBorder,
  };
}

/** Default palette = Teal / Dark (matches constants/Colors.ts). */
export const DEFAULT_THEME = buildTheme('dark', 'teal');
