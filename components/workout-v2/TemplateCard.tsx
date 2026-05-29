import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Clock, Dumbbell, Layers, Star } from 'lucide-react-native';
import { DS, Font, Radius, Tabular } from '../../lib/design-system';
import type { WorkoutTemplate } from '../../hooks/useWorkoutTemplates';

type Props = {
  template: WorkoutTemplate;
  onPress: () => void;
};

/** Rough minutes estimate per exercise — only used until templates carry a duration. */
const MIN_PER_EXERCISE = 9;

export default function TemplateCard({ template, onPress }: Props) {
  const estMins = Math.max(20, template.exerciseCount * MIN_PER_EXERCISE);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Start ${template.name} template`}
    >
      {template.isFavorite ? (
        <View style={styles.favorite}>
          <Star size={14} color={DS.accent} fill={DS.accent} strokeWidth={0} />
        </View>
      ) : null}
      <View style={styles.iconBubble}>
        <Dumbbell size={16} color={DS.accent} strokeWidth={2} />
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {template.name}
      </Text>
      {template.usageCount > 0 ? (
        <Text style={[styles.subtitle, Tabular]}>
          Used {template.usageCount}×
        </Text>
      ) : (
        <Text style={styles.subtitle}>New template</Text>
      )}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Layers size={10} color={DS.textTertiary} strokeWidth={2} />
          <Text style={[styles.metaText, Tabular]}>{template.exerciseCount}</Text>
        </View>
        <View style={styles.metaItem}>
          <Clock size={10} color={DS.textTertiary} strokeWidth={2} />
          <Text style={[styles.metaText, Tabular]}>{estMins}m</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: DS.surface,
    borderColor: DS.border,
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
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  name: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: DS.text,
    lineHeight: 16,
  },
  subtitle: {
    fontFamily: Font.medium,
    fontSize: 10,
    color: DS.textTertiary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: DS.border,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: Font.semibold,
    fontSize: 10,
    color: DS.textSecondary,
  },
});
