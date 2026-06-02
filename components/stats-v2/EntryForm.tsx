import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Calendar } from 'lucide-react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Font, Radius, Shadow } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';

type Props = {
  /** YYYY-MM-DD prefilled date — defaults to today on first open. */
  initialDate: string;
  initialWeight: string;
  initialBodyFat: string;
  saving: boolean;
  error?: string | null;
  /** When true, the date input is locked (used by Edit-entry flow). */
  lockDate?: boolean;
  onCancel: () => void;
  onSubmit: (input: {
    date: string;
    weight: number;
    bodyFat: number | null;
  }) => void;
};

function toDate(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fmtLongDate(ymd: string): string {
  return toDate(ymd).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function EntryForm({
  initialDate,
  initialWeight,
  initialBodyFat,
  saving,
  error,
  lockDate,
  onCancel,
  onSubmit,
}: Props) {
  const t = useTokens();
  const [date, setDate] = useState(initialDate);
  const [weight, setWeight] = useState(initialWeight);
  const [bodyFat, setBodyFat] = useState(initialBodyFat);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftDate, setDraftDate] = useState<Date>(() => toDate(initialDate));
  const [validation, setValidation] = useState<string | null>(null);

  function handleSubmit() {
    setValidation(null);
    const wNum = parseFloat(weight);
    if (!wNum || wNum <= 0 || wNum < 50 || wNum > 700) {
      setValidation('Enter a weight between 50 and 700 lb.');
      return;
    }
    let bf: number | null = null;
    if (bodyFat.trim() !== '') {
      const bfNum = parseFloat(bodyFat);
      if (!Number.isFinite(bfNum) || bfNum < 0 || bfNum > 50) {
        setValidation('Body fat must be between 0 and 50%.');
        return;
      }
      bf = bfNum;
    }
    onSubmit({ date, weight: wNum, bodyFat: bf });
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(350)
        .springify()
        .damping(20)}
      style={styles.outer}
    >
      <View style={[styles.card, { backgroundColor: t.bgCard, borderColor: t.primaryTintBorder }]}>
        <LinearGradient
          colors={t.gradientCardTinted}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          pointerEvents="none"
          style={styles.cardBg}
        />

        <View style={styles.header}>
          <Text style={[styles.title, { color: t.textPrimary }]}>New entry</Text>
          <Pressable onPress={onCancel} hitSlop={8}>
            <Text style={[styles.cancel, { color: t.textSecondary }]}>Cancel</Text>
          </Pressable>
        </View>

        {/* Date */}
        <Text style={[styles.label, { color: t.textTertiary }]}>DATE</Text>
        <Pressable
          onPress={() => {
            if (lockDate) return;
            setDraftDate(toDate(date));
            setPickerOpen(true);
          }}
          style={[
            styles.input,
            { backgroundColor: t.bgCard, borderColor: t.borderDefault },
            lockDate && styles.inputDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Date ${fmtLongDate(date)}`}
        >
          <Calendar size={14} color={t.textTertiary} strokeWidth={2} />
          <Text style={[styles.inputValue, { color: t.textPrimary }]}>{fmtLongDate(date)}</Text>
        </Pressable>

        {/* Weight + BF row */}
        <View style={styles.rowGrid}>
          <View style={styles.gridCol}>
            <Text style={[styles.label, { color: t.textTertiary }]}>WEIGHT</Text>
            <View style={[styles.input, { backgroundColor: t.bgCard, borderColor: t.borderDefault }]}>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                placeholder="180"
                placeholderTextColor={t.textTertiary}
                keyboardType="decimal-pad"
                inputMode="decimal"
                style={[styles.numberInput, { color: t.textPrimary }]}
              />
              <Text style={[styles.unit, { color: t.textTertiary }]}>lb</Text>
            </View>
          </View>
          <View style={styles.gridCol}>
            <Text style={[styles.label, { color: t.textTertiary }]}>BODY FAT</Text>
            <View style={[styles.input, { backgroundColor: t.bgCard, borderColor: t.borderDefault }]}>
              <TextInput
                value={bodyFat}
                onChangeText={setBodyFat}
                placeholder="16.8"
                placeholderTextColor={t.textTertiary}
                keyboardType="decimal-pad"
                inputMode="decimal"
                style={[styles.numberInput, { color: t.textPrimary }]}
              />
              <Text style={[styles.unit, { color: t.textTertiary }]}>%</Text>
            </View>
          </View>
        </View>

        {validation ? (
          <Text style={styles.error}>{validation}</Text>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}

        <Pressable
          onPress={handleSubmit}
          disabled={saving}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: t.primary },
            Shadow.emeraldGlow,
            styles.saveBtnRing,
            { borderColor: t.primaryBorderStrong },
            saving && styles.saveBtnDisabled,
            pressed && !saving && styles.saveBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Save entry"
        >
          {saving ? (
            <ActivityIndicator size="small" color={t.textOnPrimary} />
          ) : (
            <Text style={[styles.saveBtnText, { color: t.textOnPrimary }]}>Save entry</Text>
          )}
        </Pressable>

        <Text style={[styles.disclaimer, { color: t.textTertiary }]}>
          Entries are unique per date — saves will overwrite that day
        </Text>
      </View>

      {/* Native date picker modal */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setPickerOpen(false)}
        >
          <Pressable
            style={[styles.modalSheet, { backgroundColor: t.bgCard }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.modalHeader, { borderBottomColor: t.borderDefault }]}>
              <Pressable onPress={() => setPickerOpen(false)} hitSlop={8}>
                <Text style={[styles.modalCancel, { color: t.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Text style={[styles.modalTitle, { color: t.textPrimary }]}>Select date</Text>
              <Pressable
                onPress={() => {
                  setDate(toYmd(draftDate));
                  setPickerOpen(false);
                }}
                hitSlop={8}
              >
                <Text style={[styles.modalDone, { color: t.primary }]}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={draftDate}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              onChange={(_e: DateTimePickerEvent, picked?: Date) => {
                if (picked) setDraftDate(picked);
              }}
              themeVariant={t.statusBarStyle === 'light' ? 'dark' : 'light'}
              textColor={t.textPrimary}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
  cardBg: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontFamily: Font.bold,
    fontSize: 13,
  },
  cancel: {
    fontFamily: Font.semibold,
    fontSize: 11,
  },
  label: {
    fontFamily: Font.semibold,
    fontSize: 10,
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 40,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  inputValue: {
    fontFamily: Font.medium,
    fontSize: 13,
  },
  numberInput: {
    flex: 1,
    fontFamily: Font.bold,
    fontSize: 14,
    padding: 0,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontFamily: Font.semibold,
    fontSize: 11,
  },
  rowGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  gridCol: {
    flex: 1,
  },
  saveBtn: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnRing: {
    borderWidth: 1,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnPressed: {
    transform: [{ scale: 0.98 }],
  },
  saveBtnText: {
    fontFamily: Font.bold,
    fontSize: 13,
  },
  disclaimer: {
    fontFamily: Font.medium,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
  },
  error: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: '#E5736A',
    marginTop: 12,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontFamily: Font.semibold,
    fontSize: 15,
  },
  modalCancel: {
    fontFamily: Font.medium,
    fontSize: 15,
  },
  modalDone: {
    fontFamily: Font.semibold,
    fontSize: 15,
  },
});
