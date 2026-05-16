import { useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import type { DayCategory, DayState } from '../../hooks/useActivityData';
import type { CellAnchor } from './ActivityCell';

const CAT_LABEL: Record<DayCategory, string> = {
  'workout-only': 'Workout logged',
  'meals-only': 'Meals logged',
  both: 'Both logged',
  none: 'Nothing logged',
};

const CAT_COLOR: Record<DayCategory, string> = {
  'workout-only': Colors.activityWorkout,
  'meals-only': Colors.activityMeals,
  both: Colors.activityBoth,
  none: Colors.textMuted,
};

const CAT_BORDER: Record<DayCategory, string> = {
  'workout-only': Colors.activityWorkoutTint,
  'meals-only': Colors.activityMealsTint,
  both: Colors.activityBothTint,
  none: 'rgba(255, 255, 255, 0.1)',
};

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

type Props = {
  dateStr: string;
  state: DayState;
  anchor: CellAnchor;
  onDismiss: () => void;
};

const TOOLTIP_WIDTH = 250;

export default function ActivityTooltip({ dateStr, state, anchor, onDismiss }: Props) {
  const screen = Dimensions.get('window');
  const [height, setHeight] = useState(0);

  const cat = state.category;
  const width = Math.min(TOOLTIP_WIDTH, screen.width - 24);

  let left = anchor.x + anchor.w / 2 - width / 2;
  left = Math.max(12, Math.min(left, screen.width - width - 12));

  const placeBelow = anchor.y < screen.height * 0.45;
  let top = placeBelow ? anchor.y + anchor.h + 8 : anchor.y - 8 - height;
  top = Math.max(8, Math.min(top, screen.height - height - 8));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      <View
        onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
        style={[
          styles.tooltip,
          {
            width,
            left,
            top,
            borderColor: CAT_BORDER[cat],
            opacity: height === 0 ? 0 : 1,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={[styles.dot, { backgroundColor: CAT_COLOR[cat] }]} />
          <Text style={[styles.dateLabel, { color: CAT_COLOR[cat] }]}>
            {formatDate(dateStr)} · {CAT_LABEL[cat]}
          </Text>
        </View>

        {state.workouts.length > 0 ? (
          <View style={styles.workoutRow}>
            <Feather name="zap" size={13} color={Colors.textSecondary} />
            <Text style={styles.workoutName} numberOfLines={1}>
              {state.workouts[0].name}
            </Text>
            {state.workouts[0].exerciseCount > 0 ? (
              <Text style={styles.workoutCount}>
                {state.workouts[0].exerciseCount}{' '}
                {state.workouts[0].exerciseCount === 1 ? 'exercise' : 'exercises'}
              </Text>
            ) : null}
          </View>
        ) : null}

        {state.meals.length > 0 ? (
          <View style={styles.meals}>
            <Text style={styles.mealsLabel}>Meals</Text>
            {state.meals.slice(0, 6).map((m, i) => (
              <View key={i} style={styles.mealRow}>
                <Text style={styles.mealName} numberOfLines={1}>
                  {m.name}
                </Text>
                <Text style={styles.mealCal}>{Math.round(m.calories)} kcal</Text>
              </View>
            ))}
            {state.meals.length > 6 ? (
              <Text style={styles.moreText}>+{state.meals.length - 6} more</Text>
            ) : null}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {Math.round(state.totalCalories).toLocaleString()} kcal
              </Text>
            </View>
          </View>
        ) : null}

        {cat === 'none' ? (
          <Text style={styles.emptyText}>Nothing logged this day.</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tooltip: {
    position: 'absolute',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  workoutName: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '500',
  },
  workoutCount: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  meals: {
    marginTop: 10,
  },
  mealsLabel: {
    color: Colors.textHint,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  mealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 3,
  },
  mealName: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  mealCal: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  moreText: {
    color: Colors.textHint,
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 3,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  totalValue: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
});
