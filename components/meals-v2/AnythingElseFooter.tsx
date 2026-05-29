import { Pressable, StyleSheet, Text } from 'react-native';
import { Plus } from 'lucide-react-native';
import { DS, Font, Radius } from '../../lib/design-system';

type Props = {
  onPress: () => void;
};

/** "Anything else to add?" — emerald-tinted secondary CTA. */
export default function AnythingElseFooter({ onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Add another meal"
    >
      <Plus size={14} color={DS.accent} strokeWidth={2.5} />
      <Text style={styles.label}>Anything else to add?</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radius.card,
    backgroundColor: DS.surface,
    borderWidth: 1,
    borderColor: DS.border,
  },
  pressed: {
    transform: [{ scale: 0.99 }],
  },
  label: {
    fontFamily: Font.semibold,
    fontSize: 12,
    color: DS.accent,
  },
});
