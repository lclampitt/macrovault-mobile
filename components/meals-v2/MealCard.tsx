import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ChevronDown,
  ClipboardCheck,
  Heart,
  MoreHorizontal,
} from 'lucide-react-native';
import { DS, Font, Radius, Tabular } from '../../lib/design-system';
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
          <Icon size={14} color={DS.accent} strokeWidth={2} />
          <Text style={styles.slotName}>{SLOT_TITLE[entry.meal_type]}</Text>
        </View>
        <Text style={[styles.slotKcal, Tabular]}>
          {fmtMacroNumber(entry.calories)} kcal
        </Text>
      </View>

      {/* Card body */}
      <View style={styles.card}>
        {/* Title + heart + kebab */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>{entry.meal_name}</Text>
          <View style={styles.actionsRow}>
            <Pressable
              onPress={onToggleFavorite}
              style={({ pressed }) => [
                styles.iconBtn,
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
                color={isFavorite ? DS.accent : DS.textTertiary}
                strokeWidth={2}
                fill={isFavorite ? DS.accent : 'transparent'}
              />
            </Pressable>

            <Pressable
              onPress={onLog}
              style={({ pressed }) => [
                styles.iconBtn,
                styles.iconBtnAccent,
                pressed && styles.iconBtnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Log ${entry.meal_name} to today`}
            >
              <ClipboardCheck
                size={14}
                color={DS.accent}
                strokeWidth={2}
              />
            </Pressable>

            <View style={styles.kebabWrap}>
              <Pressable
                onPress={onOpenMenu}
                style={({ pressed }) => [
                  styles.iconBtn,
                  pressed && styles.iconBtnPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Meal options"
                accessibilityState={{ expanded: isMenuOpen }}
              >
                <MoreHorizontal
                  size={14}
                  color={DS.textTertiary}
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
            color={DS.accent}
            value={`${fmtMacroNumber(entry.protein)}g`}
            label="protein"
          />
          <MacroDot
            color={DS.accentLight}
            value={`${fmtMacroNumber(entry.carbs)}g`}
            label="carbs"
          />
          <MacroDot
            color={DS.accentMid}
            value={`${fmtMacroNumber(entry.fat)}g`}
            label="fat"
          />
        </View>

        {/* Stacked macro bar (caloric %) */}
        <View style={styles.stackedBar}>
          {stack ? (
            <>
              <View
                style={{
                  width: `${stack.p}%`,
                  height: '100%',
                  backgroundColor: DS.accent,
                }}
              />
              <View
                style={{
                  width: `${stack.c}%`,
                  height: '100%',
                  backgroundColor: DS.accentLight,
                }}
              />
              <View
                style={{
                  width: `${stack.f}%`,
                  height: '100%',
                  backgroundColor: DS.accentMid,
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
            color={isExpanded ? DS.accent : DS.textTertiary}
            strokeWidth={2}
            style={{
              transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
            }}
          />
          <Text
            style={[
              styles.expandToggleText,
              { color: isExpanded ? DS.accent : DS.textSecondary },
            ]}
          >
            {isExpanded
              ? 'Hide ingredients'
              : `Show ingredients${ingredients.length ? ` (${ingredients.length})` : ''}`}
          </Text>
        </Pressable>

        {isExpanded ? (
          <View style={styles.ingredientsWrap}>
            {ingredients.length === 0 ? (
              <Text style={styles.noIngredients}>No ingredients listed.</Text>
            ) : (
              ingredients.map((ing, idx) => (
                <View key={idx} style={styles.ingRow}>
                  <View style={styles.ingDot} />
                  <Text style={styles.ingName} numberOfLines={1}>
                    {ing.name}
                  </Text>
                  {ing.qty ? (
                    <Text style={[styles.ingQty, Tabular]}>{ing.qty}</Text>
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
}: {
  color: string;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.macroDotCol}>
      <View style={[styles.macroDot, { backgroundColor: color }]} />
      <Text style={[styles.macroDotValue, Tabular]}>{value}</Text>
      <Text style={styles.macroDotLabel}>{label}</Text>
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
    color: DS.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  slotKcal: {
    fontFamily: Font.bold,
    fontSize: 11,
    color: DS.accent,
  },
  card: {
    backgroundColor: DS.surface,
    borderColor: DS.border,
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
    color: DS.text,
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
    backgroundColor: '#0F0F0F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPressed: {
    transform: [{ scale: 0.9 }],
  },
  iconBtnAccent: {
    backgroundColor: DS.accentSoft,
    borderWidth: 1,
    borderColor: DS.accentBorder,
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
    color: DS.text,
  },
  macroDotLabel: {
    fontFamily: Font.medium,
    fontSize: 10,
    color: DS.textTertiary,
  },
  stackedBar: {
    flexDirection: 'row',
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: DS.border,
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
    borderTopColor: DS.border,
    gap: 8,
  },
  noIngredients: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.textTertiary,
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
    backgroundColor: DS.textDimmest,
  },
  ingName: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.text,
  },
  ingQty: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DS.textTertiary,
  },
});
