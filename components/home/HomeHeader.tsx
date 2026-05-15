import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth-context';
import { Colors } from '../../constants/Colors';

function getInitials(email: string | undefined): string {
  if (!email) return 'MV';
  const local = email.split('@')[0] ?? '';
  if (!local) return 'MV';
  return local.slice(0, 2).toUpperCase();
}

export default function HomeHeader() {
  const { user } = useAuth();
  const initials = getInitials(user?.email);

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
          style={styles.avatar}
          accessibilityRole="button"
          accessibilityLabel="Profile"
          onPress={() => console.log('TODO: profile menu')}
        >
          <Text style={styles.avatarText}>{initials}</Text>
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
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
