import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AlertTriangle, Trash2 } from 'lucide-react-native';
import { DS, Font } from '../../lib/design-system';

const DELETE_COLOR = '#E5736A';

type Props = {
  visible: boolean;
  /** "Jan 18 · 171.0 lb" — the bit we describe in the body copy. */
  summary: string;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
};

/**
 * Centered confirm dialog with vertically stacked buttons. Mis-tap safety
 * is the whole point of stacking — side-by-side destructive/cancel pairs
 * are easier to fat-finger. Cancel sits below Delete and gets the default
 * focus (per the spec's accessibility note) so quick double-taps cancel
 * rather than delete.
 */
export default function DeleteConfirmDialog({
  visible,
  summary,
  onCancel,
  onConfirm,
  loading,
}: Props) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        {/* Stop pressables inside the dialog from dismissing it. */}
        <Pressable onPress={() => {}}>
          <Animated.View entering={FadeIn.duration(250)} style={styles.dialog}>
            <View style={styles.iconWrap}>
              <AlertTriangle size={20} color={DELETE_COLOR} strokeWidth={2.5} />
            </View>
            <Text style={styles.title}>Delete this entry?</Text>
            <Text style={styles.body}>
              {summary} will be removed. You can undo this for 5 seconds after.
            </Text>

            <Pressable
              onPress={onConfirm}
              disabled={loading}
              style={({ pressed }) => [
                styles.btn,
                styles.btnDelete,
                pressed && { opacity: 0.85 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Delete entry"
            >
              {loading ? (
                <ActivityIndicator color={DELETE_COLOR} size="small" />
              ) : (
                <View style={styles.btnContent}>
                  <Trash2 size={14} color={DELETE_COLOR} strokeWidth={2.5} />
                  <Text style={styles.btnDeleteText}>Delete</Text>
                </View>
              )}
            </Pressable>

            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.btn,
                styles.btnCancel,
                pressed && { opacity: 0.85 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.btnCancelText}>Cancel</Text>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 320,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#0F0F0F',
    borderColor: '#1F1F1F',
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.8,
    shadowOffset: { width: 0, height: 20 },
    shadowRadius: 60,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(229, 115, 106, 0.15)',
    borderColor: 'rgba(229, 115, 106, 0.3)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Font.bold,
    fontSize: 16,
    color: DS.text,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  body: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
  },
  btn: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDelete: {
    backgroundColor: 'rgba(229, 115, 106, 0.15)',
    borderColor: 'rgba(229, 115, 106, 0.4)',
    borderWidth: 1,
  },
  btnCancel: {
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnDeleteText: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: DELETE_COLOR,
  },
  btnCancelText: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: DS.textSecondary,
  },
});
