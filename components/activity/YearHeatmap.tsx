import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { fmtLocalDate } from '../../lib/date';
import type { DayCategory, DayState } from '../../hooks/useActivityData';
import ActivityCell, {
  YEAR_CELL_GAP,
  YEAR_CELL_SIZE,
  type CellAnchor,
} from './ActivityCell';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const WEEKDAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

/** Port of getMonthWeeks: columns of 7 (Sun..Sat); out-of-month cells = null. */
function getMonthWeeks(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();
  const totalCols = Math.ceil((startWeekday + daysInMonth) / 7);
  const cols: (number | null)[][] = [];
  for (let c = 0; c < totalCols; c++) {
    const col: (number | null)[] = [];
    for (let r = 0; r < 7; r++) {
      const dayNum = c * 7 + r - startWeekday + 1;
      col.push(dayNum < 1 || dayNum > daysInMonth ? null : dayNum);
    }
    cols.push(col);
  }
  return cols;
}

type Props = {
  byDate: Record<string, DayState>;
  year: number;
  today: Date;
  onCellPress: (dateStr: string, category: DayCategory, anchor: CellAnchor) => void;
};

export default function YearHeatmap({ byDate, year, today, onCellPress }: Props) {
  const todayStr = fmtLocalDate(today);
  const currentMonth = today.getMonth();
  const isCurrentYear = year === today.getFullYear();

  return (
    <View style={styles.grid}>
      <View style={styles.weekdays}>
        {WEEKDAY_LABELS.map((label, i) => (
          <Text key={i} style={styles.weekdayText}>
            {label}
          </Text>
        ))}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.months}
      >
        {MONTH_LABELS.map((monthLabel, m) => {
          const cols = getMonthWeeks(year, m);
          const isCurrent = isCurrentYear && m === currentMonth;
          return (
            <View key={m} style={styles.month}>
              <Text style={[styles.monthLabel, isCurrent && styles.monthLabelCurrent]}>
                {monthLabel}
              </Text>
              <View style={styles.cols}>
                {cols.map((col, ci) => (
                  <View key={ci} style={styles.col}>
                    {col.map((dayNum, ri) => {
                      if (dayNum === null) {
                        return (
                          <ActivityCell
                            key={ri}
                            variant="year"
                            blank
                            dateStr=""
                            category="none"
                            onPress={onCellPress}
                          />
                        );
                      }
                      const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(
                        dayNum,
                      ).padStart(2, '0')}`;
                      const category = byDate[dateStr]?.category ?? 'none';
                      const isFuture = dateStr > todayStr;
                      return (
                        <ActivityCell
                          key={ri}
                          variant="year"
                          dateStr={dateStr}
                          category={category}
                          isFuture={isFuture}
                          onPress={onCellPress}
                        />
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 8,
  },
  weekdays: {
    flexDirection: 'column',
    gap: YEAR_CELL_GAP,
    paddingTop: 20,
  },
  weekdayText: {
    height: YEAR_CELL_SIZE,
    lineHeight: YEAR_CELL_SIZE,
    fontSize: 9,
    color: Colors.textHint,
  },
  months: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  month: {
    flexDirection: 'column',
  },
  monthLabel: {
    fontSize: 9,
    color: Colors.textHint,
    marginBottom: 6,
    paddingLeft: 2,
  },
  monthLabelCurrent: {
    color: Colors.textMuted,
    fontWeight: '500',
  },
  cols: {
    flexDirection: 'row',
    gap: YEAR_CELL_GAP,
  },
  col: {
    flexDirection: 'column',
    gap: YEAR_CELL_GAP,
  },
});
