import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { DS, Font, Radius } from '../../lib/design-system';

type Props = {
  visible: boolean;
  initialValue: string;
  onClose: () => void;
  onSave: (newName: string) => Promise<{ error: string | null }>;
};

/**
 * Slide-up modal for editing the user's display name. Single-field form —
 * focuses on mount, autocapitalizes words, max 60 chars (matches the
 * `profiles.display_name` constraint inherited from the web schema).
 *
 * Save is disabled when the trimmed value is empty or unchanged. On
 * success the modal closes and the parent's onSave callback is responsible
 * for any downstream refetches (the dashboard's LiveBanner + HomeHeader
 * pick the new value up on focus via useFocusEffect).
 */
export default function EditDisplayNameSheet({
  visible,
  initialValue,
  onClose,
  onSave,
}: Props) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Reset state every time the sheet opens; auto-focus the input shortly
  // after the slide-in animation so the keyboard rises cleanly.
  useEffect(() => {
    if (!visible) return;
    setValue(initialValue);
    setError(null);
    setSaving(false);
    const id = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(id);
  }, [visible, initialValue]);

  const trimmed = value.trim();
  const hasChanges = trimmed.length > 0 && trimmed !== initialValue.trim();
  const canSave = hasChanges && !saving;

  async function handleSave() {
    if (!canSave) return;
    setError(null);
    setSaving(true);
    const r = await onSave(trimmed);
    setSaving(false);
    if (r.error) {
      setError(r.error);
      return;
    }
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <View style={styles.header}>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={18} color={DS.text} strokeWidth={2} />
            </Pressable>
            <Text style={styles.title}>Display name</Text>
            <View style={styles.iconSpacer} />
          </View>

          <View style={styles.body}>
            <Text style={styles.label}>YOUR NAME</Text>
            <Text style={styles.helper}>
              Shown on your dashboard greeting and avatar.
            </Text>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={value}
              onChangeText={setValue}
              placeholder="e.g. Logan"
              placeholderTextColor={DS.textQuaternary}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={60}
              returnKeyType="done"
              onSubmitEditing={handleSave}
              editable={!saving}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              onPress={handleSave}
              disabled={!canSave}
              style={[
                styles.saveBtn,
                !canSave && styles.saveBtnDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Save display name"
            >
              {saving ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: DS.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomColor: DS.border,
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSpacer: { width: 32, height: 32 },
  title: {
    flex: 1,
    fontFamily: Font.bold,
    fontSize: 15,
    color: DS.text,
    textAlign: 'center',
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  label: {
    fontFamily: Font.bold,
    fontSize: 10,
    color: DS.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  helper: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.textTertiary,
    marginBottom: 14,
    lineHeight: 17,
  },
  input: {
    fontFamily: Font.medium,
    fontSize: 15,
    color: DS.text,
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: Radius.cardCompact,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  errorText: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: '#E5736A',
    marginTop: 10,
    textAlign: 'center',
  },
  saveBtn: {
    marginTop: 20,
    backgroundColor: DS.accent,
    borderRadius: Radius.cardCompact,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.45,
  },
  saveBtnText: {
    fontFamily: Font.bold,
    fontSize: 14,
    color: '#000',
  },
});
