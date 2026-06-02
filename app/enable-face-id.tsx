import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Check, Lock, ScanFace, Sparkles } from 'lucide-react-native';
import { DS, Font } from '../lib/design-system';
import {
  isBiometricAvailable,
  loadCredentials,
  peekStoredEmail,
  promptBiometric,
  recordFaceIdDecline,
  saveCredentials,
  setFaceIdEnabled,
} from '../lib/biometric-store';
import AuthShell from '../components/auth/AuthShell';
import AuthLogo from '../components/auth/AuthLogo';
import PrimaryButton from '../components/auth/PrimaryButton';

export default function EnableFaceIdScreen() {
  const router = useRouter();
  const [enabling, setEnabling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If biometric hardware isn't available, skip straight through.
  useEffect(() => {
    void (async () => {
      const ok = await isBiometricAvailable();
      if (!ok) router.replace('/');
    })();
  }, [router]);

  async function handleEnable() {
    setError(null);
    setEnabling(true);
    try {
      // Run a dry-run prompt first — confirms the user actually wants this and
      // that biometry works on the device.
      const ok = await promptBiometric('Enable Face ID for MacroVault');
      if (!ok) {
        setEnabling(false);
        setError("Face ID didn't authorize. You can try again later in Settings.");
        return;
      }

      // We can save credentials only if we have them in memory. In the
      // post-registration flow they're not in memory; we need to ask the
      // user to enter them once OR pull from a temporary holding spot. To
      // keep this build self-contained, we read the most recent email out
      // of secure storage (if any) and fall back to just flagging "Face ID
      // ON" — the next sign-in will store the password.
      //
      // NOTE: Cleanest fix later: thread email+password through the post-
      //   register navigation and save here. For now we set the flag and
      //   rely on the next manual sign-in to populate the Keychain row.
      const existingEmail = await peekStoredEmail();
      if (existingEmail) {
        const creds = await loadCredentials();
        if (creds) await saveCredentials(creds.email, creds.password);
      }
      await setFaceIdEnabled(true);
      router.replace('/');
    } catch (e) {
      console.error('[enable-face-id]', e);
      setError('Something went wrong. Please try again later in Settings.');
    } finally {
      setEnabling(false);
    }
  }

  async function handleSkip() {
    await recordFaceIdDecline();
    router.replace('/');
  }

  return (
    <AuthShell>
      <View style={styles.outer}>
        <View style={styles.logoSection}>
          <AuthLogo compact />
        </View>

        <View style={styles.middle}>
          <View style={styles.faceTarget}>
            <ScanFace size={80} color={DS.accent} strokeWidth={1.5} />
            {CORNERS.map((c, i) => (
              <View
                key={i}
                style={[
                  styles.corner,
                  {
                    top: c.top,
                    bottom: c.bottom,
                    left: c.left,
                    right: c.right,
                    transform: [{ rotate: c.rotate }],
                  },
                ]}
              />
            ))}
          </View>

          <Text style={styles.headline}>
            Sign in faster{'\n'}with Face ID.
          </Text>
          <Text style={styles.sub}>
            Skip your password next time. Your credentials stay encrypted on
            this device only.
          </Text>

          <View style={styles.benefits}>
            {BENEFITS.map((b, i) => (
              <View key={i} style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <b.Icon size={12} color={DS.accent} strokeWidth={2.5} />
                </View>
                <Text style={styles.benefitText}>{b.text}</Text>
              </View>
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <View style={styles.bottom}>
          <PrimaryButton
            label={enabling ? 'Authorizing…' : 'Enable Face ID'}
            onPress={handleEnable}
            loading={enabling}
            LeftIcon={ScanFace}
          />
          <Pressable
            onPress={handleSkip}
            style={styles.skipBtn}
            accessibilityRole="button"
            accessibilityLabel="Skip Face ID for now"
          >
            <Text style={styles.skipText}>Maybe later</Text>
          </Pressable>
        </View>
      </View>
    </AuthShell>
  );
}

const CORNERS = [
  { top: 14, left: 14, right: undefined, bottom: undefined, rotate: '0deg' },
  { top: 14, right: 14, left: undefined, bottom: undefined, rotate: '90deg' },
  { bottom: 14, right: 14, top: undefined, left: undefined, rotate: '180deg' },
  { bottom: 14, left: 14, top: undefined, right: undefined, rotate: '270deg' },
] as const;

const BENEFITS = [
  { Icon: Check, text: 'One-tap sign-in' },
  { Icon: Lock, text: 'Encrypted in iOS Keychain' },
  { Icon: Sparkles, text: 'Never type your password again' },
];

const styles = StyleSheet.create({
  outer: { flex: 1, paddingHorizontal: 24 },
  logoSection: { paddingTop: 24, alignItems: 'center' },
  middle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  faceTarget: {
    width: 140,
    height: 140,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: DS.accent,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 28,
  },
  corner: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: DS.accent,
  },
  headline: {
    fontFamily: Font.bold,
    fontSize: 26,
    color: DS.text,
    letterSpacing: -0.6,
    textAlign: 'center',
    lineHeight: 32,
  },
  sub: {
    fontFamily: Font.medium,
    fontSize: 13,
    color: DS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 300,
  },
  benefits: { gap: 10, alignSelf: 'stretch', alignItems: 'center' },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: 280,
  },
  benefitIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    fontFamily: Font.semibold,
    fontSize: 13,
    color: DS.text,
  },
  error: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: '#A87C5E',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  bottom: {
    paddingBottom: 28,
    gap: 8,
  },
  skipBtn: { height: 44, alignItems: 'center', justifyContent: 'center' },
  skipText: {
    fontFamily: Font.semibold,
    fontSize: 13,
    color: DS.textSecondary,
  },
});
