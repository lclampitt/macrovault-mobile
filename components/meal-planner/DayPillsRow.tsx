import { ScrollView, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import {
  addDays,
  DAY_LABELS,
  type MealPlanEntry,
} from '../../hooks/useMealPlanWeek';
import DayPill from './DayPill';

type Props = {
  weekStart: Date;
  entries: MealPlanEntry[];
  selectedDay: number; // 0..6
  onSelectDay: (day: number) => void;
};

export default function DayPillsRow({
  weekStart,
  entries,
  selectedDay,
  onSelectDay,
}: Props) {
  // Precompute per-day totals + has-entries in one pass.
  const perDay = Array.from({ length: 7 }, (_, day) => {
    let kcal = 0;
    let count = 0;
    for (const e of entries) {
      if (e.day_of_week === day) {
        kcal += e.calories;
        count += 1;
      }
    }
    return { kcal, hasEntries: count > 0 };
  });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {DAY_LABELS.map((label, day) => {
        const date = addDays(weekStart, day);
        return (
          <DayPill
            key={day}
            label={label}
            dayNum={String(date.getDate())}
            kcal={perDay[day].kcal}
            hasEntries={perDay[day].hasEntries}
            selected={day === selectedDay}
            onPress={() => onSelectDay(day)}
          />
        );
      })}
      <View style={styles.endSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
    paddingTop: 2,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  row: {
    gap: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  endSpacer: { width: 4 },
});
