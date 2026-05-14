import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { AuthCard } from '../components/AuthCard';
import { ThemedButton } from '../components/ThemedButton';

export default function SignupSuccessScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AuthCard>
          <View style={styles.iconWrap}>
            <Feather name="mail" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We sent a confirmation link to {email ?? 'your inbox'}. Tap the link to verify your
            account, then return here to sign in.
          </Text>
          <ThemedButton
            title="Back to sign in"
            onPress={() => router.replace('/sign-in')}
            style={styles.button}
          />
        </AuthCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  button: {
    marginTop: 4,
  },
});
