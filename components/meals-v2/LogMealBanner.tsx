import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import { Font, Radius } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';

type Props = {
  onPress: () => void;
};

/**
 * Primary "Log meal" CTA that lives at the top of the Meals tab. Replaces
 * the floating + button's meal-log responsibility — meal logging is now a
 * Meals-tab action, the FAB is dedicated to starting workouts.
 *
 * Visual: full-width emerald gradient (top→bottom), 1px emerald ring,
 * 32px outer glow. Matches the AI Suggest Week banner's shape but without
 * the shimmer animation — this is a primary action, not a power-feature
 * teaser.
 */
export default function LogMealBanner({ onPress }: Props) {
  const t = useTokens();
  return (
    <View style={styles.outer}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.btn,
          { backgroundColor: t.primary },
          t.shadowPrimaryGlow,
          styles.ring,
          { borderColor: t.primaryBorderStrong },
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Log meal"
      >
        <LinearGradient
          colors={[t.primaryGradientStart, t.primaryGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.contentRow}>
          <Plus size={16} color={t.textOnPrimary} strokeWidth={3} />
          <Text style={[styles.label, { color: t.textOnPrimary }]}>Log meal</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  btn: {
    width: '100%',
    height: 48,
    borderRadius: Radius.cardCompact,
    overflow: 'hidden',
  },
  ring: {
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    fontFamily: Font.bold,
    fontSize: 14,
    letterSpacing: -0.2,
  },
});
