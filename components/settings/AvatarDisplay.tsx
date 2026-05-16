import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme-context';

type Variant = 'filled' | 'outlined';

type Props = {
  email?: string | null;
  displayName?: string | null;
  size?: number;
  variant?: Variant;
};

/**
 * Initials = first 2 chars of displayName (or email local-part) uppercased.
 * Mirrors the web's logic in settings.jsx.
 */
export function getInitials(displayName?: string | null, email?: string | null): string {
  const trimmed = (displayName ?? '').trim();
  const source = trimmed || (email ?? '').split('@')[0] || '?';
  return source.slice(0, 2).toUpperCase();
}

export default function AvatarDisplay({
  email,
  displayName,
  size = 40,
  variant = 'filled',
}: Props) {
  const { theme: c } = useTheme();
  const initials = getInitials(displayName, email);
  const fontSize = Math.max(11, Math.round(size * 0.36));

  if (variant === 'outlined') {
    return (
      <View
        style={[
          styles.center,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: Math.max(2, Math.round(size / 26)),
            backgroundColor: c.accentSoft,
            borderColor: c.borderAccentSoft,
          },
        ]}
      >
        <Text style={[styles.outlinedText, { fontSize, color: c.accentLight }]}>
          {initials}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.center,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: c.accent,
        },
      ]}
    >
      <Text style={[styles.filledText, { fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  filledText: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  outlinedText: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
