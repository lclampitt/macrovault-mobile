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
import { ChevronLeft, ChevronRight, Search } from 'lucide-react-native';
import { Font } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import { useFoodSearch } from '../../hooks/useFoodSearch';
import { roundMacro, scaleByGrams, type OffProduct } from '../../lib/foodFacts';
import type { SwapPayload } from '../../hooks/useMealPlanMutations';

type Props = {
  saving: boolean;
  onAdd: (meal: SwapPayload) => void;
};

export default function SwapFoodSearchTab({ saving, onAdd }: Props) {
  const t = useTokens();
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

  const inputStyle = [
    styles.input,
    {
      backgroundColor: t.bgInput,
      borderColor: t.borderDefault,
      color: t.textPrimary,
    },
  ];

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
          <ChevronLeft size={14} color={t.textSecondary} strokeWidth={2} />
          <Text style={[styles.backText, { color: t.textSecondary }]}>
            Back to results
          </Text>
        </Pressable>
        <View
          style={[
            styles.detailCard,
            { backgroundColor: t.bgCard, borderColor: t.borderDefault },
          ]}
        >
          {selected.brand ? (
            <Text style={[styles.brand, { color: t.primary }]}>
              {selected.brand}
            </Text>
          ) : null}
          <Text style={[styles.productName, { color: t.textPrimary }]}>
            {selected.name}
          </Text>
          <Text style={[styles.servingHint, { color: t.textTertiary }]}>
            Default serving: {selected.servingLabel} ({selected.servingGrams}g)
          </Text>
        </View>
        <View style={styles.grid}>
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: t.textTertiary }]}>
              Servings
            </Text>
            <TextInput
              style={inputStyle}
              value={servings}
              onChangeText={setServingsAndWeight}
              placeholderTextColor={t.textQuaternary}
              keyboardType="numeric"
              inputMode="decimal"
            />
          </View>
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: t.textTertiary }]}>
              Weight (g)
            </Text>
            <TextInput
              style={inputStyle}
              value={weight}
              onChangeText={setWeight}
              placeholderTextColor={t.textQuaternary}
              keyboardType="numeric"
              inputMode="decimal"
            />
          </View>
        </View>
        {live ? (
          <View
            style={[
              styles.liveCard,
              {
                backgroundColor: t.primaryTintBg,
                borderColor: t.primaryTintBorder,
              },
            ]}
          >
            <Text style={[styles.liveLabel, { color: t.primary }]}>
              Live macros
            </Text>
            <Text style={[styles.liveRow, { color: t.textPrimary }]}>
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
            { backgroundColor: t.primary },
            t.shadowPrimaryGlow,
            (saving || !live || live.calories <= 0) && styles.addBtnDisabled,
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

  // -------- Search view --------
  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.searchRow,
          {
            backgroundColor: t.bgInput,
            borderColor: t.primaryTintBorder,
          },
        ]}
      >
        <Search size={14} color={t.textTertiary} strokeWidth={2} />
        <TextInput
          style={[styles.searchInput, { color: t.textPrimary }]}
          value={query}
          onChangeText={setQuery}
          placeholder="Search branded foods (e.g. Oreos, Oikos yogurt)"
          placeholderTextColor={t.textQuaternary}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={t.primary} />
        </View>
      ) : error ? (
        <Text style={[styles.errorText, { color: t.destructive }]}>
          Couldn&apos;t reach Open Food Facts. {error}
        </Text>
      ) : !searched ? (
        <Text style={[styles.empty, { color: t.textTertiary }]}>
          Start typing to search the Open Food Facts database for branded
          foods.
        </Text>
      ) : results.length === 0 ? (
        <Text style={[styles.empty, { color: t.textTertiary }]}>
          No products matched.
        </Text>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {results.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => setSelected(p)}
              style={[
                styles.row,
                { backgroundColor: t.bgCard, borderColor: t.borderDefault },
              ]}
              accessibilityRole="button"
            >
              <View style={styles.rowLeft}>
                {p.brand ? (
                  <Text style={[styles.rowBrand, { color: t.primary }]}>
                    {p.brand}
                  </Text>
                ) : null}
                <Text
                  style={[styles.rowName, { color: t.textPrimary }]}
                  numberOfLines={2}
                >
                  {p.name}
                </Text>
                <Text style={[styles.rowMacros, { color: t.textTertiary }]}>
                  {Math.round(p.per100.calories)} kcal / 100g
                </Text>
              </View>
              <ChevronRight size={14} color={t.textTertiary} strokeWidth={2} />
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
    paddingHorizontal: 24,
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
    gap: 10,
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
  rowBrand: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  rowName: {
    fontFamily: Font.semibold,
    fontSize: 13,
  },
  rowMacros: {
    fontFamily: Font.medium,
    fontSize: 11,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  backText: {
    fontFamily: Font.semibold,
    fontSize: 12,
  },
  detailCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  brand: {
    fontFamily: Font.bold,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  productName: {
    fontFamily: Font.bold,
    fontSize: 14,
  },
  servingHint: {
    fontFamily: Font.medium,
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
  liveCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  liveLabel: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  liveRow: {
    fontFamily: Font.semibold,
    fontSize: 13,
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
