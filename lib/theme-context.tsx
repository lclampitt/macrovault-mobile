import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { useAuth } from './auth-context';
import {
  buildTheme,
  isRetroAccent,
  type AccentId,
  type Theme,
  type ThemeMode,
} from './theme';
import {
  DEFAULT_TOKENS,
  tokensFor,
  type AppearanceTheme,
  type Tokens,
} from './tokens';

const MODE_KEY = 'macrovault-theme-mode';
const ACCENT_KEY = 'macrovault-theme-accent';

/**
 * Map the legacy accent id to the new high-level Appearance theme used by
 * the semantic token system. Sakura is its own palette; everything else
 * (teal, blue, orange, violet, retros) falls under Emerald for tokens.
 *
 * The legacy `Theme` from buildTheme still honors every individual accent
 * — only the new token system collapses them to two aesthetics.
 */
function appearanceThemeFor(accent: AccentId): AppearanceTheme {
  return accent === 'rose' ? 'sakura' : 'emerald';
}

/** Free tier: Teal only (Dark or Light). Everything else is Pro. */
function canUseAccent(accent: AccentId, isPro: boolean): boolean {
  return accent === 'teal' || isPro;
}
/** Retro accents have no light mode. */
function canUseLight(accent: AccentId): boolean {
  return !isRetroAccent(accent);
}

type ThemeContextValue = {
  // Legacy `Colors`-style palette — kept stable so the ~85 files still
  // consuming `useTheme().theme` (auth flows, settings sub-pages, etc.)
  // keep working without changes.
  theme: Theme;
  mode: ThemeMode;
  accent: AccentId;
  isPro: boolean;
  setMode: (m: ThemeMode) => void;
  setAccent: (a: AccentId) => void;
  /** True when this accent requires Pro and the user isn't Pro. */
  isAccentLocked: (a: AccentId) => boolean;
  accentSupportsLight: (a: AccentId) => boolean;

  // New semantic-token surface — components opt in via `useTokens()`.
  appearanceTheme: AppearanceTheme;
  tokens: Tokens;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [accent, setAccentState] = useState<AccentId>('teal');
  const [isPro, setIsPro] = useState(false);

  // 1) Instant local restore.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [m, a] = await Promise.all([
          AsyncStorage.getItem(MODE_KEY),
          AsyncStorage.getItem(ACCENT_KEY),
        ]);
        if (cancelled) return;
        if (m === 'dark' || m === 'light') setModeState(m);
        if (a) setAccentState(a as AccentId);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) Server source of truth (tier + saved theme) once signed in.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('subscription_tier, theme_mode, accent_theme')
          .eq('id', user.id)
          .maybeSingle();
        if (cancelled || !data) return;
        const tier = (data.subscription_tier as string) || 'free';
        const pro = tier === 'pro' || tier === 'pro_plus';
        setIsPro(pro);

        let nextAccent = (data.accent_theme as AccentId) || accent;
        let nextMode = (data.theme_mode as ThemeMode) || mode;
        if (!canUseAccent(nextAccent, pro)) nextAccent = 'teal';
        if (nextMode === 'light' && !canUseLight(nextAccent)) nextMode = 'dark';
        setAccentState(nextAccent);
        setModeState(nextMode);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const persist = useCallback(
    async (nextMode: ThemeMode, nextAccent: AccentId) => {
      try {
        await AsyncStorage.multiSet([
          [MODE_KEY, nextMode],
          [ACCENT_KEY, nextAccent],
        ]);
      } catch {
        /* ignore */
      }
      if (!user) return;
      // theme_mode + accent_theme are client-writable (lockdown allow-list).
      try {
        await supabase
          .from('profiles')
          .update({ theme_mode: nextMode, accent_theme: nextAccent })
          .eq('id', user.id);
      } catch {
        /* ignore */
      }
    },
    [user],
  );

  const setAccent = useCallback(
    (a: AccentId) => {
      if (!canUseAccent(a, isPro)) return; // gated; caller shows upsell
      // Mode resolution rules:
      //   • Sakura (rose) is LIGHT-ONLY → snap to 'light' regardless of
      //     prior mode. Spec: "ThemeProvider correctly enforces mode:
      //     'light' when accent is 'sakura'".
      //   • Retro accents (xp-aqua, myspace, y2k-chrome) are DARK-ONLY →
      //     snap to 'dark' if we were in light.
      //   • Otherwise preserve the current mode.
      let nextMode = mode;
      if (a === 'rose') {
        nextMode = 'light';
      } else if (!canUseLight(a) && mode === 'light') {
        nextMode = 'dark';
      }
      setAccentState(a);
      setModeState(nextMode);
      void persist(nextMode, a);
    },
    [isPro, mode, persist],
  );

  const setMode = useCallback(
    (m: ThemeMode) => {
      // Sakura (rose) is light-only — block any attempt to flip its mode
      // to dark. The AppearanceSheet already prevents this UI-side via
      // the disabled-Dark pill, but other callers (deep links, hot reload
      // restore, etc.) need the guard too.
      if (accent === 'rose' && m === 'dark') return;
      if (m === 'light' && !canUseLight(accent)) return;
      setModeState(m);
      void persist(m, accent);
    },
    [accent, persist],
  );

  const theme = useMemo(() => buildTheme(mode, accent), [mode, accent]);
  const appearanceTheme = useMemo(
    () => appearanceThemeFor(accent),
    [accent],
  );
  const tokens = useMemo(
    () => tokensFor(mode, appearanceTheme),
    [mode, appearanceTheme],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      mode,
      accent,
      isPro,
      setMode,
      setAccent,
      isAccentLocked: (a: AccentId) => !canUseAccent(a, isPro),
      accentSupportsLight: (a: AccentId) => canUseLight(a),
      appearanceTheme,
      tokens,
    }),
    [theme, mode, accent, isPro, setMode, setAccent, appearanceTheme, tokens],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

/**
 * Returns the active semantic-token palette. Re-renders the calling
 * component whenever mode or appearance theme changes.
 *
 *   const t = useTokens();
 *   <View style={[styles.card, { backgroundColor: t.bgCard }]}>
 *
 * Falls back to dark-mode tokens if no ThemeProvider is mounted.
 */
export function useTokens(): Tokens {
  const ctx = useContext(ThemeContext);
  return ctx?.tokens ?? DEFAULT_TOKENS;
}
