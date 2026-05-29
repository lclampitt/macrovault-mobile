import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, Play } from 'lucide-react-native';
import { DS, Font, Radius, Tabular } from '../../lib/design-system';

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
  return (
    <View style={styles.outer}>
      <Pressable
        onPress={onResume}
        style={({ pressed }) => [styles.banner, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Continue last workout: ${name}`}
      >
        <View style={styles.iconBubble}>
          <Play size={14} color="#000" fill="#000" strokeWidth={0} />
        </View>
        <View style={styles.body}>
          <Text style={styles.label}>CONTINUE LAST WORKOUT</Text>
          <Text style={styles.title} numberOfLines={1}>
            {name || 'Untitled workout'}
            <Text style={[styles.elapsed, Tabular]}> · {elapsedMin}m elapsed</Text>
          </Text>
        </View>
        <ChevronRight size={16} color={DS.accent} strokeWidth={2.5} />
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
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderColor: DS.accentBorder,
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
    backgroundColor: DS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  label: {
    fontFamily: Font.bold,
    fontSize: 10,
    color: DS.accent,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  title: {
    fontFamily: Font.semibold,
    fontSize: 13,
    color: DS.text,
  },
  elapsed: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.textTertiary,
  },
});
