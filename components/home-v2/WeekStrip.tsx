import { StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { DS, Font, Radius, Tabular } from '../../lib/design-system';
import Card from '../ds/Card';
import SectionLabel from '../ds/SectionLabel';

type Props = {
  /** Mon-Sun completion flags (length 7). */
  completed: boolean[];
  /** 0=Mon … 6=Sun. */
  todayIndex: number;
};

const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function WeekStrip({ completed, todayIndex }: Props) {
  const completedCount = completed.filter(Boolean).length;
  const target = 5; // user's workouts-per-week goal (placeholder until wired to settings)

  return (
    <View style={styles.outer}>
      <Card>
        <View style={styles.headerRow}>
          <SectionLabel>This week</SectionLabel>
          <View style={styles.countRow}>
            <Text style={[styles.countValue, Tabular]}>{completedCount}</Text>
            <Text style={styles.countSlash}>/</Text>
            <Text style={[styles.countTarget, Tabular]}>{target}</Text>
          </View>
        </View>

        <View style={styles.daysRow}>
          {LETTERS.map((letter, i) => {
            const isToday = i === todayIndex;
            const done = completed[i];
            return (
              <View key={i} style={styles.dayCol}>
                <Text
                  style={[
                    styles.letter,
                    { color: isToday ? DS.accent : DS.textQuaternary },
                  ]}
                >
                  {letter}
                </Text>
                <View
                  style={[
                    styles.cell,
                    done
                      ? styles.cellDone
                      : isToday
                        ? styles.cellToday
                        : styles.cellEmpty,
                  ]}
                >
                  {done ? (
                    <Check size={12} color="#000" strokeWidth={3} />
                  ) : isToday ? (
                    <View style={styles.todayDot} />
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  countValue: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: DS.text,
  },
  countSlash: {
    fontSize: 11,
    color: DS.textQuaternary,
  },
  countTarget: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.textSecondary,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  letter: {
    fontFamily: Font.medium,
    fontSize: 10,
  },
  cell: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.cardCompact - 4, // ~8 for rounded-md
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellDone: {
    backgroundColor: DS.accent,
  },
  cellToday: {
    backgroundColor: DS.accentSoft,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  cellEmpty: {
    backgroundColor: DS.surfaceFlat,
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DS.accent,
  },
});
