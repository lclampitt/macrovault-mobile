import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { fmtLocalDate } from '../../lib/date';
import type { DayCategory, DayState } from '../../hooks/useActivityData';
import ActivityCell, { type CellAnchor } from './ActivityCell';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Cell = { year: number; month: number; day: number; isSpillover: boolean };

function buildCells(year: number, month: number): Cell[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;

  const cells: Cell[] = [];
  for (let i = 0; i < startWeekday; i++) {
    const dayNum = prevMonthDays - startWeekday + i + 1;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    cells.push({ year: y, month: m, day: dayNum, isSpillover: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ year, month, day: d, isSpillover: false });
  }
  let trail = 1;
  while (cells.length < totalCells) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    cells.push({ year: y, month: m, day: trail++, isSpillover: true });
  }
  return cells;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

type Props = {
  byDate: Record<string, DayState>;
  year: number;
  month: number;
  today: Date;
  onCellPress: (dateStr: string, category: DayCategory, anchor: CellAnchor) => void;
};

export default function MonthCalendar({ byDate, year, month, today, onCellPress }: Props) {
  const todayStr = fmtLocalDate(today);
  const rows = chunk(buildCells(year, month), 7);

  return (
    <View>
      <View style={styles.weekdays}>
        {WEEKDAYS.map((d) => (
          <Text key={d} style={styles.weekdayText}>
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {rows.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((cell, ci) => {
              const dateStr = `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(
                cell.day,
              ).padStart(2, '0')}`;
              const category = byDate[dateStr]?.category ?? 'none';
              const isToday = dateStr === todayStr;
              const isFuture = dateStr > todayStr;
              return (
                <ActivityCell
                  key={ci}
                  variant="month"
                  dateStr={dateStr}
                  category={category}
                  dayNum={cell.day}
                  isToday={isToday}
                  isFuture={isFuture}
                  isSpillover={cell.isSpillover}
                  onPress={onCellPress}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  weekdays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    color: Colors.textHint,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  grid: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
});
