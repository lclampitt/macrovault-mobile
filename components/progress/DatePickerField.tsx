import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

type Props = {
  value: string; // YYYY-MM-DD
  onChange: (next: string) => void;
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

function longForm(ymd: string): string {
  return toDate(ymd).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function DatePickerField({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(toDate(value));

  function openPicker() {
    setDraft(toDate(value));
    setOpen(true);
  }

  function onPickerChange(_e: DateTimePickerEvent, picked?: Date) {
    if (picked) setDraft(picked);
  }

  function confirm() {
    onChange(toYmd(draft));
    setOpen(false);
  }

  return (
    <>
      <Pressable
        onPress={openPicker}
        style={styles.field}
        accessibilityRole="button"
        accessibilityLabel={`Date: ${longForm(value)}`}
      >
        <Text style={styles.value}>{longForm(value)}</Text>
        <Feather name="calendar" size={16} color={Colors.textSecondary} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <Text style={styles.cancel}>Cancel</Text>
              </Pressable>
              <Text style={styles.sheetTitle}>Select date</Text>
              <Pressable onPress={confirm} hitSlop={8}>
                <Text style={styles.done}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={draft}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              onChange={onPickerChange}
              themeVariant="dark"
              textColor={Colors.textPrimary}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  value: {
    color: Colors.textPrimary,
    fontSize: 15,
  },
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sheetTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  cancel: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
  done: {
    color: Colors.accentLight,
    fontSize: 15,
    fontWeight: '600',
  },
});
