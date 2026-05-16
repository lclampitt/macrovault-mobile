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

const MODE_KEY = 'macrovault-theme-mode';
const ACCENT_KEY = 'macrovault-theme-accent';

/** Free tier: Teal only (Dark or Light). Everything else is Pro. */
function canUseAccent(accent: AccentId, isPro: boolean): boolean {
  return accent === 'teal' || isPro;
}
/** Retro accents have no light mode. */
function canUseLight(accent: AccentId): boolean {
  return !isRetroAccent(accent);
}

type ThemeContextValue = {
  theme: Theme;
  mode: ThemeMode;
  accent: AccentId;
  isPro: boolean;
  setMode: (m: ThemeMode) => void;
  setAccent: (a: AccentId) => void;
  /** True when this accent requires Pro and the user isn't Pro. */
  isAccentLocked: (a: AccentId) => boolean;
  accentSupportsLight: (a: AccentId) => boolean;
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
      const nextMode = !canUseLight(a) && mode === 'light' ? 'dark' : mode;
      setAccentState(a);
      setModeState(nextMode);
      void persist(nextMode, a);
    },
    [isPro, mode, persist],
  );

  const setMode = useCallback(
    (m: ThemeMode) => {
      if (m === 'light' && !canUseLight(accent)) return;
      setModeState(m);
      void persist(m, accent);
    },
    [accent, persist],
  );

  const theme = useMemo(() => buildTheme(mode, accent), [mode, accent]);

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
    }),
    [theme, mode, accent, isPro, setMode, setAccent],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
