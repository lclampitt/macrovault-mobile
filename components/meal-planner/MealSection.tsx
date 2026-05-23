import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import {
  MEAL_TYPE_LABELS,
  type MealPlanEntry,
  type MealType,
} from '../../hooks/useMealPlanWeek';
import MealCard from './MealCard';
import EmptyMealSlot from './EmptyMealSlot';

type Props = {
  mealType: MealType;
  entry: MealPlanEntry | null;
};

export default function MealSection({ mealType, entry }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.label}>{MEAL_TYPE_LABELS[mealType]}</Text>
        <Text style={styles.kcal}>
          {entry ? `${Math.round(entry.calories)} kcal` : '—'}
        </Text>
      </View>
      {entry ? <MealCard entry={entry} /> : <EmptyMealSlot mealLabel={mealType} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingTop: 14,
    paddingBottom: 2,
  },
  label: {
    color: Colors.textHint,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  kcal: {
    color: Colors.accentLight,
    fontSize: 12,
    fontWeight: '600',
  },
});
