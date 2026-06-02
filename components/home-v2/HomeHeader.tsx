import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, Palette } from 'lucide-react-native';
import { useAuth } from '../../lib/auth-context';
import { useProfile } from '../../hooks/useProfile';
import { Font, Type } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import { getInitials } from '../settings/AvatarDisplay';

type Props = {
  onOpenAppearance: () => void;
};

/**
 * Chrome top bar — emerald rounded-square logo + "MacroVault" wordmark on
 * the left, palette button + emerald initials avatar on the right. Theme-
 * aware so it flips correctly between dark, light, and sakura.
 */
export default function HomeHeader({ onOpenAppearance }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();
  const t = useTokens();
  const initials = getInitials(profile?.display_name, user?.email);

  return (
    <View style={styles.row}>
      <View style={styles.brand}>
        <View style={[styles.logo, { backgroundColor: t.primary }]}>
          <Lock size={18} color={t.textOnPrimary} strokeWidth={2.5} />
        </View>
        <Text style={[Type.wordmark, { color: t.textPrimary }]}>
          MacroVault
        </Text>
      </View>

      <View style={styles.right}>
        <Pressable
          style={({ pressed }) => [
            styles.iconBtn,
            {
              backgroundColor: t.bgCard,
              borderColor: t.borderDefault,
            },
            pressed && styles.iconBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Appearance"
          onPress={onOpenAppearance}
        >
          {/* Use primary text color so the icon is clearly legible against
              both the dark chrome (white icon) and the cream chrome (dark
              icon). textTertiary used to wash it out almost to invisibility
              on the cream page background. */}
          <Palette size={16} color={t.textPrimary} strokeWidth={2} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          hitSlop={8}
          onPress={() => router.push('/settings')}
          style={({ pressed }) => [
            styles.avatar,
            { backgroundColor: t.primary },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={[styles.avatarText, { color: t.textOnPrimary }]}>
            {initials}
          </Text>
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
    // Transparent — the ambient emerald glow rendered behind the chrome
    // in _layout.tsx needs to bleed through this row to eliminate the
    // seam between the header and the screen below it.
    backgroundColor: 'transparent',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Font.bold,
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
