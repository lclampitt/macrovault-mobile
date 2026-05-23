import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useAddFoodLog } from '../../hooks/useAddFoodLog';

type Props = {
  onAdded: () => void;
};

type FieldKey = 'calories' | 'protein' | 'carbs' | 'fat';

const FIELDS: { key: FieldKey; label: string }[] = [
  { key: 'calories', label: 'Calories (kcal)' },
  { key: 'protein', label: 'Protein (g)' },
  { key: 'carbs', label: 'Carbs (g)' },
  { key: 'fat', label: 'Fat (g)' },
];

const EMPTY = { calories: '', protein: '', carbs: '', fat: '' };

export default function ManualEntryForm({ onAdded }: Props) {
  const [form, setForm] = useState<Record<FieldKey, string>>(EMPTY);
  const [mealName, setMealName] = useState('');
  const { add, submitting, error } = useAddFoodLog();

  const calNum = parseFloat(form.calories) || 0;
  // Phase 9b spec: Add entry stays disabled until Calories is entered AND a
  // meal name is entered. (Web is more lenient — see discovery notes.)
  const canSubmit = calNum > 0 && mealName.trim().length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    const result = await add({
      calories: Math.round(calNum),
      protein: Math.round((parseFloat(form.protein) || 0) * 10) / 10,
      carbs: Math.round((parseFloat(form.carbs) || 0) * 10) / 10,
      fat: Math.round((parseFloat(form.fat) || 0) * 10) / 10,
      mealName,
    });
    if (!result.error) {
      setForm(EMPTY);
      setMealName('');
      onAdded();
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        {FIELDS.map(({ key, label }) => (
          <View key={key} style={styles.field}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TextInput
              style={styles.input}
              value={form[key]}
              onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
              placeholder="0"
              placeholderTextColor={Colors.textHint}
              keyboardType="numeric"
              inputMode={key === 'calories' ? 'numeric' : 'decimal'}
            />
          </View>
        ))}
      </View>

      <TextInput
        style={[styles.input, styles.mealInput]}
        value={mealName}
        onChangeText={setMealName}
        placeholder="e.g. Breakfast, Lunch, Snack"
        placeholderTextColor={Colors.textHint}
        maxLength={80}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        onPress={handleSubmit}
        disabled={!canSubmit}
        style={styles.addBtn}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSubmit }}
      >
        {submitting ? (
          <ActivityIndicator size="small" color={Colors.accentLight} />
        ) : (
          <Text
            style={[styles.addBtnText, !canSubmit && styles.addBtnTextDisabled]}
          >
            Add entry
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  field: {
    width: '47%',
    flexGrow: 1,
    gap: 6,
  },
  fieldLabel: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  input: {
    backgroundColor: Colors.surfaceMuted,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  mealInput: {
    marginTop: 2,
  },
  error: {
    color: Colors.error,
    fontSize: 12,
  },
  addBtn: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 44,
    justifyContent: 'center',
  },
  addBtnText: {
    color: Colors.accentLight,
    fontSize: 15,
    fontWeight: '700',
  },
  addBtnTextDisabled: {
    color: Colors.textHint,
  },
});
