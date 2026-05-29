import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import { DS, Font, Tabular } from '../../lib/design-system';

type Props = {
  visible: boolean;
  currentSeconds: number;
  onCancel: () => void;
  onSave: (seconds: number) => void;
};

const PRESETS = [
  { label: '45s', value: 45 },
  { label: '60s', value: 60 },
  { label: '90s', value: 90 },
  { label: '2m', value: 120 },
  { label: '3m', value: 180 },
  { label: '4m', value: 240 },
  { label: '5m', value: 300 },
];

/**
 * Tap the rest timer to open this — choose a preset (45s → 5m) or type a
 * custom value in seconds. Becomes the new default for subsequent sets too.
 */
export default function RestTimerEditModal({
  visible,
  currentSeconds,
  onCancel,
  onSave,
}: Props) {
  const [selected, setSelected] = useState<number>(currentSeconds);
  const [custom, setCustom] = useState('');

  useEffect(() => {
    if (visible) {
      setSelected(currentSeconds);
      setCustom('');
    }
  }, [visible, currentSeconds]);

  function handleSave() {
    const customN = parseInt(custom, 10);
    const value = Number.isFinite(customN) && customN > 0 ? customN : selected;
    onSave(Math.min(3600, Math.max(5, value)));
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Rest length</Text>
            <Pressable
              onPress={onCancel}
              hitSlop={6}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={12} color={DS.textSecondary} strokeWidth={2} />
            </Pressable>
          </View>

          <Text style={styles.subLabel}>QUICK PICK</Text>
          <View style={styles.chipsWrap}>
            {PRESETS.map((p) => {
              const active = selected === p.value && !custom.trim();
              return (
                <Pressable
                  key={p.value}
                  onPress={() => {
                    setSelected(p.value);
                    setCustom('');
                  }}
                  style={[styles.chip, active && styles.chipActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={p.label}
                >
                  <Text
                    style={[
                      styles.chipText,
                      active && styles.chipTextActive,
                      Tabular,
                    ]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.subLabel}>CUSTOM</Text>
          <View style={styles.customRow}>
            <TextInput
              value={custom}
              onChangeText={setCustom}
              placeholder="e.g. 75"
              placeholderTextColor={DS.textQuaternary}
              keyboardType="number-pad"
              inputMode="numeric"
              style={styles.customInput}
              maxLength={4}
              accessibilityLabel="Custom rest in seconds"
            />
            <Text style={styles.customUnit}>sec</Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.cancelBtn,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [
                styles.saveBtn,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Save rest time"
            >
              <Text style={styles.saveText}>Set timer</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontFamily: Font.bold,
    fontSize: 16,
    color: DS.text,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: DS.surfaceFlat,
    borderColor: DS.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subLabel: {
    fontFamily: Font.bold,
    fontSize: 10,
    color: DS.textTertiary,
    letterSpacing: 0.8,
    marginTop: 6,
    marginBottom: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: DS.surfaceFlat,
    borderColor: DS.border,
    borderWidth: 1,
    minWidth: 52,
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: DS.accent,
    borderColor: DS.accent,
  },
  chipText: {
    fontFamily: Font.bold,
    fontSize: 12,
    color: DS.textSecondary,
  },
  chipTextActive: {
    color: '#000',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: DS.surfaceFlat,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  customInput: {
    flex: 1,
    fontFamily: Font.bold,
    fontSize: 14,
    color: DS.text,
    padding: 0,
    fontVariant: ['tabular-nums'],
  },
  customUnit: {
    fontFamily: Font.semibold,
    fontSize: 11,
    color: DS.textTertiary,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: DS.surfaceFlat,
    borderColor: DS.border,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: DS.textSecondary,
  },
  saveBtn: {
    flex: 1.4,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: DS.accent,
    alignItems: 'center',
  },
  saveText: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: '#000',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
