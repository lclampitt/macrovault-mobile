import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { ScanFace } from 'lucide-react-native';
import { DS, Font } from '../lib/design-system';
import {
  loadCredentials,
  readFirstName,
  clearCredentials,
  hasStoredCredentials,
} from '../lib/biometric-store';
import { signIn } from '../lib/auth-api';
import AuthShell from '../components/auth/AuthShell';
import AuthLogo from '../components/auth/AuthLogo';

const NAME_MAX = 10;

export default function FaceIdScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Continuous pulse on the Face ID target.
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.02 }],
    shadowOpacity: 0.3 + pulse.value * 0.4,
  }));

  // Personalize the greeting.
  useEffect(() => {
    void (async () => {
      const name = await readFirstName();
      if (name && name.length <= NAME_MAX) setFirstName(name);
    })();
  }, []);

  // Try Face ID. Pulled out so the tap handler + the auto-trigger share it.
  const tryFaceId = useCallback(async () => {
    setError(null);
    setScanning(true);
    try {
      const creds = await loadCredentials();
      if (!creds) {
        setScanning(false);
        return; // user cancelled — they can tap again or use password
      }
      const result = await signIn(creds.email, creds.password);
      if (result.error) {
        // Password may have rotated on web — purge and force fresh sign-in.
        if (result.error.code === 'invalid_credentials') {
          await clearCredentials();
          router.replace({
            pathname: '/sign-in',
            params: { reason: 'password_changed' },
          });
          return;
        }
        setError(result.error.message);
        setScanning(false);
        return;
      }
      // AuthGate picks up the new session and navigates to /.
    } catch (e) {
      console.error('[face-id]', e);
      setError('Something went wrong. Please use your password.');
      setScanning(false);
    }
  }, [router]);

  // Auto-prompt on mount per iOS convention.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const has = await hasStoredCredentials();
      if (cancelled || !has) return;
      // Delay so the screen transition finishes before the system sheet pops.
      setTimeout(() => {
        if (!cancelled) void tryFaceId();
      }, 350);
    })();
    return () => {
      cancelled = true;
    };
  }, [tryFaceId]);

  function usePassword() {
    router.replace('/sign-in');
  }

  return (
    <AuthShell>
      <View style={styles.outer}>
        <View style={styles.logoSection}>
          <AuthLogo secured />
        </View>

        <View style={styles.middle}>
          <Text style={styles.welcome}>Welcome back,</Text>
          <Text style={[styles.welcome, styles.welcomeAccent]}>
            {firstName ? `${firstName}.` : 'friend.'}
          </Text>
          <Text style={styles.sub}>
            Look at your phone to continue, or use your password.
          </Text>

          <Pressable
            onPress={tryFaceId}
            accessibilityRole="button"
            accessibilityLabel="Sign in with Face ID"
            style={({ pressed }) => [
              styles.faceWrap,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Animated.View style={[styles.faceTarget, pulseStyle]}>
              <ScanFace
                size={64}
                color={DS.accent}
                strokeWidth={1.5}
              />
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
            </Animated.View>
          </Pressable>

          <Text style={styles.scanLabel}>
            {scanning ? 'Scanning…' : 'Tap to use Face ID'}
          </Text>
          {error ? <Text style={styles.errorLabel}>{error}</Text> : null}
        </View>

        <View style={styles.bottom}>
          <Pressable onPress={usePassword} hitSlop={10}>
            <Text style={styles.passwordLink}>Use password instead</Text>
          </Pressable>
          <View style={styles.trustRow}>
            <View style={styles.trustDot} />
            <Text style={styles.trustText}>END-TO-END ENCRYPTED</Text>
          </View>
        </View>
      </View>
    </AuthShell>
  );
}

const CORNERS = [
  { top: 12, left: 12, right: undefined, bottom: undefined, rotate: '0deg' },
  { top: 12, right: 12, left: undefined, bottom: undefined, rotate: '90deg' },
  { bottom: 12, right: 12, top: undefined, left: undefined, rotate: '180deg' },
  { bottom: 12, left: 12, top: undefined, right: undefined, rotate: '270deg' },
] as const;

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  logoSection: {
    paddingTop: 28,
    alignItems: 'center',
  },
  middle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcome: {
    fontFamily: Font.bold,
    fontSize: 32,
    color: DS.text,
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  welcomeAccent: {
    color: DS.accent,
    textShadowColor: 'rgba(16, 185, 129, 0.35)',
    textShadowRadius: 16,
  },
  sub: {
    marginTop: 12,
    fontFamily: Font.medium,
    fontSize: 13,
    color: DS.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 19,
  },
  faceWrap: {
    marginTop: 40,
  },
  faceTarget: {
    width: 120,
    height: 120,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: DS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 24,
  },
  corner: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: DS.accent,
  },
  scanLabel: {
    marginTop: 24,
    fontFamily: Font.bold,
    fontSize: 12,
    color: DS.accent,
    letterSpacing: 0.3,
  },
  errorLabel: {
    marginTop: 10,
    fontFamily: Font.medium,
    fontSize: 12,
    color: '#A87C5E',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  bottom: {
    paddingBottom: 28,
    alignItems: 'center',
    gap: 12,
  },
  passwordLink: {
    fontFamily: Font.semibold,
    fontSize: 13,
    color: DS.textSecondary,
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
