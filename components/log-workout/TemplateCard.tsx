import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import type { WorkoutTemplate } from '../../hooks/useWorkoutTemplates';

type Props = {
  template: WorkoutTemplate;
  onPress: () => void;
};

export default function TemplateCard({ template, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${template.name}, ${template.exerciseCount} exercises${
        template.isFavorite ? ', favorite' : ''
      }`}
    >
      <View style={styles.iconSquare}>
        <MaterialCommunityIcons name="dumbbell" size={18} color={Colors.accentLight} />
      </View>
      <Text style={styles.name} numberOfLines={3}>
        {template.name}
      </Text>
      <Text style={styles.count}>
        {template.exerciseCount} exercise{template.exerciseCount !== 1 ? 's' : ''}
      </Text>
      {template.isFavorite ? (
        <View style={styles.favoriteRow}>
          <Feather name="star" size={11} color={Colors.favoriteStar} />
          <Text style={styles.favoriteText}>Favorite</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    minHeight: 132,
  },
  pressed: {
    opacity: 0.85,
  },
  iconSquare: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  count: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  favoriteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  favoriteText: {
    color: Colors.favoriteStar,
    fontSize: 11,
    fontWeight: '600',
  },
});
