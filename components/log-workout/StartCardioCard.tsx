import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

export default function StartCardioCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="Start Cardio, treadmill, bike, rowing and more"
    >
      <View style={styles.iconSquare}>
        <Feather name="clock" size={22} color={Colors.cardioIcon} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>Start Cardio</Text>
        <Text style={styles.subtitle}>Treadmill, bike, rowing & more</Text>
      </View>
      <Feather name="chevron-right" size={20} color={Colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    borderColor: Colors.borderAccent,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  pressed: {
    opacity: 0.85,
  },
  iconSquare: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.cardioIconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 13,
  },
});
