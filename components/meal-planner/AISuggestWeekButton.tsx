import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

/**
 * Phase 10a stub. Real wiring comes in Phase 10c (Pro+ gate + FastAPI call).
 */
export default function AISuggestWeekButton() {
  return (
    <Pressable
      onPress={() =>
        Alert.alert(
          'AI suggest week',
          'Coming soon — Phase 10c. Will generate a full Mon–Sun plan via Claude.',
        )
      }
      style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
      accessibilityRole="button"
      accessibilityLabel="AI suggest week"
    >
      <Feather name="zap" size={13} color="#fff" />
      <Text style={styles.text}>AI suggest week</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.accent,
    borderRadius: 11,
    paddingVertical: 10,
  },
  btnPressed: {
    opacity: 0.9,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
