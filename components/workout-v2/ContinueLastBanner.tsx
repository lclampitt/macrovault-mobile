import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, Play } from 'lucide-react-native';
import { Font, Radius, Tabular } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';

type Props = {
  name: string;
  elapsedMin: number;
  onResume: () => void;
};

export default function ContinueLastBanner({
  name,
  elapsedMin,
  onResume,
}: Props) {
  const t = useTokens();
  return (
    <View style={styles.outer}>
      <Pressable
        onPress={onResume}
        style={({ pressed }) => [
          styles.banner,
          { backgroundColor: t.primaryTintBg, borderColor: t.primaryTintBorder },
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Continue last workout: ${name}`}
      >
        <View style={[styles.iconBubble, { backgroundColor: t.primary }]}>
          <Play size={14} color={t.textOnPrimary} fill={t.textOnPrimary} strokeWidth={0} />
        </View>
        <View style={styles.body}>
          <Text style={[styles.label, { color: t.primary }]}>CONTINUE LAST WORKOUT</Text>
          <Text style={[styles.title, { color: t.textPrimary }]} numberOfLines={1}>
            {name || 'Untitled workout'}
            <Text style={[styles.elapsed, Tabular, { color: t.textTertiary }]}>
              {' '}· {elapsedMin}m elapsed
            </Text>
          </Text>
        </View>
        <ChevronRight size={16} color={t.primary} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: Radius.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pressed: {
    transform: [{ scale: 0.99 }],
  },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  label: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  title: {
    fontFamily: Font.semibold,
    fontSize: 13,
  },
  elapsed: {
    fontFamily: Font.medium,
    fontSize: 12,
  },
});
