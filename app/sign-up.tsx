import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Calendar,
  Check,
  Lock,
  Mail,
  Ruler,
  Sparkles,
  Target,
  User,
  Weight,
} from 'lucide-react-native';
import { DS, Font, Radius } from '../lib/design-system';
import {
  cacheFirstName,
  isBiometricAvailable,
} from '../lib/biometric-store';
import { checkEmailAvailable, register } from '../lib/auth-api';
import AuthShell from '../components/auth/AuthShell';
import AuthField from '../components/auth/AuthField';
import PrimaryButton from '../components/auth/PrimaryButton';
import RegisterStepHeader from '../components/auth/RegisterStepHeader';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --------------------------------------------------------------------------
// Shared state (memory only — survives between in-flow nav, not app launches)
// --------------------------------------------------------------------------

type Step1 = { firstName: string; email: string; password: string };
type Step2 = {
  units: 'imperial' | 'metric';
  sex: 'male' | 'female' | null;
  dob: string;
  heightFt: string;
  heightIn: string;
  heightCm: string;
  weight: string;
};
type Step3 = {
  goal: 'cut' | 'maintain' | 'bulk' | null;
  activity: 'sedentary' | 'light' | 'moderate' | 'high' | null;
  targetWeight: string;
};

export default function SignUpScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [step1, setStep1] = useState<Step1>({
    firstName: '',
    email: '',
    password: '',
  });
  const [step2, setStep2] = useState<Step2>({
    units: 'imperial',
    sex: null,
    dob: '',
    heightFt: '',
    heightIn: '',
    heightCm: '',
    weight: '',
  });
  const [step3, setStep3] = useState<Step3>({
    goal: null,
    activity: null,
    targetWeight: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleBack() {
    if (step === 1) {
      router.replace('/sign-in');
      return;
    }
    setStep((s) => (s === 3 ? 2 : 1));
  }

  function goNextStep() {
    setStep((s) => (s === 1 ? 2 : s === 2 ? 3 : 3));
  }

  async function finalSubmit() {
    setError(null);
    setSubmitting(true);
    const payload = buildPayload(step1, step2, step3);
    const result = await register(payload);
    setSubmitting(false);
    if (result.error) {
      if (result.error.code === 'email_exists') setStep(1);
      setError(result.error.message);
      return;
    }
    if (result.user?.firstName) {
      await cacheFirstName(result.user.firstName);
    }
    const biometric = await isBiometricAvailable();
    router.replace(biometric ? '/enable-face-id' : '/');
  }

  return (
    <AuthShell>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <RegisterStepHeader
            step={step}
            onBack={handleBack}
            onSkip={
              step === 1
                ? undefined
                : () => (step === 2 ? setStep(3) : void finalSubmit())
            }
            showSkip={step !== 1}
          />

          {step === 1 ? (
            <Step1View
              data={step1}
              onChange={setStep1}
              onContinue={async () => {
                setError(null);
                const next = await validateStep1(step1);
                if (next) {
                  setError(next);
                  return;
                }
                goNextStep();
              }}
              error={error}
              onSignIn={() => router.replace('/sign-in')}
            />
          ) : step === 2 ? (
            <Step2View
              data={step2}
              onChange={setStep2}
              onContinue={goNextStep}
            />
          ) : (
            <Step3View
              data={step3}
              onChange={setStep3}
              onCreate={finalSubmit}
              submitting={submitting}
              error={error}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthShell>
  );
}

// --------------------------------------------------------------------------
// Step 1 — basics
// --------------------------------------------------------------------------

function Step1View({
  data,
  onChange,
  onContinue,
  error,
  onSignIn,
}: {
  data: Step1;
  onChange: (s: Step1) => void;
  onContinue: () => void;
  error: string | null;
  onSignIn: () => void;
}) {
  const strength = useMemo(() => scorePassword(data.password), [data.password]);
  const { pct, label, color } = strengthMeta(strength);

  const canContinue =
    data.firstName.trim().length >= 1 &&
    EMAIL_RE.test(data.email.trim()) &&
    data.password.length >= 8 &&
    strength >= 2;

  return (
    <View style={styles.body}>
      <Text style={styles.eyebrow}>STEP 1 · THE BASICS</Text>
      <Text style={styles.headline}>Let's get you set up.</Text>
      <Text style={styles.sub}>
        Just a few details. You can finish the rest later.
      </Text>

      <View style={styles.form}>
        <AuthField
          label="First name"
          Icon={User}
          value={data.firstName}
          onChangeText={(v) => onChange({ ...data, firstName: v })}
          placeholder="Logan"
          autoCapitalize="words"
          autoComplete="given-name"
          textContentType="givenName"
          returnKeyType="next"
        />
        <AuthField
          label="Email"
          Icon={Mail}
          value={data.email}
          onChangeText={(v) => onChange({ ...data, email: v })}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
        />
        <View>
          <AuthField
            label="Password"
            Icon={Lock}
            value={data.password}
            onChangeText={(v) => onChange({ ...data, password: v })}
            placeholder="At least 8 characters"
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="done"
            rightLabel={label ? { text: label, color } : undefined}
          />
          <View style={styles.strengthTrack}>
            <View
              style={[
                styles.strengthFill,
                {
                  width: `${pct}%`,
                  backgroundColor: color,
                  shadowOpacity: pct === 100 ? 0.5 : 0,
                },
              ]}
            />
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.terms}>
          By continuing, you agree to MacroVault's{' '}
          <Text style={styles.termsBold}>Terms</Text> and{' '}
          <Text style={styles.termsBold}>Privacy Policy</Text>. We won't share
          your data, ever.
        </Text>

        <View style={{ marginTop: 8 }}>
          <PrimaryButton
            label="Continue"
            onPress={onContinue}
            disabled={!canContinue}
            RightIcon={ArrowRight}
          />
        </View>
      </View>

      <View style={styles.bottomLinkRow}>
        <Text style={styles.bottomLinkLeft}>Already have an account?</Text>
        <Pressable onPress={onSignIn} hitSlop={6}>
          <Text style={styles.bottomLinkAccent}>Sign in</Text>
        </Pressable>
      </View>
    </View>
  );
}

// --------------------------------------------------------------------------
// Step 2 — body basics
// --------------------------------------------------------------------------

function Step2View({
  data,
  onChange,
  onContinue,
}: {
  data: Step2;
  onChange: (s: Step2) => void;
  onContinue: () => void;
}) {
  return (
    <View style={styles.body}>
      <Text style={styles.eyebrow}>STEP 2 · ABOUT YOU</Text>
      <Text style={styles.headline}>Your body basics.</Text>
      <Text style={styles.sub}>We use these to calculate accurate macros.</Text>

      <View style={styles.form}>
        <View>
          <Text style={styles.label}>UNITS</Text>
          <View style={styles.segmentWrap}>
            {(['imperial', 'metric'] as const).map((u) => {
              const active = data.units === u;
              return (
                <Pressable
                  key={u}
                  onPress={() => onChange({ ...data, units: u })}
                  style={[styles.segment, active && styles.segmentActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text
                    style={[
                      styles.segmentLabel,
                      active && styles.segmentLabelActive,
                    ]}
                  >
                    {u === 'imperial' ? 'Imperial (lb / ft)' : 'Metric (kg / cm)'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View>
          <Text style={styles.label}>SEX AT BIRTH</Text>
          <View style={styles.sexRow}>
            {(['male', 'female'] as const).map((s) => {
              const active = data.sex === s;
              return (
                <Pressable
                  key={s}
                  onPress={() => onChange({ ...data, sex: s })}
                  style={[styles.sexCard, active && styles.sexCardActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text
                    style={[
                      styles.sexLabel,
                      active && styles.sexLabelActive,
                    ]}
                  >
                    {s === 'male' ? 'Male' : 'Female'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.helper}>Used for BMR estimation only</Text>
        </View>

        <AuthField
          label="Date of birth"
          Icon={Calendar}
          value={data.dob}
          onChangeText={(v) => onChange({ ...data, dob: v })}
          placeholder="MM / DD / YYYY"
          keyboardType="number-pad"
        />

        <View>
          <Text style={styles.label}>HEIGHT</Text>
          {data.units === 'imperial' ? (
            <View style={styles.heightRow}>
              <UnitField
                value={data.heightFt}
                onChangeText={(v) => onChange({ ...data, heightFt: v })}
                suffix="ft"
                keyboardType="number-pad"
              />
              <UnitField
                value={data.heightIn}
                onChangeText={(v) => onChange({ ...data, heightIn: v })}
                suffix="in"
                keyboardType="number-pad"
              />
            </View>
          ) : (
            <UnitField
              value={data.heightCm}
              onChangeText={(v) => onChange({ ...data, heightCm: v })}
              suffix="cm"
              Icon={Ruler}
              keyboardType="number-pad"
            />
          )}
        </View>

        <View>
          <Text style={styles.label}>CURRENT WEIGHT</Text>
          <UnitField
            value={data.weight}
            onChangeText={(v) => onChange({ ...data, weight: v })}
            suffix={data.units === 'imperial' ? 'lb' : 'kg'}
            Icon={Weight}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={{ marginTop: 8 }}>
          <PrimaryButton
            label="Continue"
            onPress={onContinue}
            RightIcon={ArrowRight}
          />
        </View>
      </View>
    </View>
  );
}

function UnitField({
  value,
  onChangeText,
  suffix,
  Icon,
  keyboardType,
}: {
  value: string;
  onChangeText: (v: string) => void;
  suffix: string;
  Icon?: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  keyboardType?: 'decimal-pad' | 'number-pad';
}) {
  return (
    <View style={styles.unitField}>
      {Icon ? <Icon size={16} color={DS.textTertiary} strokeWidth={2} /> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? 'decimal-pad'}
        style={styles.unitInput}
        placeholder="0"
        placeholderTextColor="#555"
        selectTextOnFocus
      />
      <Text style={styles.unitSuffix}>{suffix}</Text>
    </View>
  );
}

// --------------------------------------------------------------------------
// Step 3 — goal + activity
// --------------------------------------------------------------------------

function Step3View({
  data,
  onChange,
  onCreate,
  submitting,
  error,
}: {
  data: Step3;
  onChange: (s: Step3) => void;
  onCreate: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const goalOpts: {
    key: NonNullable<Step3['goal']>;
    label: string;
    desc: string;
    emoji: string;
  }[] = [
    { key: 'cut', label: 'Cut', desc: 'Lose fat, keep muscle', emoji: '🔥' },
    {
      key: 'maintain',
      label: 'Maintain',
      desc: 'Hold your current weight',
      emoji: '⚖️',
    },
    { key: 'bulk', label: 'Bulk', desc: 'Build muscle, gain size', emoji: '💪' },
  ];
  const activityOpts: {
    key: NonNullable<Step3['activity']>;
    label: string;
    desc: string;
  }[] = [
    { key: 'sedentary', label: 'Sedentary', desc: 'Mostly sitting' },
    { key: 'light', label: 'Light', desc: '1–3 days/wk' },
    { key: 'moderate', label: 'Moderate', desc: '3–5 days/wk' },
    { key: 'high', label: 'High', desc: '6–7 days/wk' },
  ];
  const showTarget = data.goal === 'cut' || data.goal === 'bulk';

  return (
    <View style={styles.body}>
      <Text style={styles.eyebrow}>STEP 3 · YOUR GOAL</Text>
      <Text style={styles.headline}>What are you after?</Text>
      <Text style={styles.sub}>
        We'll calibrate your daily targets to match.
      </Text>

      <View style={[styles.form, { gap: 16 }]}>
        <View style={styles.goalCol}>
          {goalOpts.map((g) => {
            const active = data.goal === g.key;
            return (
              <Pressable
                key={g.key}
                onPress={() => onChange({ ...data, goal: g.key })}
                style={[styles.goalCard, active && styles.goalCardActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={styles.goalEmoji}>{g.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.goalLabel}>{g.label}</Text>
                  <Text
                    style={[styles.goalDesc, active && { color: DS.accent }]}
                  >
                    {g.desc}
                  </Text>
                </View>
                <View
                  style={[
                    styles.checkCircle,
                    active && styles.checkCircleActive,
                  ]}
                >
                  {active ? (
                    <Check size={12} color="#000" strokeWidth={3} />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View>
          <Text style={styles.label}>ACTIVITY LEVEL</Text>
          <View style={styles.activityGrid}>
            {activityOpts.map((a) => {
              const active = data.activity === a.key;
              return (
                <Pressable
                  key={a.key}
                  onPress={() => onChange({ ...data, activity: a.key })}
                  style={[styles.activityCard, active && styles.goalCardActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text
                    style={[
                      styles.activityLabel,
                      active && { color: DS.accent },
                    ]}
                  >
                    {a.label}
                  </Text>
                  <Text style={styles.activityDesc}>{a.desc}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {showTarget ? (
          <View>
            <Text style={styles.label}>TARGET WEIGHT (OPTIONAL)</Text>
            <UnitField
              value={data.targetWeight}
              onChangeText={(v) => onChange({ ...data, targetWeight: v })}
              suffix="lb"
              Icon={Target}
              keyboardType="decimal-pad"
            />
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={{ marginTop: 8 }}>
          <PrimaryButton
            label={submitting ? 'Creating…' : 'Create account'}
            onPress={onCreate}
            loading={submitting}
            LeftIcon={Sparkles}
          />
        </View>
      </View>
    </View>
  );
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function scorePassword(p: string): number {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

function strengthMeta(score: number) {
  if (score === 0) return { pct: 0, label: '', color: DS.textTertiary };
  if (score === 1) return { pct: 25, label: 'Weak', color: '#A87C5E' };
  if (score === 2) return { pct: 50, label: 'Fair', color: '#A87C5E' };
  if (score === 3) return { pct: 75, label: 'Good', color: '#6EE7B7' };
  return { pct: 100, label: 'Strong', color: DS.accent };
}

async function validateStep1(s: Step1): Promise<string | null> {
  if (!s.firstName.trim()) return 'Enter your first name.';
  if (!EMAIL_RE.test(s.email.trim())) return 'Enter a valid email.';
  if (s.password.length < 8) return 'Password must be at least 8 characters.';
  const check = await checkEmailAvailable(s.email);
  if (!check.available) {
    return 'An account with this email already exists. Sign in instead?';
  }
  return null;
}

function buildPayload(s1: Step1, s2: Step2, s3: Step3) {
  const heightInches =
    s2.units === 'imperial' && (s2.heightFt || s2.heightIn)
      ? (Number(s2.heightFt) || 0) * 12 + (Number(s2.heightIn) || 0)
      : null;
  const heightCm =
    s2.units === 'metric' && s2.heightCm ? Number(s2.heightCm) : null;
  const weight = s2.weight ? Number(s2.weight) : null;
  const target = s3.targetWeight ? Number(s3.targetWeight) : null;
  return {
    firstName: s1.firstName.trim(),
    email: s1.email.trim(),
    password: s1.password,
    profile: {
      units: s2.units,
      sex: s2.sex,
      dateOfBirth: s2.dob ? toIsoDate(s2.dob) : null,
      heightInches: heightInches && heightInches > 0 ? heightInches : null,
      heightCm: heightCm && heightCm > 0 ? heightCm : null,
      weightLb: s2.units === 'imperial' ? weight : null,
      weightKg: s2.units === 'metric' ? weight : null,
      goal: s3.goal,
      activityLevel: s3.activity,
      targetWeightLb: s2.units === 'imperial' ? target : null,
      targetWeightKg: s2.units === 'metric' ? target : null,
    },
  } as const;
}

function toIsoDate(mmddyyyy: string): string | null {
  const cleaned = mmddyyyy.replace(/\s/g, '');
  const m = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, mm, dd, yyyy] = m;
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

// --------------------------------------------------------------------------
// Styles
// --------------------------------------------------------------------------

const styles = StyleSheet.create({
  kav: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32 },
  body: { flex: 1, paddingTop: 24 },
  eyebrow: {
    fontFamily: Font.bold,
    fontSize: 10,
    color: DS.accent,
    letterSpacing: 2,
  },
  headline: {
    marginTop: 6,
    fontFamily: Font.bold,
    fontSize: 26,
    color: DS.text,
    letterSpacing: -0.5,
  },
  sub: {
    marginTop: 6,
    fontFamily: Font.medium,
    fontSize: 13,
    color: DS.textSecondary,
  },
  form: { marginTop: 24, gap: 14 },
  label: {
    fontFamily: Font.bold,
    fontSize: 10,
    color: DS.textTertiary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  helper: {
    marginTop: 6,
    fontFamily: Font.medium,
    fontSize: 10,
    color: DS.textQuaternary,
  },
  error: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: '#A87C5E',
  },
  terms: {
    fontFamily: Font.medium,
    fontSize: 10,
    color: DS.textTertiary,
    lineHeight: 15,
  },
  termsBold: {
    fontFamily: Font.bold,
    color: DS.textSecondary,
  },
  strengthTrack: {
    marginTop: 8,
    height: 3,
    borderRadius: 2,
    backgroundColor: DS.border,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
    shadowColor: DS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 4,
  },
  bottomLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
    paddingTop: 12,
  },
  bottomLinkLeft: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.textTertiary,
  },
  bottomLinkAccent: {
    fontFamily: Font.bold,
    fontSize: 12,
    color: DS.accent,
  },
  segmentWrap: {
    flexDirection: 'row',
    padding: 2,
    backgroundColor: DS.surfaceFlat,
    borderWidth: 1,
    borderColor: DS.border,
    borderRadius: 12,
  },
  segment: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  segmentActive: { backgroundColor: DS.accent },
  segmentLabel: {
    fontFamily: Font.bold,
    fontSize: 12,
    color: DS.textTertiary,
  },
  segmentLabelActive: { color: '#000' },
  sexRow: { flexDirection: 'row', gap: 8 },
  sexCard: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS.surface,
    borderWidth: 1,
    borderColor: DS.border,
  },
  sexCardActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  sexLabel: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: DS.textSecondary,
  },
  sexLabelActive: { color: DS.accent },
  heightRow: { flexDirection: 'row', gap: 8 },
  unitField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 48,
    backgroundColor: DS.surface,
    borderWidth: 1,
    borderColor: DS.border,
    borderRadius: 12,
    flex: 1,
  },
  unitInput: {
    flex: 1,
    color: DS.text,
    fontFamily: Font.medium,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  unitSuffix: {
    fontFamily: Font.bold,
    fontSize: 12,
    color: DS.textTertiary,
  },
  goalCol: { gap: 8 },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: DS.surface,
    borderWidth: 1,
    borderColor: DS.border,
    borderRadius: Radius.card,
  },
  goalCardActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  goalEmoji: { fontSize: 22 },
  goalLabel: {
    fontFamily: Font.bold,
    fontSize: 15,
    color: DS.text,
  },
  goalDesc: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DS.textTertiary,
    marginTop: 2,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    backgroundColor: DS.accent,
    borderColor: DS.accent,
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityCard: {
    flexBasis: '47%',
    flexGrow: 1,
    padding: 12,
    backgroundColor: DS.surface,
    borderWidth: 1,
    borderColor: DS.border,
    borderRadius: 12,
  },
  activityLabel: {
    fontFamily: Font.bold,
    fontSize: 12,
    color: DS.text,
  },
  activityDesc: {
    fontFamily: Font.medium,
    fontSize: 10,
    color: DS.textTertiary,
    marginTop: 3,
  },
});
