import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth-context';
import { useProfile } from '../../hooks/useProfile';
import { Colors } from '../../constants/Colors';
import AvatarDisplay from '../settings/AvatarDisplay';

export default function HomeHeader() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();

  return (
    <View style={styles.row}>
      <View style={styles.brand}>
        <View style={styles.brandIcon}>
          <Feather name="lock" size={16} color="#FFFFFF" />
        </View>
        <Text style={styles.brandText}>MacroVault</Text>
      </View>

      <View style={styles.right}>
        <Pressable
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Theme"
          onPress={() => console.log('TODO: theme picker')}
        >
          <MaterialCommunityIcons
            name="palette-outline"
            size={18}
            color={Colors.textSecondary}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          hitSlop={8}
          onPress={() => router.push('/settings')}
        >
          <AvatarDisplay
            email={user?.email}
            displayName={profile?.display_name}
            size={32}
            variant="filled"
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.background,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
