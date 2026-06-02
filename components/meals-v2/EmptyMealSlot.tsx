import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Font, Radius } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import type { MealType } from '../../hooks/useMealPlanWeek';
import {
  PERIOD_ICONS,
  periodFromMealType,
} from '../../lib/meal-periods';

type Props = {
  mealType: MealType;
  onPress: () => void;
};

// Meals tab uses traditional meal-time names (Breakfast / Lunch / Dinner /
// Snack) — see the same map in MealCard.tsx for the populated row case.
const SLOT_TITLE: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

const SLOT_CTA: Record<MealType, string> = {
  breakfast: 'Add breakfast',
  lunch: 'Add lunch',
  dinner: 'Add dinner',
  snack: 'Add a snack',
};

export default function EmptyMealSlot({ mealType, onPress }: Props) {
  const t = useTokens();
  const period = periodFromMealType(mealType);
  const Icon = PERIOD_ICONS[period];
  return (
    <View style={styles.outer}>
      <View style={styles.slotRow}>
        <View style={styles.slotLeft}>
          <Icon size={14} color={t.textQuaternary} strokeWidth={2} />
          <Text style={[styles.slotName, { color: t.textTertiary }]}>{SLOT_TITLE[mealType]}</Text>
        </View>
        <Text style={[styles.empty, { color: t.textQuaternary }]}>Empty</Text>
      </View>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.btn,
          { backgroundColor: t.bgCard, borderColor: t.borderStrong },
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={SLOT_CTA[mealType]}
      >
        <Plus size={16} color={t.textTertiary} strokeWidth={2} />
        <Text style={[styles.btnLabel, { color: t.textSecondary }]}>{SLOT_CTA[mealType]}</Text>
      </Pressable>
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
  empty: {
    fontFamily: Font.medium,
    fontSize: 11,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  pressed: {
    transform: [{ scale: 0.99 }],
  },
  btnLabel: {
    fontFamily: Font.semibold,
    fontSize: 13,
  },
});
