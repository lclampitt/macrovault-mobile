import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Font } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
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
  const t = useTokens();
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

  const inputStyle = [
    styles.input,
    {
      backgroundColor: t.bgInput,
      borderColor: t.borderDefault,
      color: t.textPrimary,
    },
  ];

  return (
    <View style={styles.wrap}>
      <TextInput
        style={inputStyle}
        value={mealName}
        onChangeText={setMealName}
        placeholder="Meal name (e.g. Chicken & Rice)"
        placeholderTextColor={t.textQuaternary}
        maxLength={120}
      />
      <View style={styles.grid}>
        {FIELDS.map(({ key, label }) => (
          <View key={key} style={styles.field}>
            <Text style={[styles.fieldLabel, { color: t.textTertiary }]}>
              {label}
            </Text>
            <TextInput
              style={inputStyle}
              value={form[key]}
              onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
              placeholder="0"
              placeholderTextColor={t.textQuaternary}
              keyboardType="numeric"
              inputMode={key === 'calories' ? 'numeric' : 'decimal'}
            />
          </View>
        ))}
      </View>
      <TextInput
        style={[inputStyle, styles.ingredients]}
        value={ingredients}
        onChangeText={setIngredients}
        placeholder="Ingredients (optional)"
        placeholderTextColor={t.textQuaternary}
        multiline
        numberOfLines={3}
      />
      <Pressable
        onPress={handleAdd}
        disabled={!canSubmit}
        style={[
          styles.addBtn,
          { backgroundColor: t.primary },
          t.shadowPrimaryGlow,
          !canSubmit && styles.addBtnDisabled,
        ]}
        accessibilityRole="button"
      >
        {saving ? (
          <ActivityIndicator size="small" color={t.textOnPrimary} />
        ) : (
          <Text style={[styles.addBtnText, { color: t.textOnPrimary }]}>
            Add to plan
          </Text>
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
    fontFamily: Font.medium,
    fontSize: 11,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: Font.medium,
    fontSize: 13,
  },
  ingredients: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  addBtn: {
    marginTop: 4,
    borderRadius: 11,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    fontFamily: Font.bold,
    fontSize: 14,
    letterSpacing: -0.2,
  },
});
