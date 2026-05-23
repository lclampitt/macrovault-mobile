import { useEffect, useMemo, useState } from 'react';
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
import { useFoodSearch } from '../../hooks/useFoodSearch';
import { roundMacro, scaleByGrams, type OffProduct } from '../../lib/foodFacts';
import type { SwapPayload } from '../../hooks/useMealPlanMutations';

type Props = {
  saving: boolean;
  onAdd: (meal: SwapPayload) => void;
};

export default function SwapFoodSearchTab({ saving, onAdd }: Props) {
  const [query, setQuery] = useState('');
  const { results, loading, searched, error } = useFoodSearch(query);
  const [selected, setSelected] = useState<OffProduct | null>(null);
  const [servings, setServings] = useState('1');
  const [weight, setWeight] = useState('100');

  useEffect(() => {
    if (selected) {
      setServings('1');
      setWeight(String(selected.servingGrams));
    }
  }, [selected]);

  function setServingsAndWeight(v: string) {
    setServings(v);
    const n = parseFloat(v);
    if (!Number.isNaN(n) && selected) {
      setWeight(String(roundMacro(n * selected.servingGrams, 1)));
    }
  }

  const live = useMemo(() => {
    if (!selected) return null;
    const w = Number(weight) || 0;
    return scaleByGrams(selected, w);
  }, [selected, weight]);

  function handleAdd() {
    if (!selected || !live) return;
    onAdd({
      meal_name: selected.brand
        ? `${selected.brand} — ${selected.name}`
        : selected.name,
      ingredients: `${weight}g serving`,
      calories: live.calories,
      protein: live.protein,
      carbs: live.carbs,
      fat: live.fat,
    });
  }

  // -------- Detail view (product picked) --------
  if (selected) {
    return (
      <View style={styles.wrap}>
        <Pressable
          onPress={() => setSelected(null)}
          hitSlop={6}
          style={styles.backRow}
          accessibilityRole="button"
          accessibilityLabel="Back to search results"
        >
          <Feather name="chevron-left" size={14} color={Colors.textSecondary} />
          <Text style={styles.backText}>Back to results</Text>
        </Pressable>
        <View style={styles.detailCard}>
          {selected.brand ? (
            <Text style={styles.brand}>{selected.brand}</Text>
          ) : null}
          <Text style={styles.productName}>{selected.name}</Text>
          <Text style={styles.servingHint}>
            Default serving: {selected.servingLabel} ({selected.servingGrams}g)
          </Text>
        </View>
        <View style={styles.grid}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Servings</Text>
            <TextInput
              style={styles.input}
              value={servings}
              onChangeText={setServingsAndWeight}
              keyboardType="numeric"
              inputMode="decimal"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Weight (g)</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              inputMode="decimal"
            />
          </View>
        </View>
        {live ? (
          <View style={styles.liveCard}>
            <Text style={styles.liveLabel}>Live macros</Text>
            <Text style={styles.liveRow}>
              {live.calories} kcal · P {live.protein}g · C {live.carbs}g · F{' '}
              {live.fat}g
            </Text>
          </View>
        ) : null}
        <Pressable
          onPress={handleAdd}
          disabled={saving || !live || live.calories <= 0}
          style={[
            styles.addBtn,
            (saving || !live || live.calories <= 0) && styles.addBtnDisabled,
          ]}
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

  // -------- Search view --------
  return (
    <View style={styles.wrap}>
      <View style={styles.searchRow}>
        <Feather name="search" size={14} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search branded foods (e.g. Oreos, Oikos yogurt)"
          placeholderTextColor={Colors.textHint}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accentLight} />
        </View>
      ) : error ? (
        <Text style={styles.errorText}>
          Couldn&apos;t reach Open Food Facts. {error}
        </Text>
      ) : !searched ? (
        <Text style={styles.empty}>
          Start typing to search the Open Food Facts database for branded
          foods.
        </Text>
      ) : results.length === 0 ? (
        <Text style={styles.empty}>No products matched.</Text>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {results.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => setSelected(p)}
              style={styles.row}
              accessibilityRole="button"
            >
              <View style={styles.rowLeft}>
                {p.brand ? (
                  <Text style={styles.rowBrand}>{p.brand}</Text>
                ) : null}
                <Text style={styles.rowName} numberOfLines={2}>
                  {p.name}
                </Text>
                <Text style={styles.rowMacros}>
                  {Math.round(p.per100.calories)} kcal / 100g
                </Text>
              </View>
              <Feather name="chevron-right" size={14} color={Colors.textMuted} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    gap: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderColor: Colors.borderAccent,
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
    paddingHorizontal: 24,
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
    gap: 10,
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
  rowBrand: {
    color: Colors.accentLight,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  rowName: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  rowMacros: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  backText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  detailCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  brand: {
    color: Colors.accentLight,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  productName: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  servingHint: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  grid: {
    flexDirection: 'row',
    gap: 10,
  },
  field: {
    flex: 1,
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
  liveCard: {
    backgroundColor: Colors.accentSofter,
    borderColor: Colors.borderAccentSoft,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  liveLabel: {
    color: Colors.accentLight,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  liveRow: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
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
