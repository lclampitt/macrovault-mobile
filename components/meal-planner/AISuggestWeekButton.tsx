import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

type Props = {
  loading: boolean;
  progress: { done: number; total: number };
  onPress: () => void;
};

export default function AISuggestWeekButton({
  loading,
  progress,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.btn,
        pressed && !loading && styles.btnPressed,
        loading && styles.btnLoading,
      ]}
      accessibilityRole="button"
      accessibilityLabel="AI suggest week"
    >
      {loading ? (
        <>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.text}>
            Generating… {progress.done}/{progress.total}
          </Text>
        </>
      ) : (
        <>
          <Feather name="zap" size={13} color="#fff" />
          <Text style={styles.text}>AI suggest week</Text>
        </>
      )}
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
  btnLoading: {
    opacity: 0.85,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
