import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { ThemedInput } from '../ThemedInput';
import { useBodyCompositionMutations } from '../../hooks/useBodyCompositionMutations';
import DatePickerField from './DatePickerField';

type Props = {
  onSaved: () => void;
};

function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Keep digits + at most one decimal point. */
function sanitizeDecimal(text: string): string {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot === -1) return cleaned;
  return (
    cleaned.slice(0, firstDot + 1) +
    cleaned.slice(firstDot + 1).replace(/\./g, '')
  );
}

type SaveStatus = 'idle' | 'saving' | 'saved';

export default function BodyCompEntryForm({ onSaved }: Props) {
  const [date, setDate] = useState<string>(todayYmd());
  const [weightText, setWeightText] = useState('');
  const [bodyFatText, setBodyFatText] = useState('');
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [formError, setFormError] = useState<string | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { save } = useBodyCompositionMutations();

  const weightNum = weightText.trim() === '' ? NaN : Number(weightText);
  const bfNum = bodyFatText.trim() === '' ? null : Number(bodyFatText);

  const weightValid =
    !Number.isNaN(weightNum) && weightNum >= 50 && weightNum <= 700;
  const bfValid =
    bfNum === null || (!Number.isNaN(bfNum) && bfNum >= 0 && bfNum <= 60);

  const canSave = weightValid && bfValid && status !== 'saving';

  async function handleSave() {
    setFormError(null);
    if (!weightValid) {
      setFormError('Enter a weight between 50 and 700 lbs.');
      return;
    }
    if (!bfValid) {
      setFormError('Body fat % must be between 0 and 60.');
      return;
    }

    setStatus('saving');
    const { error } = await save({
      date,
      weight: weightNum,
      bodyFat: bfNum,
    });

    if (error) {
      setStatus('idle');
      setFormError(error);
      return;
    }

    // Match web: clear weight + BF, keep the date.
    setWeightText('');
    setBodyFatText('');
    setStatus('saved');
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setStatus('idle'), 2000);
    onSaved();
  }

  return (
    <View style={styles.card}>
      <Text style={styles.header}>Add entry</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Date</Text>
        <DatePickerField value={date} onChange={setDate} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Weight (lbs)</Text>
        <ThemedInput
          value={weightText}
          onChangeText={(t) => setWeightText(sanitizeDecimal(t))}
          placeholder="e.g. 180"
          keyboardType="decimal-pad"
          inputMode="decimal"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Body Fat %</Text>
        <ThemedInput
          value={bodyFatText}
          onChangeText={(t) => setBodyFatText(sanitizeDecimal(t))}
          placeholder="e.g. 16.8"
          keyboardType="decimal-pad"
          inputMode="decimal"
        />
      </View>

      {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

      <Pressable
        onPress={handleSave}
        disabled={!canSave}
        style={[
          styles.saveBtn,
          !canSave && styles.saveBtnDisabled,
          status === 'saved' && styles.saveBtnSaved,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Save entry"
      >
        <Text style={styles.saveText}>
          {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved!' : 'Save'}
        </Text>
      </Pressable>

      <Text style={styles.helper}>
        Entries are unique per date — saves will overwrite that day
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 20,
    gap: 14,
  },
  header: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  field: {
    gap: 6,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
  },
  saveBtn: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.accent,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.45,
  },
  saveBtnSaved: {
    borderColor: Colors.accentLight,
  },
  saveText: {
    color: Colors.accentLight,
    fontSize: 15,
    fontWeight: '600',
  },
  helper: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
});
