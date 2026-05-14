import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth-context';
import { Colors } from '../../constants/Colors';

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.center}>
        <Text style={styles.title}>MacroVault</Text>
        <Text style={styles.welcome}>Welcome, {user?.email ?? 'there'}</Text>
        <Text style={styles.muted}>Home dashboard coming in Phase 3b</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
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
