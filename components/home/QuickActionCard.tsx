import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../lib/theme-context';
import type { Theme } from '../../lib/theme';

type Props = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress?: () => void;
};

export default function QuickActionCard({
  icon,
  title,
  subtitle,
  onPress,
}: Props) {
  const { theme: c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${subtitle}`}
    >
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub} numberOfLines={1}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

function makeStyles(c: Theme) {
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: c.surface,
      borderColor: c.border,
      borderWidth: 1,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardPressed: {
      borderColor: c.borderSubtle,
    },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 9,
      backgroundColor: c.trackMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    title: {
      color: c.textPrimary,
      fontSize: 13,
      fontWeight: '600',
    },
    sub: {
      color: c.textMuted,
      fontSize: 10,
      marginTop: 2,
    },
  });
}
