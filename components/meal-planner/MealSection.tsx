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
  isFavorite: boolean;
  deleting: boolean;
  onOpenSwap: (mealType: MealType) => void;
  onToggleFavorite: (entry: MealPlanEntry) => void;
  onDelete: (entry: MealPlanEntry) => void;
};

export default function MealSection({
  mealType,
  entry,
  isFavorite,
  deleting,
  onOpenSwap,
  onToggleFavorite,
  onDelete,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.label}>{MEAL_TYPE_LABELS[mealType]}</Text>
        <Text style={styles.kcal}>
          {entry ? `${Math.round(entry.calories)} kcal` : '—'}
        </Text>
      </View>
      {entry ? (
        <MealCard
          entry={entry}
          isFavorite={isFavorite}
          deleting={deleting}
          onToggleFavorite={() => onToggleFavorite(entry)}
          onSwap={() => onOpenSwap(mealType)}
          onDelete={() => onDelete(entry)}
        />
      ) : (
        <EmptyMealSlot
          mealLabel={mealType}
          onPress={() => onOpenSwap(mealType)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingTop: 10,
    paddingBottom: 1,
  },
  label: {
    color: Colors.textHint,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  kcal: {
    color: Colors.accentLight,
    fontSize: 11,
    fontWeight: '600',
  },
});
