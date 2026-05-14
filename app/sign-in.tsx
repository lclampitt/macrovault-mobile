import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Colors } from '../constants/Colors';
import { AuthCard } from '../components/AuthCard';
import { ThemedInput } from '../components/ThemedInput';
import { ThemedButton } from '../components/ThemedButton';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setError(null);
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      if (signInError.message === 'Email not confirmed') {
        setError('Please confirm your email before signing in.');
      } else {
        setError(signInError.message);
      }
    }
  }

  function handleForgotPassword() {
    Alert.alert('Coming soon', 'Password reset will be available in a future update.');
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
            <Text style={styles.title}>Sign in</Text>
            <Text style={styles.subtitle}>
              Welcome back! Sign in to access your analysis, goals, and progress.
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
                autoComplete="current-password"
                textContentType="password"
              />
            </View>

            <ThemedButton
              title="Sign In"
              loading={loading}
              loadingTitle="Signing in..."
              onPress={handleSignIn}
              style={styles.submitButton}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable onPress={handleForgotPassword} style={styles.forgotWrap}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            <View style={styles.switchRow}>
              <Text style={styles.switchMuted}>No account? </Text>
              <Link href="/sign-up" asChild>
                <Pressable>
                  <Text style={styles.switchAccent}>Register here</Text>
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
  forgotWrap: {
    alignSelf: 'center',
    marginTop: 14,
    paddingVertical: 4,
  },
  forgotText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
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
