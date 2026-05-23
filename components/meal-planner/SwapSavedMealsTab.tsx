import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useSavedMeals } from '../../hooks/useSavedMeals';
import type { SwapPayload } from '../../hooks/useMealPlanMutations';

type Props = {
  saving: boolean;
  onAdd: (meal: SwapPayload) => void;
};

export default function SwapSavedMealsTab({ saving, onAdd }: Props) {
  const { meals, loading, error, removeSaved } = useSavedMeals();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return meals;
    return meals.filter((m) => m.meal_name.toLowerCase().includes(q));
  }, [meals, query]);

  return (
    <View style={styles.wrap}>
      <View style={styles.searchRow}>
        <Feather name="search" size={14} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search saved meals…"
          placeholderTextColor={Colors.textHint}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accentLight} />
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : filtered.length === 0 ? (
        <Text style={styles.empty}>
          {meals.length === 0
            ? "You haven't saved any meals yet. Tap the heart on a meal to save it."
            : 'No matches.'}
        </Text>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {filtered.map((m) => (
            <View key={m.id} style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowTitle} numberOfLines={2}>
                  {m.meal_name}
                </Text>
                <Text style={styles.rowMacros}>
                  {Math.round(m.calories)} kcal · P {Math.round(m.protein)}g · C{' '}
                  {Math.round(m.carbs)}g · F {Math.round(m.fat)}g
                </Text>
              </View>
              <Pressable
                onPress={() =>
                  onAdd({
                    meal_name: m.meal_name,
                    ingredients: m.ingredients,
                    calories: m.calories,
                    protein: m.protein,
                    carbs: m.carbs,
                    fat: m.fat,
                  })
                }
                disabled={saving}
                style={[styles.addBtn, saving && styles.addBtnDisabled]}
                accessibilityRole="button"
                accessibilityLabel={`Add ${m.meal_name}`}
              >
                <Feather name="plus" size={12} color={Colors.accentLight} />
                <Text style={styles.addBtnText}>Add</Text>
              </Pressable>
              <Pressable
                onPress={() => removeSaved(m.id)}
                hitSlop={8}
                style={styles.delBtn}
                accessibilityRole="button"
                accessibilityLabel="Remove from saved meals"
              >
                <Feather name="x" size={13} color={Colors.textMuted} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
    flex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  center: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 18,
  },
  empty: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
    lineHeight: 17,
  },
  list: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    marginBottom: 6,
  },
  rowLeft: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  rowMacros: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    borderColor: Colors.borderAccent,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.accentSofter,
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    color: Colors.accentLight,
    fontSize: 12,
    fontWeight: '700',
  },
  delBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
