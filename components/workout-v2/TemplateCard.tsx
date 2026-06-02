import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Clock, Dumbbell, Layers, Star } from 'lucide-react-native';
import { Font, Radius, Tabular } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import type { WorkoutTemplate } from '../../hooks/useWorkoutTemplates';

type Props = {
  template: WorkoutTemplate;
  onPress: () => void;
};

/** Rough minutes estimate per exercise — only used until templates carry a duration. */
const MIN_PER_EXERCISE = 9;

export default function TemplateCard({ template, onPress }: Props) {
  const t = useTokens();
  const estMins = Math.max(20, template.exerciseCount * MIN_PER_EXERCISE);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: t.bgCard, borderColor: t.borderDefault },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Start ${template.name} template`}
    >
      {template.isFavorite ? (
        <View style={styles.favorite}>
          <Star size={14} color={t.primary} fill={t.primary} strokeWidth={0} />
        </View>
      ) : null}
      <View
        style={[
          styles.iconBubble,
          { backgroundColor: t.primaryTintBg, borderColor: t.primaryTintBorder },
        ]}
      >
        <Dumbbell size={16} color={t.primary} strokeWidth={2} />
      </View>
      <Text style={[styles.name, { color: t.textPrimary }]} numberOfLines={2}>
        {template.name}
      </Text>
      {template.usageCount > 0 ? (
        <Text style={[styles.subtitle, Tabular, { color: t.textTertiary }]}>
          Used {template.usageCount}×
        </Text>
      ) : (
        <Text style={[styles.subtitle, { color: t.textTertiary }]}>New template</Text>
      )}
      <View style={[styles.metaRow, { borderTopColor: t.borderDefault }]}>
        <View style={styles.metaItem}>
          <Layers size={10} color={t.textTertiary} strokeWidth={2} />
          <Text style={[styles.metaText, Tabular, { color: t.textSecondary }]}>
            {template.exerciseCount}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Clock size={10} color={t.textTertiary} strokeWidth={2} />
          <Text style={[styles.metaText, Tabular, { color: t.textSecondary }]}>
            {estMins}m
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: 14,
    minHeight: 140,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  favorite: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  name: {
    fontFamily: Font.bold,
    fontSize: 13,
    lineHeight: 16,
  },
  subtitle: {
    fontFamily: Font.medium,
    fontSize: 10,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: Font.semibold,
    fontSize: 10,
  },
});
