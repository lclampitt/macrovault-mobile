import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { ACTIVITY_OPTS } from '../lib/calculators';
import {
  useMeasurementsAnalyzer,
  type AnalyzerInput,
  type AnalyzerResult,
} from '../hooks/useMeasurementsAnalyzer';
import { useAnalyzerUsage } from '../hooks/useAnalyzerUsage';

type GoalKey = AnalyzerInput['goal'];
type Sex = AnalyzerInput['gender'];
type ActivityKey = AnalyzerInput['activityLevel'];

const GOAL_OPTS: { key: GoalKey; label: string; desc: string }[] = [
  { key: 'aggressive_cut', label: 'Aggressive cut', desc: '−750 kcal/day' },
  { key: 'cut', label: 'Cut — lose fat', desc: '−500 kcal/day' },
  { key: 'maintain', label: 'Maintenance', desc: 'TDEE' },
  { key: 'bulk', label: 'Lean bulk', desc: '+300 kcal/day' },
  { key: 'aggressive_bulk', label: 'Aggressive bulk', desc: '+500 kcal/day' },
];

// NOTE: This screen was previously routed at `/measurements`. It still works
//   identically; it was just renamed so the new `/measurements` index can be a
//   sparklines overview that links here for the deeper analysis.
export default function BodyFatAnalyzerScreen() {
  const router = useRouter();
  const { usage, refetch: refetchUsage } = useAnalyzerUsage();
  const { loading, analyze } = useMeasurementsAnalyzer();

  // Form state — imperial inputs matching web's Analyzer.
  const [gender, setGender] = useState<Sex>('male');
  const [age, setAge] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [weightLbs, setWeightLbs] = useState('');
  const [waistIn, setWaistIn] = useState('');
  const [hipIn, setHipIn] = useState('');
  const [activity, setActivity] = useState<ActivityKey>('moderate');
  const [goal, setGoal] = useState<GoalKey>('maintain');

  const [result, setResult] = useState<AnalyzerResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  function handleBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  const usageGate = useMemo(() => {
    if (!usage) return null;
    if (usage.analyzerLimit == null) return null; // Pro/Pro+ — unlimited
    const remaining = Math.max(0, usage.analyzerLimit - usage.analyzerUsed);
    return { used: usage.analyzerUsed, limit: usage.analyzerLimit, remaining };
  }, [usage]);

  async function handleAnalyze() {
    setError(null);
    setLimitReached(false);
    setResult(null);

    const ageN = parseInt(age, 10);
    const ftN = parseFloat(heightFt);
    const inN = parseFloat(heightIn || '0');
    const wlbsN = parseFloat(weightLbs);
    const waistN = parseFloat(waistIn);
    const hipN = parseFloat(hipIn);

    if (!ageN || ageN < 13 || ageN > 100) {
      setError('Please enter a valid age (13–100).');
      return;
    }
    if (!ftN || ftN <= 0) {
      setError('Please enter your height (ft).');
      return;
    }
    if (!wlbsN || wlbsN <= 0) {
      setError('Please enter a valid weight.');
      return;
    }
    if (!waistN || waistN <= 0) {
      setError('Please enter your waist measurement.');
      return;
    }
    if (!hipN || hipN <= 0) {
      setError('Please enter your hip measurement.');
      return;
    }

    const r = await analyze({
      gender,
      age: ageN,
      heightFt: ftN,
      heightIn: inN,
      weightLbs: wlbsN,
      waistIn: waistN,
      hipIn: hipN,
      activityLevel: activity,
      goal,
    });
    if (r.error) {
      setError(r.error);
      setLimitReached(r.limitReached);
      return;
    }
    setResult(r.result);
    await refetchUsage();
  }

  function clearResult() {
    setResult(null);
    setError(null);
    setLimitReached(false);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          hitSlop={10}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="chevron-left" size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Body Fat Analyzer</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>
          Enter your measurements to estimate body fat % and get calorie
          targets.
        </Text>

        {usageGate ? (
          <View style={styles.usageRow}>
            <Feather name="bar-chart-2" size={12} color={Colors.textMuted} />
            <Text style={styles.usageText}>
              {usageGate.used} of {usageGate.limit} runs used this month ·{' '}
              {usageGate.remaining} left
            </Text>
          </View>
        ) : null}

        {/* ---- Input form ---- */}
        <View style={styles.card}>
          <Text style={styles.intro}>
            These are sent to a machine-learning model trained on the NHANES
            2017–2018 dataset to estimate your body fat % and give practical
            calorie targets.
          </Text>

          <SectionLabel>Gender</SectionLabel>
          <View style={styles.pillsRow}>
            {(['male', 'female'] as Sex[]).map((s) => {
              const active = gender === s;
              return (
                <Pressable
                  key={s}
                  onPress={() => setGender(s)}
                  style={[styles.pill, active && styles.pillActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text
                    style={[styles.pillText, active && styles.pillTextActive]}
                  >
                    {s === 'male' ? 'Male' : 'Female'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <SectionLabel>Body</SectionLabel>
          <View style={styles.grid}>
            <Field label="Age" value={age} onChange={setAge} keyboard="numeric" />
            <Field
              label="Weight (lbs)"
              value={weightLbs}
              onChange={setWeightLbs}
              keyboard="decimal"
            />
          </View>
          <Text style={styles.fieldLabel}>Height</Text>
          <View style={styles.dualRow}>
            <View style={styles.dualCol}>
              <TextInput
                style={styles.input}
                value={heightFt}
                onChangeText={setHeightFt}
                placeholder="ft"
                placeholderTextColor={Colors.textHint}
                keyboardType="numeric"
                inputMode="numeric"
              />
            </View>
            <View style={styles.dualCol}>
              <TextInput
                style={styles.input}
                value={heightIn}
                onChangeText={setHeightIn}
                placeholder="in"
                placeholderTextColor={Colors.textHint}
                keyboardType="numeric"
                inputMode="numeric"
              />
            </View>
          </View>

          <SectionLabel>Circumference</SectionLabel>
          <View style={styles.grid}>
            <Field
              label="Waist (in, at navel)"
              value={waistIn}
              onChange={setWaistIn}
              keyboard="decimal"
            />
            <Field
              label="Hip (in)"
              value={hipIn}
              onChange={setHipIn}
              keyboard="decimal"
            />
          </View>

          <SectionLabel>Activity Level</SectionLabel>
          <View style={styles.optList}>
            {ACTIVITY_OPTS.map((opt) => {
              const active = activity === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setActivity(opt.key)}
                  style={[styles.optRow, active && styles.optRowActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <View style={styles.optBody}>
                    <Text
                      style={[
                        styles.optLabel,
                        active && styles.optLabelActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    <Text style={styles.optDesc}>{opt.desc}</Text>
                  </View>
                  {active ? (
                    <Feather name="check" size={14} color={Colors.accentLight} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <SectionLabel>Goal</SectionLabel>
          <View style={styles.optList}>
            {GOAL_OPTS.map((opt) => {
              const active = goal === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setGoal(opt.key)}
                  style={[styles.optRow, active && styles.optRowActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <View style={styles.optBody}>
                    <Text
                      style={[
                        styles.optLabel,
                        active && styles.optLabelActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    <Text style={styles.optDesc}>{opt.desc}</Text>
                  </View>
                  {active ? (
                    <Feather name="check" size={14} color={Colors.accentLight} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {error ? (
            <View
              style={[
                styles.errorBox,
                limitReached && styles.errorBoxUpgrade,
              ]}
            >
              <Feather
                name={limitReached ? 'lock' : 'alert-circle'}
                size={13}
                color={limitReached ? Colors.accentLight : Colors.error}
              />
              <Text
                style={[
                  styles.errorText,
                  limitReached && styles.errorTextUpgrade,
                ]}
              >
                {error}
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={handleAnalyze}
            disabled={loading}
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Analyze measurements</Text>
            )}
          </Pressable>
        </View>

        {/* ---- Results ---- */}
        {result ? <ResultsCard result={result} onReset={clearResult} /> : null}

        {/* ---- About ---- */}
        <View style={styles.aboutCard}>
          <Text style={styles.aboutHeading}>How these estimates work</Text>
          <Text style={styles.aboutBody}>
            This analyzer uses a Random Forest model trained on the NHANES
            2017–2018 dataset — a nationally representative sample of
            thousands of U.S. adults, with DXA-measured body fat as the ground
            truth. Use the results as practical guidance for training and
            nutrition, not as a medical diagnosis.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function Field({
  label,
  value,
  onChange,
  keyboard,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboard: 'numeric' | 'decimal';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder="0"
        placeholderTextColor={Colors.textHint}
        keyboardType="numeric"
        inputMode={keyboard}
      />
    </View>
  );
}

function ResultsCard({
  result,
  onReset,
}: {
  result: AnalyzerResult;
  onReset: () => void;
}) {
  const bf =
    typeof result.bodyfat === 'number'
      ? `${result.bodyfat.toFixed(1)}%`
      : `${result.bodyfat}%`;
  const delta = result.deficit_or_surplus ?? 0;
  const deltaSign = delta > 0 ? '+' : '';
  const deltaColor =
    delta < 0
      ? Colors.error
      : delta > 0
        ? Colors.accentLight
        : Colors.textMuted;
  return (
    <View style={styles.resultsWrap}>
      <View style={styles.resultsHero}>
        <Text style={styles.resultsHeroLabel}>Estimated body fat</Text>
        <Text style={styles.resultsHeroValue}>{bf}</Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{result.category}</Text>
        </View>
      </View>

      <View style={styles.tilesRow}>
        <Tile
          label="BMR"
          unit="kcal at rest"
          value={result.bmr?.toLocaleString() ?? '—'}
        />
        <Tile
          label="TDEE"
          unit="kcal/day"
          value={result.tdee?.toLocaleString() ?? '—'}
        />
      </View>
      <View style={styles.tilesRow}>
        <Tile
          label="Target"
          unit="kcal/day"
          value={result.suggested_calories.toLocaleString()}
          accent
        />
        <Tile
          label={
            delta < 0 ? 'Deficit' : delta > 0 ? 'Surplus' : 'Balance'
          }
          unit="kcal/day"
          value={`${deltaSign}${delta.toLocaleString()}`}
          valueColor={deltaColor}
        />
      </View>

      <Text style={styles.formulaHint}>
        {result.formula === 'katch'
          ? 'Calculated using your body composition for a more personalized estimate.'
          : 'Add your body fat % above for a more accurate estimate.'}
      </Text>

      {result.goal_suggestion ? (
        <View style={styles.suggestionCard}>
          <Text style={styles.suggestionLabel}>GOAL SUGGESTION</Text>
          <Text style={styles.suggestionBody}>{result.goal_suggestion}</Text>
        </View>
      ) : null}

      {result.notes?.length ? (
        <View style={styles.notesCard}>
          <Text style={styles.suggestionLabel}>NEXT STEPS</Text>
          {result.notes.map((n, i) => (
            <View key={i} style={styles.noteRow}>
              <View style={styles.noteDot} />
              <Text style={styles.noteText}>{n}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Text style={styles.disclaimer}>
        Body fat estimates are calculated using standard anthropometric methods
        and may vary from clinical measurements by 3–8 percentage points or
        more. Use these as a trend tool, not a substitute for clinical
        testing.
      </Text>

      <Pressable
        onPress={onReset}
        style={styles.recalcBtn}
        accessibilityRole="button"
      >
        <Text style={styles.recalcText}>Run another analysis</Text>
      </Pressable>
    </View>
  );
}

function Tile({
  label,
  value,
  unit,
  accent,
  valueColor,
}: {
  label: string;
  value: string;
  unit: string;
  accent?: boolean;
  valueColor?: string;
}) {
  return (
    <View style={[styles.tile, accent && styles.tileAccent]}>
      <Text
        style={[
          styles.tileValue,
          accent && styles.tileValueAccent,
          valueColor ? { color: valueColor } : null,
        ]}
      >
        {value}
      </Text>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileUnit}>{unit}</Text>
    </View>
  );
}

// --------------------------------------------------------------------------
// Styles
// --------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  headerSpacer: { width: 32, height: 32 },
  scroll: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 140,
    gap: 12,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 2,
  },
  usageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  usageText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  intro: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 6,
  },
  sectionLabel: {
    color: Colors.textHint,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginTop: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  field: {
    width: '47%',
    flexGrow: 1,
    gap: 4,
  },
  fieldLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  input: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 9,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  dualRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dualCol: {
    flex: 1,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  pill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  pillActive: {
    borderColor: Colors.borderAccent,
    backgroundColor: Colors.accentSoft,
  },
  pillText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: Colors.accentLight,
  },
  optList: {
    gap: 6,
    marginTop: 2,
  },
  optRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  optRowActive: {
    borderColor: Colors.borderAccent,
    borderLeftColor: Colors.accent,
    backgroundColor: Colors.accentSofter,
  },
  optBody: {
    flex: 1,
    gap: 2,
  },
  optLabel: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  optLabelActive: {
    color: Colors.accentLight,
  },
  optDesc: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.errorBg,
    borderColor: Colors.errorBorder,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 9,
    marginTop: 14,
  },
  errorBoxUpgrade: {
    backgroundColor: Colors.accentSofter,
    borderColor: Colors.borderAccentSoft,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },
  errorTextUpgrade: {
    color: Colors.accentLight,
  },
  primaryBtn: {
    marginTop: 14,
    backgroundColor: Colors.accent,
    borderRadius: 11,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  resultsWrap: {
    gap: 10,
  },
  resultsHero: {
    backgroundColor: Colors.accentSofter,
    borderColor: Colors.borderAccent,
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    gap: 6,
  },
  resultsHeroLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  resultsHeroValue: {
    color: Colors.textPrimary,
    fontSize: 36,
    fontWeight: '800',
  },
  categoryBadge: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderColor: Colors.borderAccent,
    borderWidth: 1,
    backgroundColor: Colors.accentSoft,
  },
  categoryBadgeText: {
    color: Colors.accentLight,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tilesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tile: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 2,
    alignItems: 'flex-start',
  },
  tileAccent: {
    borderColor: Colors.borderAccent,
    backgroundColor: Colors.accentSofter,
  },
  tileValue: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  tileValueAccent: {
    color: Colors.accentLight,
  },
  tileLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tileUnit: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  formulaHint: {
    color: Colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
    paddingHorizontal: 4,
  },
  suggestionCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 5,
  },
  suggestionLabel: {
    color: Colors.textHint,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  suggestionBody: {
    color: Colors.textPrimary,
    fontSize: 12,
    lineHeight: 17,
  },
  notesCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 7,
  },
  noteRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  noteDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.accentLight,
    marginTop: 7,
  },
  noteText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  disclaimer: {
    color: Colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
    fontStyle: 'italic',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  recalcBtn: {
    marginTop: 6,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  recalcText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  aboutCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 5,
  },
  aboutHeading: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  aboutBody: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
});
