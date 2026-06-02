import { StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { Font, Radius, Tabular } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
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
  const t = useTokens();
  const completedCount = completed.filter(Boolean).length;
  const target = 5; // user's workouts-per-week goal (placeholder until wired to settings)

  return (
    <View style={styles.outer}>
      <Card>
        <View style={styles.headerRow}>
          <SectionLabel>This week</SectionLabel>
          <View style={styles.countRow}>
            <Text
              style={[styles.countValue, Tabular, { color: t.textPrimary }]}
            >
              {completedCount}
            </Text>
            <Text style={[styles.countSlash, { color: t.textQuaternary }]}>
              /
            </Text>
            <Text
              style={[styles.countTarget, Tabular, { color: t.textTertiary }]}
            >
              {target}
            </Text>
          </View>
        </View>

        <View style={styles.daysRow}>
          {LETTERS.map((letter, i) => {
            const isToday = i === todayIndex;
            const done = completed[i];
            const cellBg = done
              ? t.primary
              : isToday
                ? t.primaryTintBg
                : t.bgTrack;
            const cellBorder = isToday
              ? t.primaryBorderStrong
              : done
                ? t.primary
                : t.borderDefault;
            return (
              <View key={i} style={styles.dayCol}>
                <Text
                  style={[
                    styles.letter,
                    { color: isToday ? t.primary : t.textTertiary },
                  ]}
                >
                  {letter}
                </Text>
                <View
                  style={[
                    styles.cell,
                    {
                      backgroundColor: cellBg,
                      borderColor: cellBorder,
                      borderWidth: 1,
                      borderStyle: isToday ? 'dashed' : 'solid',
                    },
                  ]}
                >
                  {done ? (
                    <Check
                      size={12}
                      color={t.textOnPrimary}
                      strokeWidth={3}
                    />
                  ) : isToday ? (
                    <View
                      style={[styles.todayDot, { backgroundColor: t.primary }]}
                    />
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
  },
  countSlash: {
    fontSize: 11,
  },
  countTarget: {
    fontFamily: Font.medium,
    fontSize: 12,
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
    fontFamily: Font.bold,
    fontSize: 10,
  },
  cell: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.cardCompact - 4, // ~8 for rounded-md
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
