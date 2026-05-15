import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

type Props = {
  kicker: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
};

export default function QuickActionHero({ kicker, title, subtitle, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${subtitle}`}
    >
      <LinearGradient
        colors={['rgba(29, 158, 117, 0.16)', 'rgba(29, 158, 117, 0.00)']}
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
            color={Colors.accentLight}
          />
        </View>
        <View style={styles.text}>
          <Text style={styles.kicker}>{kicker}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.sub}>{subtitle}</Text>
        </View>
        <Feather name="arrow-right" size={18} color={Colors.accentLight} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderColor: Colors.borderAccentSoft,
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  cardPressed: {
    borderColor: Colors.borderAccent,
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
    backgroundColor: 'rgba(29, 158, 117, 0.10)',
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
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    color: Colors.accentLight,
    fontSize: 9,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginBottom: 2,
    fontWeight: '600',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  sub: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
});
