import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter, type Href } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  PieChart,
  type LucideIcon,
} from 'lucide-react-native';
import { DS, Font, Motion, Radius, Tabular } from '../lib/design-system';
import { useCalculatorResults } from '../hooks/useCalculatorResults';

type CalcDef = {
  href: Href;
  title: string;
  subtitle: string;
  formula: string;
  Icon: LucideIcon;
};

const CALCS: CalcDef[] = [
  {
    href: '/calculator-macro',
    title: 'Macro Split',
    subtitle: 'Calorie target → P / C / F',
    formula: 'Mifflin-St Jeor + lean-mass method',
    Icon: PieChart,
  },
  {
    href: '/calculator-1rm',
    title: '1RM',
    subtitle: 'Estimate your one-rep max',
    formula: 'Epley · Brzycki · Lombardi',
    Icon: Dumbbell,
  },
];

const TIPS = [
  {
    title: 'Protein comes first',
    body: 'Your protein target is set first based on lean mass. Carbs and fat fill the remaining calories around it.',
  },
  {
    title: 'Recalculate every 4–6 weeks',
    body: 'Update your macros regularly as your weight changes — especially during a cut.',
  },
  {
    title: 'Carbs are flexible',
    body: 'On keto / low-carb, use your fat target as the primary lever and drop carbs accordingly.',
  },
];

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function CalculatorsScreen() {
  const router = useRouter();
  const { macro, oneRm, loading } = useCalculatorResults();

  const hasResults = !!macro || !!oneRm;
  const lastUpdated = useMemo(
    () => macro?.calculated_at ?? oneRm?.updatedAt ?? null,
    [macro, oneRm],
  );

  function handleBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  function handleCalcPress(c: CalcDef) {
    router.push(c.href);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          hitSlop={10}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeft size={18} color={DS.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Calculators</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Calculators list */}
        {CALCS.map((c, i) => (
          <Animated.View
            key={c.title}
            entering={FadeInDown.duration(Motion.durationRise).delay(
              40 + i * Motion.staggerStep,
            )}
          >
            <Pressable
              onPress={() => handleCalcPress(c)}
              style={({ pressed }) => [
                styles.calcCard,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={c.title}
            >
              <View style={styles.calcIconWrap}>
                <c.Icon size={18} color={DS.accent} strokeWidth={2} />
              </View>
              <View style={styles.calcBody}>
                <Text style={styles.calcTitle}>{c.title}</Text>
                <Text style={styles.calcSubtitle}>{c.subtitle}</Text>
                <Text style={styles.calcFormula}>{c.formula}</Text>
              </View>
              <ChevronRight size={16} color={DS.textTertiary} strokeWidth={2} />
            </Pressable>
          </Animated.View>
        ))}

        {/* Last results */}
        <View style={styles.panel}>
          <Text style={styles.panelLabel}>LAST RESULTS</Text>
          {loading ? (
            <Text style={styles.panelEmpty}>Loading…</Text>
          ) : hasResults ? (
            <>
              {lastUpdated ? (
                <Text style={styles.panelMeta}>
                  Last updated {fmtDate(lastUpdated)}
                </Text>
              ) : null}
              <View style={styles.chipRow}>
                {macro ? (
                  <>
                    <Chip label="kcal" value={`${macro.calories}`} />
                    <Chip label="protein" value={`${macro.protein_g}g`} />
                    <Chip label="carbs" value={`${macro.carbs_g}g`} />
                    <Chip label="fat" value={`${macro.fat_g}g`} />
                  </>
                ) : null}
                {oneRm ? (
                  <Chip
                    label="1RM"
                    value={`${oneRm.oneRepMax} ${oneRm.unit}`}
                  />
                ) : null}
              </View>
            </>
          ) : (
            <Text style={styles.panelEmpty}>
              Run a calculator to see results.
            </Text>
          )}
        </View>

        {/* Tips */}
        <View style={styles.panel}>
          <Text style={styles.panelLabel}>TIPS FOR ACCURACY</Text>
          {TIPS.map((t) => (
            <View key={t.title} style={styles.tipRow}>
              <View style={styles.tipDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.tipTitle}>{t.title}</Text>
                <Text style={styles.tipBody}>{t.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Text style={[styles.chipValue, Tabular]}>{value}</Text>
      <Text style={styles.chipLabel}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: DS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Font.bold,
    fontSize: 16,
    color: DS.text,
    letterSpacing: -0.2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 10,
  },
  pressed: { transform: [{ scale: 0.99 }], opacity: 0.9 },
  calcCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: Radius.card,
  },
  calcIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: DS.accentSoft,
    borderColor: DS.accentBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calcBody: { flex: 1, gap: 3 },
  calcTitle: {
    fontFamily: Font.bold,
    fontSize: 14,
    color: DS.text,
    letterSpacing: -0.2,
  },
  calcSubtitle: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DS.textSecondary,
  },
  calcFormula: {
    fontFamily: Font.medium,
    fontSize: 10,
    color: DS.textTertiary,
    marginTop: 1,
  },
  panel: {
    marginTop: 6,
    padding: 14,
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: Radius.card,
    gap: 10,
  },
  panelLabel: {
    fontFamily: Font.bold,
    fontSize: 9,
    letterSpacing: 0.8,
    color: DS.textTertiary,
  },
  panelEmpty: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.textTertiary,
  },
  panelMeta: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DS.textTertiary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    minWidth: 70,
    backgroundColor: DS.bg,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: 10,
  },
  chipValue: {
    fontFamily: Font.bold,
    fontSize: 14,
    color: DS.text,
  },
  chipLabel: {
    fontFamily: Font.bold,
    fontSize: 9,
    color: DS.textTertiary,
    letterSpacing: 0.6,
    marginTop: 2,
  },
  tipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  tipDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: DS.accent,
    marginTop: 6,
  },
  tipTitle: {
    fontFamily: Font.bold,
    fontSize: 12,
    color: DS.text,
  },
  tipBody: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DS.textTertiary,
    lineHeight: 16,
    marginTop: 2,
  },
  bottomSpacer: { height: 140 },
});
