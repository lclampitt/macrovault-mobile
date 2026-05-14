import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Colors } from '../constants/Colors';
import { AuthCard } from '../components/AuthCard';
import { ThemedInput } from '../components/ThemedInput';
import { ThemedButton } from '../components/ThemedButton';

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignUp() {
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
    });
    setLoading(false);

    if (signUpError) {
      if (signUpError.message === 'User already registered') {
        setError('An account with this email already exists.');
      } else {
        setError(signUpError.message);
      }
      return;
    }

    // Supabase returns a user with empty identities if email already exists
    // (anti-enumeration). Surface a friendly message in that case.
    if (data?.user?.identities?.length === 0) {
      setError('An account with this email already exists.');
      return;
    }

    router.replace({ pathname: '/signup-success', params: { email: trimmedEmail } });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Feather name="lock" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.logoText}>MacroVault</Text>
          </View>

          <AuthCard>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>
              Start using MacroVault to track your body analysis, goals, and workouts.
            </Text>

            <View style={styles.fields}>
              <ThemedInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
              />
              <ThemedInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                textContentType="newPassword"
              />
              <ThemedInput
                placeholder="Confirm password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                textContentType="newPassword"
              />
            </View>

            <ThemedButton
              title="Register"
              loading={loading}
              loadingTitle="Creating account..."
              onPress={handleSignUp}
              style={styles.submitButton}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.switchRow}>
              <Text style={styles.switchMuted}>Already have an account? </Text>
              <Link href="/sign-in" asChild>
                <Pressable>
                  <Text style={styles.switchAccent}>Sign in</Text>
                </Pressable>
              </Link>
            </View>
          </AuthCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 18,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  fields: {
    gap: 10,
    marginBottom: 14,
  },
  submitButton: {
    marginTop: 2,
  },
  error: {
    marginTop: 12,
    color: Colors.error,
    backgroundColor: Colors.errorBg,
    borderColor: Colors.errorBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    fontSize: 13,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 14,
  },
  switchMuted: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  switchAccent: {
    color: Colors.accentLight,
    fontSize: 13,
    fontWeight: '500',
  },
});
