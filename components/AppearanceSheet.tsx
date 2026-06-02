import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Check, Moon, Palette, Sun, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Font, Radius, Shadow } from '../lib/design-system';
import { useTheme, useTokens } from '../lib/theme-context';
import type { Tokens } from '../lib/tokens';
import type { AccentId, ThemeMode } from '../lib/theme';

// --------------------------------------------------------------------------
// UI ↔ existing theme system mapping
//
// The public surface here is just two themes — "Emerald" and "Sakura" — so
// users don't have to think about the legacy accent zoo. Each maps to one
// AccentId in lib/theme.ts:
//   Emerald → "teal"  (the brand emerald with both dark + light variants)
//   Sakura  → "rose"  (cherry-blossom palette; light only for now)
// --------------------------------------------------------------------------

type ThemeUiId = 'emerald' | 'sakura';

type ThemeUiMeta = {
  id: ThemeUiId;
  name: string;
  accent: AccentId;
  /** Which modes this theme has been designed for. */
  supportedModes: ReadonlyArray<ThemeMode>;
  preview: {
    bg: string;
    surface: string;
    border: string;
    text: string;
    accent: string;
    accentGradient: readonly [string, string];
  };
};

const THEMES: ThemeUiMeta[] = [
  {
    id: 'emerald',
    name: 'Emerald',
    accent: 'teal',
    supportedModes: ['dark', 'light'],
    preview: {
      bg: '#000',
      surface: '#0A0A0A',
      border: '#1A1A1A',
      text: '#fff',
      accent: '#10B981',
      accentGradient: ['#10B981', '#059669'] as const,
    },
  },
  {
    id: 'sakura',
    name: 'Sakura',
    accent: 'rose',
    supportedModes: ['light'],
    preview: {
      bg: '#FAF3F0',
      surface: '#FFFFFF',
      border: '#F0E5E0',
      text: '#2A1F26',
      accent: '#D85A85',
      accentGradient: ['#F08AAC', '#C2436F'] as const,
    },
  },
];

function findUiTheme(accent: AccentId): ThemeUiId {
  return accent === 'rose' ? 'sakura' : 'emerald';
}

// --------------------------------------------------------------------------
// Sheet
// --------------------------------------------------------------------------

export const AppearanceSheet = forwardRef<BottomSheetModal>(
  function AppearanceSheet(_, ref) {
    const { mode, accent, setMode, setAccent } = useTheme();
    const t = useTokens();
    const snapPoints = useMemo(() => ['70%'], []);

    // Local draft state — the committed app theme doesn't change until the
    // user taps Apply. That gives them a preview moment per spec.
    const [draftMode, setDraftMode] = useState<ThemeMode>(mode);
    const [draftTheme, setDraftTheme] = useState<ThemeUiId>(
      findUiTheme(accent),
    );

    // Resync the draft to the active theme whenever the sheet re-opens via
    // the live mode/accent fields (BottomSheetModal keeps state between opens).
    useEffect(() => {
      setDraftMode(mode);
      setDraftTheme(findUiTheme(accent));
    }, [mode, accent]);

    const dismiss = useCallback(() => {
      if (ref && typeof ref !== 'function') ref.current?.dismiss();
    }, [ref]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.4}
        />
      ),
      [],
    );

    // If the user picks a (theme, mode) combo that doesn't exist, auto-resolve
    // to the nearest supported mode for that theme. Per spec: "if user picks
    // Sakura, auto-select Light mode since that's the only Sakura variant
    // that exists."
    const selectedTheme = THEMES.find((t) => t.id === draftTheme)!;
    const effectiveMode: ThemeMode = selectedTheme.supportedModes.includes(
      draftMode,
    )
      ? draftMode
      : selectedTheme.supportedModes[0];

    function handlePickTheme(id: ThemeUiId) {
      setDraftTheme(id);
      const t = THEMES.find((tt) => tt.id === id)!;
      if (!t.supportedModes.includes(draftMode)) {
        setDraftMode(t.supportedModes[0]);
      }
    }

    function handleApply() {
      // Commit + dismiss. No-op when nothing changed.
      const targetAccent = THEMES.find((t) => t.id === draftTheme)!.accent;
      const accentChanged = targetAccent !== accent;
      const modeChanged = effectiveMode !== mode;
      if (accentChanged) setAccent(targetAccent);
      if (modeChanged) setMode(effectiveMode);
      // NOTE: toast confirmation is a follow-up. Today the visual swap is
      //   the confirmation — every emerald-tinted surface ripples instantly.
      dismiss();
    }

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        backgroundStyle={[styles.sheetBg, { backgroundColor: t.bgCard }]}
        handleIndicatorStyle={[
          styles.handle,
          { backgroundColor: t.textQuaternary },
        ]}
        backdropComponent={renderBackdrop}
        accessibilityLabel="Appearance settings"
      >
        <BottomSheetView style={styles.content}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.headerIconWrap,
                  {
                    backgroundColor: t.primaryTintBg,
                    borderColor: t.primaryTintBorder,
                  },
                ]}
              >
                <Palette
                  size={14}
                  color={t.primary}
                  strokeWidth={2.5}
                  accessibilityElementsHidden
                />
              </View>
              <View>
                <Text style={[styles.headerLabel, { color: t.primary }]}>
                  APPEARANCE
                </Text>
                <Text style={[styles.headerSub, { color: t.textTertiary }]}>
                  Customize your theme
                </Text>
              </View>
            </View>
            <Pressable
              onPress={dismiss}
              hitSlop={8}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: t.bgCardElevated,
                  borderColor: t.borderDefault,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Close appearance settings"
            >
              <X size={14} color={t.textSecondary} strokeWidth={2.5} />
            </Pressable>
          </View>

          {/* Mode */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: t.textTertiary }]}>
              MODE
            </Text>
            <View style={styles.modeRow}>
              <ModePill
                Icon={Moon}
                label="Dark"
                tokens={t}
                active={effectiveMode === 'dark'}
                disabled={!selectedTheme.supportedModes.includes('dark')}
                onPress={() => setDraftMode('dark')}
              />
              <ModePill
                Icon={Sun}
                label="Light"
                tokens={t}
                active={effectiveMode === 'light'}
                disabled={!selectedTheme.supportedModes.includes('light')}
                onPress={() => setDraftMode('light')}
              />
            </View>
            {!selectedTheme.supportedModes.includes(draftMode) ? (
              <Text style={[styles.modeNote, { color: t.textTertiary }]}>
                Sakura is currently available in Light mode only
              </Text>
            ) : null}
          </View>

          {/* Themes */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { color: t.textTertiary }]}>
                THEME
              </Text>
              <Text style={[styles.sectionMeta, { color: t.textQuaternary }]}>
                {THEMES.length} available
              </Text>
            </View>
            <View
              style={styles.themesGrid}
              accessibilityRole="radiogroup"
              accessibilityLabel="Theme selection"
            >
              {THEMES.map((th) => (
                <ThemeTile
                  key={th.id}
                  theme={th}
                  tokens={t}
                  active={th.id === draftTheme}
                  onPress={() => handlePickTheme(th.id)}
                />
              ))}
            </View>
          </View>

          {/* Microtype hint */}
          <View style={styles.hintRow}>
            <View
              style={[styles.hintDot, { backgroundColor: t.textQuaternary }]}
            />
            <Text style={[styles.hintText, { color: t.textTertiary }]}>
              More themes coming soon. Tap Apply to commit your selection.
            </Text>
          </View>

          {/* Apply */}
          <View style={styles.applyWrap}>
            <Pressable
              onPress={handleApply}
              style={({ pressed }) => [
                styles.applyBtn,
                pressed && styles.applyPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Apply theme"
            >
              <LinearGradient
                colors={[t.primaryGradientStart, t.primaryGradientEnd]}
                style={styles.applyFill}
              />
              <View style={styles.applyContent}>
                <Check size={16} color={t.textOnPrimary} strokeWidth={3} />
                <Text style={[styles.applyText, { color: t.textOnPrimary }]}>
                  Apply theme
                </Text>
              </View>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

// --------------------------------------------------------------------------
// Mode pill
// --------------------------------------------------------------------------

/**
 * Mode pill — Dark or Light selector.
 *
 * `tokens` is passed in from the parent rather than read via `useTokens()`
 * here. The BottomSheetModal portal wasn't always re-rendering its inner
 * sub-components on theme changes (the outer sheet body re-renders, but
 * sub-components were sometimes drawing with stale tokens — in light
 * mode the inactive Dark pill rendered with dark-mode `bgCardElevated`
 * (#0F0F0F) while the surrounding sheet was correctly white). Threading
 * tokens down as a prop guarantees both pills paint with the same set
 * the parent computed.
 */
function ModePill({
  Icon,
  label,
  tokens: t,
  active,
  disabled,
  onPress,
}: {
  Icon: typeof Moon;
  label: string;
  tokens: Tokens;
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.modePill,
        {
          backgroundColor: t.bgCardElevated,
          borderColor: t.borderDefault,
        },
        active && styles.modePillActive,
        disabled && styles.modePillDisabled,
        pressed && active && styles.modePillPressed,
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected: active, disabled: !!disabled }}
      accessibilityLabel={`${label} mode`}
    >
      {active ? (
        <LinearGradient
          colors={[t.primaryGradientStart, t.primaryGradientEnd]}
          style={styles.modePillFill}
        />
      ) : null}
      <View style={styles.modePillContent}>
        <Icon
          size={14}
          color={active ? t.textOnPrimary : t.textSecondary}
          strokeWidth={2.5}
        />
        <Text
          style={[
            styles.modePillLabel,
            { color: active ? t.textOnPrimary : t.textSecondary },
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

// --------------------------------------------------------------------------
// Theme tile — miniature preview of the running app
// --------------------------------------------------------------------------

/**
 * Theme tile — same tokens-from-parent pattern as ModePill (see comment
 * on ModePill for the rationale).
 */
function ThemeTile({
  theme,
  tokens: t,
  active,
  onPress,
}: {
  theme: ThemeUiMeta;
  tokens: Tokens;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: t.bgCardElevated,
          borderColor: t.borderDefault,
        },
        active && {
          backgroundColor: t.primaryTintBg,
          borderColor: t.primaryBorderStrong,
        },
        pressed && styles.tilePressed,
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${theme.name} theme`}
    >
      {/* Preview pane — 5:7 aspect ratio. The page bg fills the back; an
          inset rounded surface mimics a card with two tiny bars + a CTA. */}
      <View
        style={[styles.tilePreview, { backgroundColor: theme.preview.bg }]}
      >
        <View
          style={[
            styles.tileSurface,
            {
              backgroundColor: theme.preview.surface,
              borderColor: theme.preview.border,
            },
          ]}
        >
          <View style={styles.tileSurfaceInner}>
            <View style={styles.tileTopGroup}>
              <View
                style={[
                  styles.tileBar,
                  styles.tileTitleBar,
                  { backgroundColor: theme.preview.text, opacity: 0.5 },
                ]}
              />
              <View
                style={[
                  styles.tileBar,
                  styles.tileValueBar,
                  { backgroundColor: theme.preview.text },
                ]}
              />
            </View>
            <LinearGradient
              colors={[
                theme.preview.accentGradient[0],
                theme.preview.accentGradient[1],
              ]}
              style={styles.tileCta}
            />
          </View>
        </View>

        {active ? (
          <View style={styles.tileCheck}>
            <Check size={10} color="#000" strokeWidth={4} />
          </View>
        ) : null}
      </View>

      <View style={styles.tileName}>
        <Text style={[styles.tileNameText, { color: t.textPrimary }]}>
          {theme.name}
        </Text>
      </View>
    </Pressable>
  );
}

// --------------------------------------------------------------------------
// Styles
// --------------------------------------------------------------------------

const styles = StyleSheet.create({
  sheetBg: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingBottom: 18,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  headerSub: {
    fontFamily: Font.medium,
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Sections
  section: { marginBottom: 18 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionLabel: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 8,
  },
  sectionMeta: {
    fontFamily: Font.medium,
    fontSize: 10,
  },
  // Mode pills
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modePill: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  modePillActive: {
    borderColor: 'transparent',
    ...Shadow.emeraldGlow,
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  modePillInactive: {},
  modePillDisabled: {
    opacity: 0.35,
  },
  modePillPressed: {
    transform: [{ scale: 0.98 }],
  },
  modePillFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modePillContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modePillLabel: {
    fontFamily: Font.bold,
    fontSize: 13,
  },
  modeNote: {
    marginTop: 8,
    fontFamily: Font.medium,
    fontSize: 10,
  },
  // Theme tiles
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: Radius.card,
    overflow: 'hidden',
  },
  tilePressed: {
    transform: [{ scale: 0.97 }],
  },
  tilePreview: {
    aspectRatio: 5 / 7,
    position: 'relative',
    overflow: 'hidden',
  },
  tileSurface: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  tileSurfaceInner: {
    flex: 1,
    padding: 6,
    justifyContent: 'space-between',
  },
  tileTopGroup: { gap: 4 },
  tileBar: { borderRadius: 999 },
  tileTitleBar: {
    height: 3,
    width: '60%',
  },
  tileValueBar: {
    height: 6,
    width: '80%',
  },
  tileCta: {
    height: 9,
    width: '100%',
    borderRadius: 4,
  },
  tileCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981', // emerald check is identical across themes
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
  },
  tileName: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  tileNameText: {
    fontFamily: Font.bold,
    fontSize: 12,
  },
  // Hint
  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 2,
    marginBottom: 14,
  },
  hintDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginTop: 5,
  },
  hintText: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: 10,
    lineHeight: 14,
  },
  // Apply
  applyWrap: { paddingTop: 4 },
  applyBtn: {
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#10B981',
    ...Shadow.emeraldGlow,
  },
  applyPressed: {
    transform: [{ scale: 0.98 }],
  },
  applyFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  applyContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  applyText: {
    fontFamily: Font.bold,
    fontSize: 14,
    letterSpacing: 0.2,
  },
});
