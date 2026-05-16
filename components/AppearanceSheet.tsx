import { forwardRef, useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../lib/theme-context';
import { ACCENTS } from '../lib/theme';
import UpgradeModal from './UpgradeModal';

export const AppearanceSheet = forwardRef<BottomSheetModal>(
  function AppearanceSheet(_, ref) {
    const {
      theme: c,
      mode,
      accent,
      setMode,
      setAccent,
      isAccentLocked,
      accentSupportsLight,
    } = useTheme();
    const snapPoints = useMemo(() => ['72%'], []);
    const [upgradeOpen, setUpgradeOpen] = useState(false);

    const dismiss = useCallback(() => {
      if (ref && typeof ref !== 'function') ref.current?.dismiss();
    }, [ref]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.6}
        />
      ),
      [],
    );

    const showMode = accentSupportsLight(accent);

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        backgroundStyle={{ backgroundColor: c.surface }}
        handleIndicatorStyle={{ backgroundColor: c.surfaceMuted }}
        backdropComponent={renderBackdrop}
      >
        <View
          style={[styles.topAccent, { backgroundColor: c.accent }]}
          pointerEvents="none"
        />
        <BottomSheetView style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: c.textPrimary }]}>
              Appearance
            </Text>
            <Pressable onPress={dismiss} hitSlop={10}>
              <Text style={[styles.done, { color: c.accentLight }]}>Done</Text>
            </Pressable>
          </View>

          {showMode ? (
            <>
              <Text style={[styles.sectionLabel, { color: c.textHint }]}>
                MODE
              </Text>
              <View style={styles.modeRow}>
                {(['dark', 'light'] as const).map((m) => {
                  const active = mode === m;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => setMode(m)}
                      style={[
                        styles.modePill,
                        { borderColor: active ? c.accent : c.border },
                        active && { backgroundColor: c.accentSoft },
                      ]}
                    >
                      <Feather
                        name={m === 'dark' ? 'moon' : 'sun'}
                        size={14}
                        color={active ? c.accentLight : c.textSecondary}
                      />
                      <Text
                        style={[
                          styles.modeText,
                          { color: active ? c.accentLight : c.textSecondary },
                        ]}
                      >
                        {m === 'dark' ? 'Dark' : 'Light'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}

          <Text style={[styles.sectionLabel, { color: c.textHint }]}>
            COLOR
          </Text>
          <View style={styles.grid}>
            {ACCENTS.map((a) => {
              const selected = accent === a.id;
              const locked = isAccentLocked(a.id);
              return (
                <Pressable
                  key={a.id}
                  style={styles.swatchWrap}
                  onPress={() => {
                    if (locked) {
                      setUpgradeOpen(true);
                      return;
                    }
                    setAccent(a.id);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${a.label}${locked ? ', Pro' : ''}`}
                >
                  <View
                    style={[
                      styles.swatch,
                      { backgroundColor: a.color },
                      selected && { borderColor: c.textPrimary, borderWidth: 3 },
                    ]}
                  >
                    {selected ? (
                      <Feather name="check" size={16} color="#FFFFFF" />
                    ) : null}
                    {locked && !selected ? (
                      <View style={styles.lockBadge}>
                        <Feather name="lock" size={10} color="#FFFFFF" />
                      </View>
                    ) : null}
                  </View>
                  <Text
                    style={[styles.swatchLabel, { color: c.textMuted }]}
                    numberOfLines={1}
                  >
                    {a.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={[styles.fullBtn, { borderColor: c.border }]}
            onPress={() =>
              console.log('TODO: full appearance settings (future phase)')
            }
          >
            <Text style={[styles.fullText, { color: c.accentLight }]}>
              Full appearance settings →
            </Text>
          </Pressable>
        </BottomSheetView>

        <UpgradeModal
          visible={upgradeOpen}
          onClose={() => setUpgradeOpen(false)}
        />
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.7,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  done: {
    fontSize: 15,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 10,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  swatchWrap: {
    width: '13%',
    alignItems: 'center',
    gap: 4,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchLabel: {
    fontSize: 9,
    textAlign: 'center',
  },
  fullBtn: {
    marginTop: 22,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  fullText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
