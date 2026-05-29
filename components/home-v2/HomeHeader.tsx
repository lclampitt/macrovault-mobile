import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, Target } from 'lucide-react-native';
import { useAuth } from '../../lib/auth-context';
import { useProfile } from '../../hooks/useProfile';
import { DS, Font, Type } from '../../lib/design-system';
import { getInitials } from '../settings/AvatarDisplay';

type Props = {
  onOpenAppearance: () => void;
};

/**
 * New chrome top bar — emerald rounded-square logo + "MacroVault" wordmark
 * on the left, dark target button + emerald initials avatar on the right.
 */
export default function HomeHeader({ onOpenAppearance }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();
  const initials = getInitials(profile?.display_name, user?.email);

  return (
    <View style={styles.row}>
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Lock size={18} color="#000" strokeWidth={2.5} />
        </View>
        <Text style={Type.wordmark}>MacroVault</Text>
      </View>

      <View style={styles.right}>
        <Pressable
          style={({ pressed }) => [
            styles.iconBtn,
            pressed && styles.iconBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Appearance"
          onPress={onOpenAppearance}
        >
          <Target size={16} color={DS.textTertiary} strokeWidth={2} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          hitSlop={8}
          onPress={() => router.push('/settings')}
          style={({ pressed }) => [
            styles.avatar,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.avatarText}>{initials}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const AVATAR_SIZE = 40;
const ICON_BTN_SIZE = 40;
const LOGO_SIZE = 40;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
    backgroundColor: DS.bg,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: 12,
    backgroundColor: DS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: ICON_BTN_SIZE,
    height: ICON_BTN_SIZE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DS.border,
    backgroundColor: DS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPressed: {
    opacity: 0.7,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: DS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Font.bold,
    fontSize: 12,
    color: '#000',
    letterSpacing: 0.2,
  },
});
