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
import { Plus, Search, X } from 'lucide-react-native';
import { Font } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import { useSavedMeals } from '../../hooks/useSavedMeals';
import type { SwapPayload } from '../../hooks/useMealPlanMutations';

type Props = {
  saving: boolean;
  onAdd: (meal: SwapPayload) => void;
};

export default function SwapSavedMealsTab({ saving, onAdd }: Props) {
  const t = useTokens();
  const { meals, loading, error, removeSaved } = useSavedMeals();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return meals;
    return meals.filter((m) => m.meal_name.toLowerCase().includes(q));
  }, [meals, query]);

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.searchRow,
          {
            backgroundColor: t.bgInput,
            borderColor: t.borderDefault,
          },
        ]}
      >
        <Search size={14} color={t.textTertiary} strokeWidth={2} />
        <TextInput
          style={[styles.searchInput, { color: t.textPrimary }]}
          value={query}
          onChangeText={setQuery}
          placeholder="Search saved meals…"
          placeholderTextColor={t.textQuaternary}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={t.primary} />
        </View>
      ) : error ? (
        <Text style={[styles.errorText, { color: t.destructive }]}>
          {error}
        </Text>
      ) : filtered.length === 0 ? (
        <Text style={[styles.empty, { color: t.textTertiary }]}>
          {meals.length === 0
            ? "You haven't saved any meals yet. Tap the heart on a meal to save it."
            : 'No matches.'}
        </Text>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {filtered.map((m) => (
            <View
              key={m.id}
              style={[
                styles.row,
                {
                  backgroundColor: t.bgCard,
                  borderColor: t.borderDefault,
                },
              ]}
            >
              <View style={styles.rowLeft}>
                <Text
                  style={[styles.rowTitle, { color: t.textPrimary }]}
                  numberOfLines={2}
                >
                  {m.meal_name}
                </Text>
                <Text style={[styles.rowMacros, { color: t.textTertiary }]}>
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
                style={[
                  styles.addBtn,
                  {
                    backgroundColor: t.primaryTintBg,
                    borderColor: t.primaryTintBorder,
                  },
                  saving && styles.addBtnDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Add ${m.meal_name}`}
              >
                <Plus size={12} color={t.primary} strokeWidth={2.5} />
                <Text style={[styles.addBtnText, { color: t.primary }]}>
                  Add
                </Text>
              </Pressable>
              <Pressable
                onPress={() => removeSaved(m.id)}
                hitSlop={8}
                style={styles.delBtn}
                accessibilityRole="button"
                accessibilityLabel="Remove from saved meals"
              >
                <X size={13} color={t.textTertiary} strokeWidth={2} />
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
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchInput: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: 13,
  },
  center: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: Font.medium,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 18,
  },
  empty: {
    fontFamily: Font.medium,
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
    borderWidth: 1,
    marginBottom: 6,
  },
  rowLeft: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontFamily: Font.semibold,
    fontSize: 13,
  },
  rowMacros: {
    fontFamily: Font.medium,
    fontSize: 11,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    fontFamily: Font.bold,
    fontSize: 12,
  },
  delBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
