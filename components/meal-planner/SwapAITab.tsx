import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useSubscription } from '../../hooks/useSubscription';
import {
  useMealPlannerAI,
  type AISuggestion,
} from '../../hooks/useMealPlannerAI';
import type { SwapPayload } from '../../hooks/useMealPlanMutations';
import type { MealType } from '../../hooks/useMealPlanWeek';

type Props = {
  mealType: MealType;
  remaining: { calories: number; protein: number; carbs: number; fat: number };
  goal: string; // 'cutting' | 'bulking' | 'maintenance'
  saving: boolean;
  onAdd: (meal: SwapPayload) => void;
};

export default function SwapAITab({
  mealType,
  remaining,
  goal,
  saving,
  onAdd,
}: Props) {
  const { isProPlus, loading: subLoading } = useSubscription();
  const { loading, suggestForSlot } = useMealPlannerAI();
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadSuggestions() {
    setError(null);
    const r = await suggestForSlot({
      mealType,
      remaining,
      goal,
      dietPreference: 'standard',
    });
    if (r.error) {
      setError(r.error);
      return;
    }
    setSuggestions(r.suggestions ?? []);
  }

  // Auto-fetch on first mount if Pro+
  useEffect(() => {
    if (!subLoading && isProPlus && suggestions.length === 0 && !error) {
      loadSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subLoading, isProPlus]);

  if (subLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.accentLight} />
      </View>
    );
  }

  if (!isProPlus) {
    return (
      <View style={styles.gate}>
        <View style={styles.bubble}>
          <Feather name="zap" size={22} color={Colors.accentLight} />
        </View>
        <Text style={styles.gateTitle}>AI Suggest is Pro+ only</Text>
        <Text style={styles.gateBody}>
          Upgrade to Pro+ to get 5 Claude-generated meal options that fit your
          remaining macros for the day.
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>300 generations / month</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>
          Targeting {Math.round(remaining.calories)} kcal · P{' '}
          {Math.round(remaining.protein)}g · C {Math.round(remaining.carbs)}g ·
          F {Math.round(remaining.fat)}g
        </Text>
        <Pressable
          onPress={loadSuggestions}
          disabled={loading || saving}
          hitSlop={6}
          style={[styles.refreshBtn, loading && styles.refreshBtnBusy]}
          accessibilityRole="button"
          accessibilityLabel="Regenerate suggestions"
        >
          <Feather name="refresh-cw" size={13} color={Colors.accentLight} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accentLight} />
          <Text style={styles.loadingText}>Generating 5 options…</Text>
        </View>
      ) : error ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={loadSuggestions} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : suggestions.length === 0 ? (
        <Text style={styles.emptyText}>No suggestions yet.</Text>
      ) : (
        <ScrollView
          style={styles.list}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {suggestions.map((s, i) => (
            <View key={`${s.meal_name}-${i}`} style={styles.card}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {s.meal_name}
              </Text>
              <Text style={styles.cardMacros}>
                {Math.round(s.calories)} kcal · P {Math.round(s.protein)}g · C{' '}
                {Math.round(s.carbs)}g · F {Math.round(s.fat)}g
              </Text>
              {s.ingredients ? (
                <Text style={styles.cardIngredients} numberOfLines={3}>
                  {s.ingredients}
                </Text>
              ) : null}
              <Pressable
                onPress={() =>
                  onAdd({
                    meal_name: s.meal_name,
                    ingredients: s.ingredients,
                    calories: Math.round(s.calories),
                    protein: Math.round(s.protein * 10) / 10,
                    carbs: Math.round(s.carbs * 10) / 10,
                    fat: Math.round(s.fat * 10) / 10,
                  })
                }
                disabled={saving}
                style={[styles.addBtn, saving && styles.addBtnDisabled]}
                accessibilityRole="button"
                accessibilityLabel={`Add ${s.meal_name}`}
              >
                <Feather name="plus" size={12} color="#fff" />
                <Text style={styles.addBtnText}>Add to plan</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: 10 },
  center: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  gate: {
    alignItems: 'center',
    paddingTop: 30,
    paddingHorizontal: 24,
    gap: 10,
  },
  bubble: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  gateTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  gateBody: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    maxWidth: 320,
  },
  badge: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.borderAccentSoft,
    backgroundColor: Colors.accentSofter,
  },
  badgeText: {
    color: Colors.accentLight,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  headerText: {
    flex: 1,
    color: Colors.textMuted,
    fontSize: 11,
  },
  refreshBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderColor: Colors.borderAccent,
    borderWidth: 1,
    backgroundColor: Colors.accentSofter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshBtnBusy: { opacity: 0.5 },
  errorWrap: {
    paddingVertical: 28,
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  retryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  retryText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 30,
  },
  list: { flex: 1 },
  listContent: { paddingBottom: 8 },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 6,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  cardMacros: {
    color: Colors.accentLight,
    fontSize: 11,
    fontWeight: '600',
  },
  cardIngredients: {
    color: Colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  addBtn: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: Colors.accent,
    borderRadius: 9,
    paddingVertical: 8,
  },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
