import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme-context';
import type { Theme } from '../../lib/theme';

type Props = {
  kicker: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
};

export default function QuickActionHero({
  kicker,
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
      <LinearGradient
        colors={[c.accentSoft, c.accentSofter]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
      <View style={styles.glow} pointerEvents="none" />

      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons
            name="silverware-fork-knife"
            size={20}
            color={c.accentLight}
          />
        </View>
        <View style={styles.text}>
          <Text style={styles.kicker}>{kicker}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.sub}>{subtitle}</Text>
        </View>
        <Feather name="arrow-right" size={18} color={c.accentLight} />
      </View>
    </Pressable>
  );
}

function makeStyles(c: Theme) {
  return StyleSheet.create({
    card: {
      width: '100%',
      backgroundColor: c.surface,
      borderColor: c.borderAccentSoft,
      borderWidth: 1,
      borderRadius: 14,
      overflow: 'hidden',
      position: 'relative',
    },
    cardPressed: {
      borderColor: c.borderAccent,
    },
    gradient: {
      ...StyleSheet.absoluteFillObject,
    },
    glow: {
      position: 'absolute',
      top: -20,
      right: -20,
      width: 180,
      height: 100,
      borderRadius: 999,
      backgroundColor: c.accentSofter,
      opacity: 0.7,
    },
    body: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 16,
      paddingHorizontal: 18,
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 10,
      backgroundColor: c.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      flex: 1,
      minWidth: 0,
    },
    kicker: {
      color: c.accentLight,
      fontSize: 9,
      letterSpacing: 0.9,
      textTransform: 'uppercase',
      marginBottom: 2,
      fontWeight: '600',
    },
    title: {
      color: c.textPrimary,
      fontSize: 17,
      fontWeight: '600',
      letterSpacing: -0.2,
      lineHeight: 20,
    },
    sub: {
      color: c.textMuted,
      fontSize: 11,
      marginTop: 2,
    },
  });
}
