import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useCalculatorResults } from '../hooks/useCalculatorResults';

const HOW_ROWS = [
  {
    title: 'Macro Calculator — Mifflin-St Jeor + lean mass method',
    body: 'Calculates your total daily energy expenditure, adjusts for your goal, then splits calories into protein, carbs and fat targets using evidence-based ratios.',
  },
  {
    title: '1RM — Epley formula (primary)',
    body: 'Estimates your theoretical one-rep maximum from a submaximal set. Shows results from three formulas so you can see the range rather than relying on one number.',
  },
];

const TIPS = [
  {
    title: 'Protein comes first',
    body: 'Your protein target is set first based on lean mass. Carbs and fat fill the remaining calories around it.',
  },
  {
    title: 'Recalculate regularly',
    body: 'Update your macros every 4–6 weeks as your weight changes — especially during a cut.',
  },
  {
    title: 'Carbs are flexible',
    body: 'If you follow keto or low-carb, use your fat target as the primary lever and drop carbs accordingly.',
  },
];

function formatDate(iso: string): string {
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
  const lastUpdated = macro?.calculated_at ?? oneRm?.updatedAt ?? null;

  function handleBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          hitSlop={10}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="chevron-left" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Fitness Calculators</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Calculator cards */}
        <Pressable
          style={styles.calcCard}
          onPress={() => router.push('/calculator-macro')}
          accessibilityRole="button"
        >
          <View style={styles.calcIconWrap}>
            <MaterialCommunityIcons
              name="food-apple-outline"
              size={22}
              color={Colors.accentLight}
            />
          </View>
          <View style={styles.calcBody}>
            <Text style={styles.calcTitle}>Macro Calculator</Text>
            <Text style={styles.calcSubtitle}>Nutrition & macros</Text>
            <Text style={styles.calcDesc}>
              Get your personalized daily calorie target and complete protein,
              carbs, and fat breakdown based on your body and goals.
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={Colors.textMuted} />
        </Pressable>

        <Pressable
          style={styles.calcCard}
          onPress={() => router.push('/calculator-1rm')}
          accessibilityRole="button"
        >
          <View style={styles.calcIconWrap}>
            <MaterialCommunityIcons
              name="weight-lifter"
              size={22}
              color={Colors.accentLight}
            />
          </View>
          <View style={styles.calcBody}>
            <Text style={styles.calcTitle}>1RM Calculator</Text>
            <Text style={styles.calcSubtitle}>Strength estimation</Text>
            <Text style={styles.calcDesc}>
              Calculate your estimated one-rep max using Epley, Brzycki, and
              Lombardi formulas.
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color={Colors.textMuted} />
        </Pressable>

        {/* Last Results */}
        <View style={styles.panel}>
          <Text style={styles.panelHeading}>LAST RESULTS</Text>
          {loading ? null : hasResults ? (
            <>
              <Text style={styles.panelSub}>Based on your profile</Text>
              {lastUpdated ? (
                <Text style={styles.panelMeta}>
                  Last updated {formatDate(lastUpdated)}
                </Text>
              ) : null}
              <View style={styles.chipRow}>
                {macro ? (
                  <>
                    <ResultChip label="Calorie target" value={`${macro.calories}`} />
                    <ResultChip label="Protein / day" value={`${macro.protein_g}g`} />
                    <ResultChip label="Carbs / day" value={`${macro.carbs_g}g`} />
                  </>
                ) : null}
                {oneRm ? (
                  <ResultChip
                    label="Estimated 1RM"
                    value={`${oneRm.oneRepMax} ${oneRm.unit}`}
                  />
                ) : null}
              </View>
            </>
          ) : (
            <Text style={styles.panelEmpty}>
              Run a calculator to see your results here
            </Text>
          )}
        </View>

        {/* How these work */}
        <View style={styles.panel}>
          <Text style={styles.panelHeading}>HOW THESE WORK</Text>
          {HOW_ROWS.map((row) => (
            <View key={row.title} style={styles.infoRow}>
              <Text style={styles.infoTitle}>{row.title}</Text>
              <Text style={styles.infoBody}>{row.body}</Text>
            </View>
          ))}
        </View>

        {/* Tips for accuracy */}
        <View style={styles.panel}>
          <Text style={styles.panelHeading}>TIPS FOR ACCURACY</Text>
          {TIPS.map((tip) => (
            <View key={tip.title} style={styles.infoRow}>
              <Text style={styles.infoTitle}>{tip.title}</Text>
              <Text style={styles.infoBody}>{tip.body}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ResultChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipValue}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
    gap: 14,
  },
  calcCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  calcIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calcBody: {
    flex: 1,
    gap: 2,
  },
  calcTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  calcSubtitle: {
    color: Colors.accentLight,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  calcDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  panel: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 4,
  },
  panelHeading: {
    color: Colors.textHint,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  panelSub: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  panelMeta: {
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: 8,
  },
  panelEmpty: {
    color: Colors.textMuted,
    fontSize: 13,
    paddingVertical: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 84,
  },
  chipValue: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  chipLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  infoRow: {
    paddingVertical: 8,
    gap: 3,
  },
  infoTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  infoBody: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
});
