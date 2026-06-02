import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowRight,
  Lock,
  Mail,
  ScanFace,
} from 'lucide-react-native';
import { DS, Font } from '../lib/design-system';
import { signIn } from '../lib/auth-api';
import {
  cacheFirstName,
  hasStoredCredentials,
  isBiometricAvailable,
  isFaceIdEnabled,
  readFirstName,
  saveCredentials,
} from '../lib/biometric-store';
import AuthShell from '../components/auth/AuthShell';
import AuthLogo from '../components/auth/AuthLogo';
import AuthField from '../components/auth/AuthField';
import PrimaryButton from '../components/auth/PrimaryButton';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESET_URL = 'https://app.macrovault.com/forgot-password?source=ios';

export default function SignInScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ reason?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faceIdAvailable, setFaceIdAvailable] = useState(false);
  const [headline, setHeadline] = useState('Welcome back.');

  // Personalize headline + show Face ID secondary button if available.
  useEffect(() => {
    void (async () => {
      const name = await readFirstName();
      if (name && name.length <= 10) setHeadline(`Welcome back, ${name}.`);
      const [hw, hasCreds, enabled] = await Promise.all([
        isBiometricAvailable(),
        hasStoredCredentials(),
        isFaceIdEnabled(),
      ]);
      setFaceIdAvailable(hw && hasCreds && enabled);
    })();
  }, []);

  // If we got bumped here because the cached password is stale, surface that.
  const banner =
    params.reason === 'password_changed'
      ? 'Your password has changed. Please sign in again.'
      : null;

  async function handleSubmit() {
    setError(null);
    const e = email.trim();
    if (!EMAIL_RE.test(e)) {
      setError('Enter a valid email.');
      return;
    }
    if (password.length < 1) {
      setError('Enter your password.');
      return;
    }
    setLoading(true);
    const result = await signIn(e, password);
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    if (result.user?.firstName) {
      await cacheFirstName(result.user.firstName);
    }

    // If the user already opted into Face ID, refresh the stored credentials
    // here so the next launch unlocks with the current password. We never
    // surprise-store creds — only when the toggle was on AND Face ID is
    // already enabled.
    if (keepSignedIn && (await isFaceIdEnabled())) {
      await saveCredentials(e, password);
    }

    // AuthGate redirects to "/" when the session lands. If Face ID isn't
    // enabled yet, route them through the opt-in screen first.
    const alreadyEnabled = await isFaceIdEnabled();
    router.replace(alreadyEnabled ? '/' : '/enable-face-id');
  }

  function handleForgot() {
    void Linking.openURL(RESET_URL);
  }

  return (
    <AuthShell>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kav}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoSection}>
            <AuthLogo />
          </View>

          <View style={styles.middle}>
            <Text style={styles.headline}>{headline}</Text>
            <Text style={styles.sub}>Pick up where you left off.</Text>

            {banner ? (
              <View style={styles.banner}>
                <Text style={styles.bannerText}>{banner}</Text>
              </View>
            ) : null}

            <View style={styles.form}>
              <AuthField
                label="Email"
                Icon={Mail}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
              />
              <AuthField
                label="Password"
                Icon={Lock}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={() => void handleSubmit()}
                rightLabel={{ text: 'Forgot?', onPress: handleForgot }}
              />

              {error ? <Text style={styles.fieldError}>{error}</Text> : null}

              <View style={styles.toggleRow}>
                <Switch
                  value={keepSignedIn}
                  onValueChange={setKeepSignedIn}
                  trackColor={{ false: DS.border, true: DS.accent }}
                  thumbColor="#fff"
                  ios_backgroundColor={DS.border}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: keepSignedIn }}
                />
                <Text
                  style={[
                    styles.toggleLabel,
                    !keepSignedIn && { color: DS.textSecondary },
                  ]}
                >
                  Keep me signed in for 30 days
                </Text>
              </View>

              <View style={{ marginTop: 16 }}>
                <PrimaryButton
                  label={loading ? 'Signing in…' : 'Sign in'}
                  onPress={() => void handleSubmit()}
                  loading={loading}
                  RightIcon={ArrowRight}
                />
              </View>

              {faceIdAvailable ? (
                <Pressable
                  onPress={() => router.replace('/face-id')}
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    pressed && { opacity: 0.85 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Sign in with Face ID"
                >
                  <ScanFace size={16} color={DS.accent} strokeWidth={2} />
                  <Text style={styles.secondaryBtnText}>
                    Sign in with Face ID
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.bottom}>
            <View style={styles.registerRow}>
              <Text style={styles.registerLeft}>New here?</Text>
              <Pressable onPress={() => router.push('/sign-up')} hitSlop={6}>
                <Text style={styles.registerLink}>Create an account</Text>
              </Pressable>
            </View>
            <View style={styles.trustRow}>
              <View style={styles.trustDot} />
              <Text style={styles.trustText}>END-TO-END ENCRYPTED</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  logoSection: { alignItems: 'center' },
  middle: { flex: 1, justifyContent: 'center', paddingVertical: 24 },
  headline: {
    fontFamily: Font.bold,
    fontSize: 30,
    color: DS.text,
    letterSpacing: -0.6,
  },
  sub: {
    marginTop: 6,
    fontFamily: Font.medium,
    fontSize: 13,
    color: DS.textSecondary,
  },
  banner: {
    marginTop: 14,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(168, 124, 94, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(168, 124, 94, 0.3)',
  },
  bannerText: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: '#A87C5E',
  },
  form: {
    marginTop: 24,
    gap: 14,
  },
  fieldError: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: '#A87C5E',
    marginTop: -4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  toggleLabel: {
    fontFamily: Font.semibold,
    fontSize: 12,
    color: DS.text,
  },
  secondaryBtn: {
    marginTop: 10,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  secondaryBtnText: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: DS.accent,
  },
  bottom: {
    alignItems: 'center',
    gap: 12,
    paddingTop: 16,
  },
  registerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  registerLeft: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.textTertiary,
  },
  registerLink: {
    fontFamily: Font.bold,
    fontSize: 12,
    color: DS.accent,
  },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trustDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: DS.accent,
  },
  trustText: {
    fontFamily: Font.bold,
    fontSize: 10,
    color: DS.textTertiary,
    letterSpacing: 1.4,
  },
});
