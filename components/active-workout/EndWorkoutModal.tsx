import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';

type Props = {
  visible: boolean;
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function EndWorkoutModal({
  visible,
  saving,
  error,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={saving ? undefined : onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>End workout?</Text>
          <Text style={styles.message}>
            Are you sure you want to finish? Your progress will be saved.
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable
            style={[styles.primaryBtn, saving && styles.btnDisabled]}
            onPress={onConfirm}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Finish workout"
          >
            <Text style={styles.primaryText}>
              {saving ? 'Saving…' : 'Finish workout'}
            </Text>
          </Pressable>
          <Pressable
            style={styles.ghostBtn}
            onPress={onCancel}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Keep going"
          >
            <Text style={styles.ghostText}>Keep going</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  error: {
    color: Colors.error,
    fontSize: 13,
    marginBottom: 12,
  },
  primaryBtn: {
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  ghostBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  ghostText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
