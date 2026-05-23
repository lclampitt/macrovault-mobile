import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import {
  ACTIVITY_OPTS,
  DIET_OPTS,
  GOAL_OPTS,
  MACRO_TOTAL_STEPS,
  computeMacros,
  type ActivityKey,
  type DietKey,
  type GoalKey,
  type MacroResult,
  type Sex,
} from '../lib/calculators';
import { saveMacroResult } from '../lib/calculatorStorage';
import DeleteConfirmModal from '../components/progress/DeleteConfirmModal';

function goalTypeForColumn(goal: GoalKey): string {
  if (goal === 'cut') return 'Cutting';
  if (goal === 'bulk') return 'Bulking';
  return 'Maintenance';
}

export default function MacroCalculatorScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const [sex, setSex] = useState<Sex | null>(null);
  const [age, setAge] = useState('');
  const [imperial, setImperial] = useState(true);
  const [weightVal, setWeightVal] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [showBfInfo, setShowBfInfo] = useState(false);
  const [activity, setActivity] = useState<ActivityKey>('moderate');
  const [goal, setGoal] = useState<GoalKey>('cut');
  const [diet, setDiet] = useState<DietKey>('standard');

  const [results, setResults] = useState<MacroResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function handleBack() {
    if (results) {
      setResults(null);
      return;
    }
    if (step > 1) {
      setError(null);
      setStep((s) => s - 1);
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/calculators');
  }

  function validateStep(): string | null {
    if (step === 1) {
      if (!sex) return 'Please select your biological sex.';
    }
    if (step === 2) {
      const a = parseInt(age, 10);
      if (!a || a < 16 || a > 80) return 'Please enter a valid age (16–80).';
      const w = parseFloat(weightVal);
      if (!w || w <= 0) return 'Please enter a valid weight.';
      if (imperial) {
        const ft = parseFloat(heightFt);
        if (!ft || ft <= 0) return 'Please enter your height in ft.';
      } else {
        const cm = parseFloat(heightCm);
        if (!cm || cm <= 0) return 'Please enter your height in cm.';
      }
    }
    return null;
  }

  function next() {
    const v = validateStep();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    if (step < MACRO_TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      runCalculation();
    }
  }

  async function runCalculation() {
    const res = computeMacros({
      sex: sex as Sex,
      age: parseInt(age, 10),
      imperial,
      weightLbsOrKg: parseFloat(weightVal),
      heightFt: parseFloat(heightFt) || 0,
      heightIn: parseFloat(heightIn) || 0,
      heightCm: parseFloat(heightCm) || 0,
      bodyFat: bodyFat.trim() === '' ? '' : bodyFat.trim(),
      activity,
      goal,
      diet,
    });
    setResults(res);
    await saveMacroResult({
      calories: res.targetCals,
      protein_g: res.proteinG,
      carbs_g: res.carbG,
      fat_g: res.fatG,
      goal,
      calculated_at: new Date().toISOString(),
    });
  }

  function recalculate() {
    setResults(null);
    setStep(1);
    setError(null);
  }

  async function shareResults() {
    if (!results) return;
    const lines = [
      'My MacroVault macro targets',
      `Calories: ${results.targetCals} kcal/day`,
      `Protein: ${results.proteinG} g`,
      `Carbs: ${results.carbG} g`,
      `Fat: ${results.fatG} g`,
      `TDEE: ${results.tdee} kcal · BMR: ${results.bmr} kcal`,
    ];
    try {
      await Share.share({ message: lines.join('\n') });
    } catch {
      /* user dismissed */
    }
  }

  async function doSaveToGoals() {
    if (!user || !results) return;
    setSaving(true);
    setSaveError(null);
    try {
      // NOTE: deliberately NOT using upsert({ onConflict }) — that performs an
      // ON CONFLICT DO UPDATE which fails silently/erratically against the
      // `goals` table (same class of bug we hit with `profiles`). Do an
      // explicit update-by-user_id, then insert only if no row existed.
      const payload = {
        goal: goalTypeForColumn(goal),
        calories: results.targetCals,
        protein: results.proteinG,
        carbs: results.carbG,
        fat: results.fatG,
      };
      const { data: updated, error: updateError } = await supabase
        .from('goals')
        .update(payload)
        .eq('user_id', user.id)
        .select('id');
      if (updateError) throw updateError;
      if (!updated || updated.length === 0) {
        const { error: insertError } = await supabase
          .from('goals')
          .insert({ user_id: user.id, ...payload });
        if (insertError) throw insertError;
      }
      router.push('/goal-planner');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save goal.';
      console.error('[calculator-macro.doSaveToGoals]', msg);
      // Inline error (works on web + native; Alert.alert is a no-op on
      // react-native-web, which is why localhost appeared to "do nothing").
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveToGoals() {
    setSaveError(null);
    if (!user) {
      setSaveError('Please sign in to save your goal.');
      return;
    }
    if (!results) return;
    try {
      // limit(1) (not maybeSingle) so a duplicate-row state doesn't error out
      // the whole check and block the save.
      const { data: existingRows } = await supabase
        .from('goals')
        .select('calories, protein, carbs, fat')
        .eq('user_id', user.id)
        .limit(1);
      const existing = existingRows?.[0];
      const hasExisting =
        !!existing &&
        ((existing.calories ?? 0) > 0 ||
          (existing.protein ?? 0) > 0 ||
          (existing.carbs ?? 0) > 0 ||
          (existing.fat ?? 0) > 0);
      if (hasExisting) {
        setConfirmVisible(true);
      } else {
        doSaveToGoals();
      }
    } catch {
      // If the existence check fails, fall back to a direct save.
      doSaveToGoals();
    }
  }

  const stepTitle = useMemo(() => {
    switch (step) {
      case 1:
        return 'What is your biological sex?';
      case 2:
        return 'Tell us about your body';
      case 3:
        return 'Do you know your body fat %?';
      case 4:
        return 'How active are you?';
      case 5:
        return 'What is your primary goal?';
      case 6:
        return 'Any dietary preference?';
      default:
        return '';
    }
  }, [step]);

  // -------------------------------------------------------------- results view
  if (results) {
    const goalDesc = GOAL_OPTS.find((g) => g.key === goal)?.desc ?? '';
    const perMeal = {
      cals: Math.round(results.targetCals / 3),
      p: Math.round(results.proteinG / 3),
      c: Math.round(results.carbG / 3),
      f: Math.round(results.fatG / 3),
    };
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
          <Text style={styles.headerTitle}>Your Macros</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.resultHero}>
            <Text style={styles.resultHeroLabel}>Daily calorie target</Text>
            <Text style={styles.resultHeroValue}>{results.targetCals}</Text>
            <Text style={styles.resultHeroUnit}>kcal / day</Text>
            <Text style={styles.resultHeroMeta}>
              TDEE {results.tdee} kcal · {goalDesc}
            </Text>
          </View>

          <View style={styles.macroRow}>
            <MacroCard
              label="Protein"
              value={`${results.proteinG}g`}
              tint={Colors.proteinColor}
            />
            <MacroCard
              label="Carbs"
              value={`${results.carbG}g`}
              tint={Colors.carbsColor}
            />
            <MacroCard
              label="Fat"
              value={`${results.fatG}g`}
              tint={Colors.fatColor}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.tableHeading}>Estimates</Text>
            <Row label="BMR" value={`${results.bmr} kcal`} />
            <Row label="TDEE" value={`${results.tdee} kcal`} />
            <Row
              label="Formula"
              value={
                results.bmrFormula === 'katch'
                  ? 'Katch-McArdle (lean mass)'
                  : 'Mifflin-St Jeor'
              }
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.tableHeading}>Per meal (÷3)</Text>
            <Row label="Calories" value={`${perMeal.cals} kcal`} />
            <Row label="Protein" value={`${perMeal.p} g`} />
            <Row label="Carbs" value={`${perMeal.c} g`} />
            <Row label="Fat" value={`${perMeal.f} g`} />
          </View>

          {saveError ? (
            <Text style={styles.saveError}>{saveError}</Text>
          ) : null}

          <Pressable
            style={[styles.primaryBtn, saving && styles.btnDisabled]}
            onPress={handleSaveToGoals}
            disabled={saving}
            accessibilityRole="button"
          >
            <Text style={styles.primaryBtnText}>
              {saving ? 'Saving…' : 'Save to Goal Planner'}
            </Text>
          </Pressable>
          <View style={styles.secondaryRow}>
            <Pressable
              style={styles.secondaryBtn}
              onPress={recalculate}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryBtnText}>Recalculate</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryBtn}
              onPress={shareResults}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryBtnText}>Share results</Text>
            </Pressable>
          </View>
        </ScrollView>

        <DeleteConfirmModal
          visible={confirmVisible}
          title="Overwrite existing goal?"
          message="You already have a calorie and macro goal set. Saving will replace it with these values."
          confirmLabel="Overwrite"
          onCancel={() => setConfirmVisible(false)}
          onConfirm={() => {
            setConfirmVisible(false);
            doSaveToGoals();
          }}
        />
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------- wizard view
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
        <Text style={styles.headerTitle}>Macro Calculator</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${(step / MACRO_TOTAL_STEPS) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.stepCount}>
          Step {step} of {MACRO_TOTAL_STEPS}
        </Text>
        <Text style={styles.stepTitle}>{stepTitle}</Text>

        {step === 1 ? (
          <>
            <Text style={styles.stepHint}>Used for the BMR calculation</Text>
            <View style={styles.choiceGrid}>
              {(['male', 'female'] as Sex[]).map((s) => {
                const active = sex === s;
                return (
                  <Pressable
                    key={s}
                    onPress={() => setSex(s)}
                    style={[styles.choiceCard, active && styles.choiceCardActive]}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.choiceLabel,
                        active && styles.choiceLabelActive,
                      ]}
                    >
                      {s === 'male' ? 'Male' : 'Female'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="e.g. 28"
              placeholderTextColor={Colors.textHint}
              keyboardType="numeric"
              inputMode="numeric"
            />

            <View style={styles.unitToggleRow}>
              <Pressable
                onPress={() => setImperial(true)}
                style={[styles.unitToggle, imperial && styles.unitToggleActive]}
              >
                <Text
                  style={[
                    styles.unitToggleText,
                    imperial && styles.unitToggleTextActive,
                  ]}
                >
                  Imperial
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setImperial(false)}
                style={[styles.unitToggle, !imperial && styles.unitToggleActive]}
              >
                <Text
                  style={[
                    styles.unitToggleText,
                    !imperial && styles.unitToggleTextActive,
                  ]}
                >
                  Metric
                </Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Height</Text>
            {imperial ? (
              <View style={styles.dualInputRow}>
                <View style={styles.dualInputCol}>
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
                <View style={styles.dualInputCol}>
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
            ) : (
              <TextInput
                style={styles.input}
                value={heightCm}
                onChangeText={setHeightCm}
                placeholder="cm"
                placeholderTextColor={Colors.textHint}
                keyboardType="numeric"
                inputMode="numeric"
              />
            )}

            <Text style={styles.label}>Weight</Text>
            <TextInput
              style={styles.input}
              value={weightVal}
              onChangeText={setWeightVal}
              placeholder={imperial ? 'lbs' : 'kg'}
              placeholderTextColor={Colors.textHint}
              keyboardType="numeric"
              inputMode="decimal"
            />
          </>
        ) : null}

        {step === 3 ? (
          <>
            <Text style={styles.stepHint}>
              Used for a more accurate protein target. Skip if unsure.
            </Text>
            <Text style={styles.label}>Body fat %</Text>
            <TextInput
              style={styles.input}
              value={bodyFat}
              onChangeText={setBodyFat}
              placeholder="e.g. 18"
              placeholderTextColor={Colors.textHint}
              keyboardType="numeric"
              inputMode="decimal"
            />
            <Pressable
              onPress={() => setShowBfInfo((v) => !v)}
              style={styles.infoToggle}
            >
              <Text style={styles.infoToggleText}>
                Don&apos;t know your body fat %?
              </Text>
            </Pressable>
            {showBfInfo ? (
              <Text style={styles.infoBody}>
                If you skip this, we estimate lean mass using a typical body
                fat percentage for your sex (15% for men, 25% for women) and
                use the Mifflin-St Jeor BMR formula.
              </Text>
            ) : null}
            <Pressable
              onPress={() => {
                setBodyFat('');
                setError(null);
                setStep(4);
              }}
              style={styles.skipBtn}
            >
              <Text style={styles.skipBtnText}>Skip this step</Text>
            </Pressable>
          </>
        ) : null}

        {step === 4 ? (
          <View style={styles.optList}>
            {ACTIVITY_OPTS.map((opt) => {
              const active = activity === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setActivity(opt.key)}
                  style={[styles.optRow, active && styles.optRowActive]}
                  accessibilityRole="button"
                >
                  <View style={styles.optRowBody}>
                    <Text
                      style={[
                        styles.optRowLabel,
                        active && styles.optRowLabelActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    <Text style={styles.optRowDesc}>{opt.desc}</Text>
                  </View>
                  {active ? (
                    <Feather name="check" size={18} color={Colors.accentLight} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {step === 5 ? (
          <View style={styles.goalGrid}>
            {GOAL_OPTS.map((opt) => {
              const active = goal === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setGoal(opt.key)}
                  style={[styles.goalCard, active && styles.goalCardActive]}
                  accessibilityRole="button"
                >
                  <Feather
                    name={opt.icon as keyof typeof Feather.glyphMap}
                    size={20}
                    color={active ? Colors.accentLight : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.goalLabel,
                      active && styles.goalLabelActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text style={styles.goalDesc}>{opt.desc}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {step === 6 ? (
          <>
            <Text style={styles.stepHint}>Adjusts your macro split</Text>
            <View style={styles.dietWrap}>
              {DIET_OPTS.map((opt) => {
                const active = diet === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setDiet(opt.key)}
                    style={[styles.dietChip, active && styles.dietChipActive]}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.dietChipText,
                        active && styles.dietChipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.dietDesc}>
              {DIET_OPTS.find((d) => d.key === diet)?.desc}
            </Text>
          </>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={styles.primaryBtn}
          onPress={next}
          accessibilityRole="button"
        >
          <Text style={styles.primaryBtnText}>
            {step === MACRO_TOTAL_STEPS ? 'Calculate' : 'Continue'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function MacroCard({
  label,
  value,
  tint,
}: {
  label: string;
  value: string;
  tint: string;
}) {
  return (
    <View style={styles.macroCard}>
      <Text style={[styles.macroCardValue, { color: tint }]}>{value}</Text>
      <Text style={styles.macroCardLabel}>{label}</Text>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kvRow}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue}>{value}</Text>
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
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.trackMuted,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  stepCount: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 14,
  },
  stepTitle: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 16,
  },
  stepHint: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  dualInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dualInputCol: {
    flex: 1,
  },
  unitToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },
  unitToggle: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  unitToggleActive: {
    borderColor: Colors.borderAccent,
    backgroundColor: Colors.accentSoft,
  },
  unitToggleText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  unitToggleTextActive: {
    color: Colors.accentLight,
  },
  choiceGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  choiceCard: {
    flex: 1,
    paddingVertical: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  choiceCardActive: {
    borderColor: Colors.borderAccent,
    backgroundColor: Colors.accentSoft,
  },
  choiceLabel: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  choiceLabelActive: {
    color: Colors.accentLight,
  },
  infoToggle: {
    paddingVertical: 10,
  },
  infoToggleText: {
    color: Colors.accentLight,
    fontSize: 13,
    fontWeight: '600',
  },
  infoBody: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 6,
  },
  skipBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  skipBtnText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  optList: {
    gap: 10,
  },
  optRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  optRowActive: {
    borderColor: Colors.borderAccent,
    borderLeftColor: Colors.accent,
    backgroundColor: Colors.accentSoft,
  },
  optRowBody: {
    flex: 1,
    gap: 3,
  },
  optRowLabel: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  optRowLabelActive: {
    color: Colors.accentLight,
  },
  optRowDesc: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  goalGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  goalCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 8,
  },
  goalCardActive: {
    borderColor: Colors.borderAccent,
    backgroundColor: Colors.accentSoft,
  },
  goalLabel: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  goalLabelActive: {
    color: Colors.accentLight,
  },
  goalDesc: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  dietWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dietChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  dietChipActive: {
    borderColor: Colors.borderAccent,
    backgroundColor: Colors.accentSoft,
  },
  dietChipText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  dietChipTextActive: {
    color: Colors.accentLight,
  },
  dietDesc: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 14,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    marginTop: 16,
  },
  saveError: {
    color: Colors.error,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: -8,
  },
  primaryBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  resultHero: {
    backgroundColor: Colors.accentSoft,
    borderColor: Colors.borderAccent,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
    marginTop: 6,
  },
  resultHeroLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  resultHeroValue: {
    color: Colors.textPrimary,
    fontSize: 46,
    fontWeight: '800',
    marginTop: 4,
  },
  resultHeroUnit: {
    color: Colors.accentLight,
    fontSize: 14,
    fontWeight: '600',
  },
  resultHeroMeta: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  macroCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  macroCardValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  macroCardLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
  },
  tableHeading: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  kvLabel: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  kvValue: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
});
