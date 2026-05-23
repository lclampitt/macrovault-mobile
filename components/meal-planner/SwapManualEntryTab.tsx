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
import type { SwapPayload } from '../../hooks/useMealPlanMutations';

type Props = {
  saving: boolean;
  onAdd: (meal: SwapPayload) => void;
};

type FieldKey = 'calories' | 'protein' | 'carbs' | 'fat';

const FIELDS: { key: FieldKey; label: string }[] = [
  { key: 'calories', label: 'Calories (kcal)' },
  { key: 'protein', label: 'Protein (g)' },
  { key: 'carbs', label: 'Carbs (g)' },
  { key: 'fat', label: 'Fat (g)' },
];

const EMPTY = { calories: '', protein: '', carbs: '', fat: '' };

export default function SwapManualEntryTab({ saving, onAdd }: Props) {
  const [form, setForm] = useState<Record<FieldKey, string>>(EMPTY);
  const [mealName, setMealName] = useState('');
  const [ingredients, setIngredients] = useState('');

  const cals = parseFloat(form.calories) || 0;
  const canSubmit = cals > 0 && mealName.trim().length > 0 && !saving;

  function handleAdd() {
    if (!canSubmit) return;
    onAdd({
      meal_name: mealName.trim(),
      ingredients: ingredients.trim() || null,
      calories: Math.round(cals),
      protein: Math.round((parseFloat(form.protein) || 0) * 10) / 10,
      carbs: Math.round((parseFloat(form.carbs) || 0) * 10) / 10,
      fat: Math.round((parseFloat(form.fat) || 0) * 10) / 10,
    });
  }

  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.input}
        value={mealName}
        onChangeText={setMealName}
        placeholder="Meal name (e.g. Chicken & Rice)"
        placeholderTextColor={Colors.textHint}
        maxLength={120}
      />
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
        style={[styles.input, styles.ingredients]}
        value={ingredients}
        onChangeText={setIngredients}
        placeholder="Ingredients (optional)"
        placeholderTextColor={Colors.textHint}
        multiline
        numberOfLines={3}
      />
      <Pressable
        onPress={handleAdd}
        disabled={!canSubmit}
        style={[styles.addBtn, !canSubmit && styles.addBtnDisabled]}
        accessibilityRole="button"
      >
        {saving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.addBtnText}>Add to plan</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  field: {
    width: '47%',
    flexGrow: 1,
    gap: 5,
  },
  fieldLabel: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  input: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  ingredients: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  addBtn: {
    marginTop: 4,
    backgroundColor: Colors.accent,
    borderRadius: 11,
    paddingVertical: 11,
    alignItems: 'center',
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
