import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import type { DayCategory } from '../../hooks/useActivityData';

export type CellAnchor = { x: number; y: number; w: number; h: number };

const YEAR_BG: Record<DayCategory, string> = {
  'workout-only': Colors.activityWorkout,
  'meals-only': Colors.activityMeals,
  both: Colors.activityBoth,
  none: Colors.activityEmpty,
};

const MONTH_BG: Record<DayCategory, string> = {
  'workout-only': Colors.activityWorkoutBg,
  'meals-only': Colors.activityMealsBg,
  both: Colors.activityBothBg,
  none: Colors.monthCellBg,
};

const MONTH_BORDER: Record<DayCategory, string> = {
  'workout-only': Colors.activityWorkoutBorder,
  'meals-only': Colors.activityMealsBorder,
  both: Colors.activityBothBorder,
  none: 'transparent',
};

const MONTH_NUM: Record<DayCategory, string> = {
  'workout-only': Colors.activityWorkout,
  'meals-only': Colors.activityMeals,
  both: Colors.activityBoth,
  none: Colors.textMuted,
};

export const YEAR_CELL_SIZE = 15;
export const YEAR_CELL_GAP = 3;

type Props = {
  variant: 'year' | 'month';
  dateStr: string;
  category: DayCategory;
  isFuture?: boolean;
  isToday?: boolean;
  isSpillover?: boolean;
  blank?: boolean;
  dayNum?: number;
  onPress: (dateStr: string, category: DayCategory, anchor: CellAnchor) => void;
};

export default function ActivityCell({
  variant,
  dateStr,
  category,
  isFuture = false,
  isToday = false,
  isSpillover = false,
  blank = false,
  dayNum,
  onPress,
}: Props) {
  const ref = useRef<View>(null);

  if (variant === 'year' && blank) {
    return <View style={styles.yearBlank} />;
  }

  function handlePress() {
    if (isFuture) return;
    const node = ref.current;
    if (!node) return;
    node.measureInWindow((x, y, w, h) => {
      onPress(dateStr, category, { x, y, w, h });
    });
  }

  if (variant === 'year') {
    return (
      <Pressable
        ref={ref}
        onPress={handlePress}
        disabled={isFuture}
        style={[
          styles.yearCell,
          { backgroundColor: YEAR_BG[category] },
          isFuture && styles.future,
        ]}
        accessibilityRole="button"
        accessibilityLabel={dateStr}
      />
    );
  }

  return (
    <Pressable
      ref={ref}
      onPress={handlePress}
      disabled={isFuture}
      style={[
        styles.monthCell,
        {
          backgroundColor: MONTH_BG[category],
          borderColor: isToday ? Colors.activityTodayBorder : MONTH_BORDER[category],
          borderWidth: isToday ? 2 : 1,
        },
        isSpillover && styles.spillover,
      ]}
      accessibilityRole="button"
      accessibilityLabel={dateStr}
    >
      <Text
        style={[
          styles.monthNum,
          { color: MONTH_NUM[category] },
          isToday && styles.monthNumToday,
        ]}
      >
        {dayNum}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  yearCell: {
    width: YEAR_CELL_SIZE,
    height: YEAR_CELL_SIZE,
    borderRadius: 3,
  },
  yearBlank: {
    width: YEAR_CELL_SIZE,
    height: YEAR_CELL_SIZE,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
  future: {
    opacity: 0.4,
  },
  monthCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 5,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  spillover: {
    opacity: 0.4,
  },
  monthNum: {
    fontSize: 11,
  },
  monthNumToday: {
    fontWeight: '700',
  },
});
