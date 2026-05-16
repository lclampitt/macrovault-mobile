import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { Colors } from '../constants/Colors';
import { ThemedButton } from '../components/ThemedButton';
import ProfileSection from '../components/settings/ProfileSection';
import SubscriptionSection from '../components/settings/SubscriptionSection';

export default function SettingsScreen() {
  const router = useRouter();

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    // AuthGate in app/_layout.tsx redirects to /sign-in when session clears.
  }

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
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ProfileSection />

        <SubscriptionSection />

        <View style={styles.signOutWrap}>
          <ThemedButton title="Sign Out" variant="ghost" onPress={handleSignOut} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerCopy}>
            © 2026 MacroVault. All rights reserved.
          </Text>
          <View style={styles.footerLinks}>
            <Pressable
              onPress={() => console.log('TODO: open Terms of Service')}
              accessibilityRole="link"
              accessibilityLabel="Terms of Service"
              hitSlop={8}
            >
              <Text style={styles.footerLink}>Terms of Service</Text>
            </Pressable>
            <Pressable
              onPress={() => console.log('TODO: open Privacy Policy')}
              accessibilityRole="link"
              accessibilityLabel="Privacy Policy"
              hitSlop={8}
            >
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingBottom: 120, // clearance for the floating bottom navbar
    gap: 20,
  },
  signOutWrap: {
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  footerCopy: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  footerLinks: {
    flexDirection: 'row',
    gap: 20,
  },
  footerLink: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
});
