import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { Colors } from '../constants/Colors';
import { ThemedButton } from '../components/ThemedButton';

export default function HomeScreen() {
  const { user } = useAuth();

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>MacroVault</Text>
          <Text style={styles.welcome}>Welcome, {user?.email ?? 'there'}</Text>
          <Text style={styles.muted}>Home dashboard coming in Phase 3</Text>
        </View>
        <ThemedButton title="Sign Out" variant="ghost" onPress={handleSignOut} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  welcome: {
    color: Colors.textPrimary,
    fontSize: 16,
    marginBottom: 6,
  },
  muted: {
    color: Colors.textMuted,
    fontSize: 14,
  },
});
