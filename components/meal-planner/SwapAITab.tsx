import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Plus, RefreshCw, Zap } from 'lucide-react-native';
import { Font } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import { useSubscription } from '../../hooks/useSubscription';
import {
  useMealPlannerAI,
  type AISuggestion,
} from '../../hooks/useMealPlannerAI';
import type { SwapPayload } from '../../hooks/useMealPlanMutations';
import type { MealType } from '../../hooks/useMealPlanWeek';

type Props = {
  /** 0=Mon … 6=Sun — required by the /meal-planner/suggest endpoint. */
  dayOfWeek: number;
  mealType: MealType;
  remaining: { calories: number; protein: number; carbs: number; fat: number };
  goal: string; // 'cutting' | 'bulking' | 'maintenance'
  saving: boolean;
  onAdd: (meal: SwapPayload) => void;
};

export default function SwapAITab({
  dayOfWeek,
  mealType,
  remaining,
  goal,
  saving,
  onAdd,
}: Props) {
  const t = useTokens();
  const { isProPlus, loading: subLoading } = useSubscription();
  const { loading, suggestForSlot } = useMealPlannerAI();
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadSuggestions() {
    setError(null);
    const r = await suggestForSlot({
      dayOfWeek,
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
        <ActivityIndicator color={t.primary} />
      </View>
    );
  }

  if (!isProPlus) {
    return (
      <View style={styles.gate}>
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: t.primaryTintBg,
              borderColor: t.primaryTintBorder,
            },
          ]}
        >
          <Zap size={22} color={t.primary} strokeWidth={2} />
        </View>
        <Text style={[styles.gateTitle, { color: t.textPrimary }]}>
          AI Suggest is Pro+ only
        </Text>
        <Text style={[styles.gateBody, { color: t.textTertiary }]}>
          Upgrade to Pro+ to get 5 Claude-generated meal options that fit your
          remaining macros for the day.
        </Text>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: t.primaryTintBg,
              borderColor: t.primaryTintBorder,
            },
          ]}
        >
          <Text style={[styles.badgeText, { color: t.primary }]}>
            300 generations / month
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.headerRow,
          { backgroundColor: t.bgCard, borderColor: t.borderDefault },
        ]}
      >
        <Text style={[styles.headerText, { color: t.textTertiary }]}>
          Targeting {Math.round(remaining.calories)} kcal · P{' '}
          {Math.round(remaining.protein)}g · C {Math.round(remaining.carbs)}g ·
          F {Math.round(remaining.fat)}g
        </Text>
        <Pressable
          onPress={loadSuggestions}
          disabled={loading || saving}
          hitSlop={6}
          style={[
            styles.refreshBtn,
            {
              backgroundColor: t.primaryTintBg,
              borderColor: t.primaryTintBorder,
            },
            loading && styles.refreshBtnBusy,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Regenerate suggestions"
        >
          <RefreshCw size={13} color={t.primary} strokeWidth={2} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={t.primary} />
          <Text style={[styles.loadingText, { color: t.textTertiary }]}>
            Generating 5 options…
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorWrap}>
          <Text style={[styles.errorText, { color: t.destructive }]}>
            {error}
          </Text>
          <Pressable
            onPress={loadSuggestions}
            style={[
              styles.retryBtn,
              { backgroundColor: t.bgCard, borderColor: t.borderDefault },
            ]}
          >
            <Text style={[styles.retryText, { color: t.textSecondary }]}>
              Try again
            </Text>
          </Pressable>
        </View>
      ) : suggestions.length === 0 ? (
        <Text style={[styles.emptyText, { color: t.textTertiary }]}>
          No suggestions yet.
        </Text>
      ) : (
        <ScrollView
          style={styles.list}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        >
          {suggestions.map((s, i) => (
            <View
              key={`${s.meal_name}-${i}`}
              style={[
                styles.card,
                { backgroundColor: t.bgCard, borderColor: t.borderDefault },
              ]}
            >
              <Text
                style={[styles.cardTitle, { color: t.textPrimary }]}
                numberOfLines={2}
              >
                {s.meal_name}
              </Text>
              <Text style={[styles.cardMacros, { color: t.primary }]}>
                {Math.round(s.calories)} kcal · P {Math.round(s.protein)}g · C{' '}
                {Math.round(s.carbs)}g · F {Math.round(s.fat)}g
              </Text>
              {s.ingredients ? (
                <Text
                  style={[styles.cardIngredients, { color: t.textTertiary }]}
                  numberOfLines={3}
                >
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
                style={[
                  styles.addBtn,
                  { backgroundColor: t.primary },
                  t.shadowPrimaryGlow,
                  saving && styles.addBtnDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Add ${s.meal_name}`}
              >
                <Plus size={12} color={t.textOnPrimary} strokeWidth={2.5} />
                <Text style={[styles.addBtnText, { color: t.textOnPrimary }]}>
                  Add to plan
                </Text>
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
    fontFamily: Font.medium,
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
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  gateTitle: {
    fontFamily: Font.bold,
    fontSize: 15,
  },
  gateBody: {
    fontFamily: Font.medium,
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
  },
  badgeText: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  headerText: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: 11,
  },
  refreshBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: 1,
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
    fontFamily: Font.medium,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  retryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  retryText: {
    fontFamily: Font.semibold,
    fontSize: 12,
  },
  emptyText: {
    fontFamily: Font.medium,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 30,
  },
  list: { flex: 1 },
  listContent: { paddingBottom: 8 },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 6,
  },
  cardTitle: {
    fontFamily: Font.bold,
    fontSize: 13,
    lineHeight: 18,
  },
  cardMacros: {
    fontFamily: Font.semibold,
    fontSize: 11,
  },
  cardIngredients: {
    fontFamily: Font.medium,
    fontSize: 11,
    lineHeight: 15,
  },
  addBtn: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 9,
    paddingVertical: 10,
  },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: {
    fontFamily: Font.bold,
    fontSize: 12,
    letterSpacing: -0.2,
  },
});
