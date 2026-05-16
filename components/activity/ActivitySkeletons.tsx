import { StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { YEAR_CELL_GAP, YEAR_CELL_SIZE } from './ActivityCell';

/** Skeleton grid roughly matching the year heatmap footprint. */
export function ActivityGridSkeleton() {
  const months = Array.from({ length: 12 });
  const colsPerMonth = 5;
  return (
    <View style={styles.grid}>
      <View style={styles.weekdays}>
        {Array.from({ length: 7 }).map((_, i) => (
          <View key={i} style={styles.weekdaySlot} />
        ))}
      </View>
      <View style={styles.months}>
        {months.map((_, mi) => (
          <View key={mi} style={styles.month}>
            <View style={styles.monthLabel} />
            <View style={styles.cols}>
              {Array.from({ length: colsPerMonth }).map((__, ci) => (
                <View key={ci} style={styles.col}>
                  {Array.from({ length: 7 }).map((___, ri) => (
                    <View key={ri} style={styles.cell} />
                  ))}
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 8,
  },
  weekdays: {
    gap: YEAR_CELL_GAP,
    paddingTop: 20,
  },
  weekdaySlot: {
    width: 20,
    height: YEAR_CELL_SIZE,
  },
  months: {
    flexDirection: 'row',
    gap: 8,
  },
  month: {
    gap: 6,
  },
  monthLabel: {
    width: 24,
    height: 9,
    borderRadius: 3,
    backgroundColor: Colors.surfaceMuted,
  },
  cols: {
    flexDirection: 'row',
    gap: YEAR_CELL_GAP,
  },
  col: {
    gap: YEAR_CELL_GAP,
  },
  cell: {
    width: YEAR_CELL_SIZE,
    height: YEAR_CELL_SIZE,
    borderRadius: 3,
    backgroundColor: Colors.surfaceMuted,
  },
});
