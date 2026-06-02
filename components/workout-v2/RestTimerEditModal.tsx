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
import { Font, Tabular } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';

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
  const t = useTokens();
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
      <Pressable
        style={[styles.backdrop, { backgroundColor: t.bgOverlay }]}
        onPress={onCancel}
      >
        <Pressable
          style={[
            styles.modal,
            { backgroundColor: t.bgCard, borderColor: t.borderDefault },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: t.textPrimary }]}>Rest length</Text>
            <Pressable
              onPress={onCancel}
              hitSlop={6}
              style={[
                styles.closeBtn,
                { backgroundColor: t.bgCardElevated, borderColor: t.borderDefault },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={12} color={t.textSecondary} strokeWidth={2} />
            </Pressable>
          </View>

          <Text style={[styles.subLabel, { color: t.textTertiary }]}>QUICK PICK</Text>
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
                  style={[
                    styles.chip,
                    { backgroundColor: t.bgCardElevated, borderColor: t.borderDefault },
                    active && { backgroundColor: t.primary, borderColor: t.primary },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={p.label}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: active ? t.textOnPrimary : t.textSecondary },
                      Tabular,
                    ]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.subLabel, { color: t.textTertiary }]}>CUSTOM</Text>
          <View
            style={[
              styles.customRow,
              { backgroundColor: t.bgCardElevated, borderColor: t.borderDefault },
            ]}
          >
            <TextInput
              value={custom}
              onChangeText={setCustom}
              placeholder="e.g. 75"
              placeholderTextColor={t.textQuaternary}
              keyboardType="number-pad"
              inputMode="numeric"
              style={[styles.customInput, { color: t.textPrimary }]}
              maxLength={4}
              accessibilityLabel="Custom rest in seconds"
            />
            <Text style={[styles.customUnit, { color: t.textTertiary }]}>sec</Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.cancelBtn,
                { backgroundColor: t.bgCardElevated, borderColor: t.borderDefault },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={[styles.cancelText, { color: t.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [
                styles.saveBtn,
                { backgroundColor: t.primary },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Save rest time"
            >
              <Text style={[styles.saveText, { color: t.textOnPrimary }]}>Set timer</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 360,
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
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subLabel: {
    fontFamily: Font.bold,
    fontSize: 10,
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
    borderWidth: 1,
    minWidth: 52,
    alignItems: 'center',
  },
  chipText: {
    fontFamily: Font.bold,
    fontSize: 12,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    padding: 0,
    fontVariant: ['tabular-nums'],
  },
  customUnit: {
    fontFamily: Font.semibold,
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: Font.bold,
    fontSize: 13,
  },
  saveBtn: {
    flex: 1.4,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveText: {
    fontFamily: Font.bold,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
