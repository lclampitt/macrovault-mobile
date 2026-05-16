import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';

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
  const initials = getInitials(displayName, email);
  const fontSize = Math.max(11, Math.round(size * 0.36));

  if (variant === 'outlined') {
    return (
      <View
        style={[
          styles.outlined,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: Math.max(2, Math.round(size / 26)),
          },
        ]}
      >
        <Text style={[styles.outlinedText, { fontSize }]}>{initials}</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.filled,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.filledText, { fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  filled: {
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filledText: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  outlined: {
    backgroundColor: Colors.accentSoft,
    borderColor: Colors.borderAccentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlinedText: {
    color: Colors.accentLight,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
