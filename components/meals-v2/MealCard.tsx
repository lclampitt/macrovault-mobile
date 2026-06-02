import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ChevronDown,
  ClipboardCheck,
  Heart,
  MoreHorizontal,
} from 'lucide-react-native';
import { Font, Radius, Tabular } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import type { MealPlanEntry, MealType } from '../../hooks/useMealPlanWeek';
import {
  PERIOD_ICONS,
  periodFromMealType,
} from '../../lib/meal-periods';
import MealKebabMenu from './MealKebabMenu';

// The Meals tab uses traditional meal-time names (Breakfast / Lunch /
// Dinner / Snack) instead of the period vocabulary (Morning / Noon /
// Evening / Snack) used elsewhere. Both share the same Sunrise / Sun /
// Moon / Cookie icons.
const SLOT_TITLE: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

type Props = {
  entry: MealPlanEntry;
  isFavorite: boolean;
  isExpanded: boolean;
  isMenuOpen: boolean;
  onToggleExpand: () => void;
  onToggleFavorite: () => void;
  onOpenMenu: () => void;
  onSwap: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  /** Logs this planned meal to food_logs via the shared LogMealSheet. */
  onLog: () => void;
};

// Slot icons + labels are sourced from `lib/meal-periods` so every surface
// uses the same Morning / Noon / Evening / Snack vocabulary. The legacy
// breakfast/lunch/dinner/snack `meal_type` column maps 1:1 to a period.

/** Parse an "150g grilled chicken, 80g rice, ..." string into structured rows. */
function parseIngredients(
  raw: string | null,
): Array<{ name: string; qty: string }> {
  if (!raw) return [];
  const parts = raw
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.map((s) => {
    // qty = leading "150g", "1/2 cup", "2 tbsp", "1 slice", etc.
    const m = s.match(
      /^(\d+(?:[./]\d+)?(?:\s*\d+\/\d+)?)\s*(g|kg|oz|lb|ml|fl oz|cup|tbsp|tsp|pcs|slice|slices|piece|pieces|scoop|scoops)?\s+(.+)$/i,
    );
    if (m) {
      const qty = `${m[1]}${m[2] ? ' ' + m[2] : ''}`.trim();
      return { name: m[3], qty };
    }
    return { name: s, qty: '' };
  });
}

function fmtMacroNumber(n: number): string {
  return Math.round(n).toString();
}

export default function MealCard({
  entry,
  isFavorite,
  isExpanded,
  isMenuOpen,
  onToggleExpand,
  onToggleFavorite,
  onOpenMenu,
  onLog,
  onSwap,
  onDuplicate,
  onRemove,
}: Props) {
  const t = useTokens();
  const period = periodFromMealType(entry.meal_type);
  const Icon = PERIOD_ICONS[period];
  const ingredients = useMemo(
    () => parseIngredients(entry.ingredients),
    [entry.ingredients],
  );

  // Stacked macro bar — caloric contribution, not gram totals.
  const stack = useMemo(() => {
    const totalKcal = entry.protein * 4 + entry.carbs * 4 + entry.fat * 9;
    if (totalKcal <= 0) return null;
    return {
      p: (entry.protein * 4 * 100) / totalKcal,
      c: (entry.carbs * 4 * 100) / totalKcal,
      f: (entry.fat * 9 * 100) / totalKcal,
    };
  }, [entry.protein, entry.carbs, entry.fat]);

  return (
    <View style={styles.outer}>
      {/* Slot label row (above the card) */}
      <View style={styles.slotRow}>
        <View style={styles.slotLeft}>
          <Icon size={14} color={t.primary} strokeWidth={2} />
          <Text style={[styles.slotName, { color: t.textTertiary }]}>{SLOT_TITLE[entry.meal_type]}</Text>
        </View>
        <Text style={[styles.slotKcal, Tabular, { color: t.primary }]}>
          {fmtMacroNumber(entry.calories)} kcal
        </Text>
      </View>

      {/* Card body */}
      <View
        style={[
          styles.card,
          { backgroundColor: t.bgCard, borderColor: t.borderDefault },
        ]}
      >
        {/* Title + heart + kebab */}
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: t.textPrimary }]}>{entry.meal_name}</Text>
          <View style={styles.actionsRow}>
            <Pressable
              onPress={onToggleFavorite}
              style={({ pressed }) => [
                styles.iconBtn,
                { backgroundColor: t.bgCardElevated },
                pressed && styles.iconBtnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                isFavorite ? 'Remove from saved meals' : 'Save meal'
              }
              accessibilityState={{ selected: isFavorite }}
            >
              <Heart
                size={14}
                color={isFavorite ? t.primary : t.textTertiary}
                strokeWidth={2}
                fill={isFavorite ? t.primary : 'transparent'}
              />
            </Pressable>

            <Pressable
              onPress={onLog}
              style={({ pressed }) => [
                styles.iconBtn,
                {
                  backgroundColor: t.primaryTintBg,
                  borderWidth: 1,
                  borderColor: t.primaryTintBorder,
                },
                pressed && styles.iconBtnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Log ${entry.meal_name} to today`}
            >
              <ClipboardCheck
                size={14}
                color={t.primary}
                strokeWidth={2}
              />
            </Pressable>

            <View style={styles.kebabWrap}>
              <Pressable
                onPress={onOpenMenu}
                style={({ pressed }) => [
                  styles.iconBtn,
                  { backgroundColor: t.bgCardElevated },
                  pressed && styles.iconBtnPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Meal options"
                accessibilityState={{ expanded: isMenuOpen }}
              >
                <MoreHorizontal
                  size={14}
                  color={t.textTertiary}
                  strokeWidth={2}
                />
              </Pressable>
              {isMenuOpen ? (
                <MealKebabMenu
                  onSwap={onSwap}
                  onDuplicate={onDuplicate}
                  onRemove={onRemove}
                />
              ) : null}
            </View>
          </View>
        </View>

        {/* Macro dots row */}
        <View style={styles.macroDotsRow}>
          <MacroDot
            color={t.macroProtein}
            value={`${fmtMacroNumber(entry.protein)}g`}
            label="protein"
            valueColor={t.textPrimary}
            labelColor={t.textTertiary}
          />
          <MacroDot
            color={t.macroCarbs}
            value={`${fmtMacroNumber(entry.carbs)}g`}
            label="carbs"
            valueColor={t.textPrimary}
            labelColor={t.textTertiary}
          />
          <MacroDot
            color={t.macroFat}
            value={`${fmtMacroNumber(entry.fat)}g`}
            label="fat"
            valueColor={t.textPrimary}
            labelColor={t.textTertiary}
          />
        </View>

        {/* Stacked macro bar (caloric %) */}
        <View style={[styles.stackedBar, { backgroundColor: t.borderDefault }]}>
          {stack ? (
            <>
              <View
                style={{
                  width: `${stack.p}%`,
                  height: '100%',
                  backgroundColor: t.macroProtein,
                }}
              />
              <View
                style={{
                  width: `${stack.c}%`,
                  height: '100%',
                  backgroundColor: t.macroCarbs,
                }}
              />
              <View
                style={{
                  width: `${stack.f}%`,
                  height: '100%',
                  backgroundColor: t.macroFat,
                }}
              />
            </>
          ) : null}
        </View>

        {/* Show ingredients toggle */}
        <Pressable
          onPress={onToggleExpand}
          style={styles.expandToggle}
          accessibilityRole="button"
          accessibilityState={{ expanded: isExpanded }}
        >
          <ChevronDown
            size={14}
            color={isExpanded ? t.primary : t.textTertiary}
            strokeWidth={2}
            style={{
              transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
            }}
          />
          <Text
            style={[
              styles.expandToggleText,
              { color: isExpanded ? t.primary : t.textSecondary },
            ]}
          >
            {isExpanded
              ? 'Hide ingredients'
              : `Show ingredients${ingredients.length ? ` (${ingredients.length})` : ''}`}
          </Text>
        </Pressable>

        {isExpanded ? (
          <View style={[styles.ingredientsWrap, { borderTopColor: t.borderDefault }]}>
            {ingredients.length === 0 ? (
              <Text style={[styles.noIngredients, { color: t.textTertiary }]}>No ingredients listed.</Text>
            ) : (
              ingredients.map((ing, idx) => (
                <View key={idx} style={styles.ingRow}>
                  <View style={[styles.ingDot, { backgroundColor: t.textQuaternary }]} />
                  <Text style={[styles.ingName, { color: t.textPrimary }]} numberOfLines={1}>
                    {ing.name}
                  </Text>
                  {ing.qty ? (
                    <Text style={[styles.ingQty, Tabular, { color: t.textTertiary }]}>{ing.qty}</Text>
                  ) : null}
                </View>
              ))
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function MacroDot({
  color,
  value,
  label,
  valueColor,
  labelColor,
}: {
  color: string;
  value: string;
  label: string;
  valueColor: string;
  labelColor: string;
}) {
  return (
    <View style={styles.macroDotCol}>
      <View style={[styles.macroDot, { backgroundColor: color }]} />
      <Text style={[styles.macroDotValue, Tabular, { color: valueColor }]}>{value}</Text>
      <Text style={[styles.macroDotLabel, { color: labelColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: 20,
    marginBottom: 10,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  slotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotName: {
    fontFamily: Font.semibold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  slotKcal: {
    fontFamily: Font.bold,
    fontSize: 11,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radius.card,
    padding: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontFamily: Font.bold,
    fontSize: 15,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPressed: {
    transform: [{ scale: 0.9 }],
  },
  kebabWrap: {
    position: 'relative',
  },
  macroDotsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
  },
  macroDotCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  macroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  macroDotValue: {
    fontFamily: Font.semibold,
    fontSize: 11,
  },
  macroDotLabel: {
    fontFamily: Font.medium,
    fontSize: 10,
  },
  stackedBar: {
    flexDirection: 'row',
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    marginTop: 8,
  },
  expandToggleText: {
    fontFamily: Font.semibold,
    fontSize: 11,
  },
  ingredientsWrap: {
    paddingTop: 10,
    marginTop: 4,
    borderTopWidth: 1,
    gap: 8,
  },
  noIngredients: {
    fontFamily: Font.medium,
    fontSize: 12,
    fontStyle: 'italic',
  },
  ingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  ingName: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: 12,
  },
  ingQty: {
    fontFamily: Font.medium,
    fontSize: 11,
  },
});
