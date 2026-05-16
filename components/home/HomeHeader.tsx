import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth-context';
import { useProfile } from '../../hooks/useProfile';
import { useTheme } from '../../lib/theme-context';
import AvatarDisplay from '../settings/AvatarDisplay';

type Props = {
  onOpenAppearance: () => void;
};

export default function HomeHeader({ onOpenAppearance }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { theme: c } = useTheme();

  return (
    <View style={[styles.row, { backgroundColor: c.background }]}>
      <View style={styles.brand}>
        <View style={[styles.brandIcon, { backgroundColor: c.accent }]}>
          <Feather name="lock" size={16} color="#FFFFFF" />
        </View>
        <Text style={[styles.brandText, { color: c.textPrimary }]}>
          MacroVault
        </Text>
      </View>

      <View style={styles.right}>
        <Pressable
          style={[
            styles.iconButton,
            { backgroundColor: c.surface, borderColor: c.border },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Appearance"
          onPress={onOpenAppearance}
        >
          <MaterialCommunityIcons
            name="palette-outline"
            size={18}
            color={c.textSecondary}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
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
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
