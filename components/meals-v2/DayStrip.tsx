import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DS, Font, Radius, Tabular } from '../../lib/design-system';

export type DayCell = {
  /** 'MON', 'TUE', ... */
  letter: string;
  /** Day-of-month: 25, 26, ... */
  dateNum: number;
  /** Sum of kcal for the day, or null when no meals. */
  kcal: number | null;
  /** True when any meal exists for the day. */
  logged: boolean;
};

type Props = {
  days: DayCell[];
  selectedIndex: number;
  onSelect: (i: number) => void;
};

function fmtNumber(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export default function DayStrip({ days, selectedIndex, onSelect }: Props) {
  return (
    <View style={styles.row}>
      {days.map((d, i) => {
        const isSelected = i === selectedIndex;
        return (
          <Pressable
            key={i}
            onPress={() => onSelect(i)}
            style={[styles.cell, isSelected && styles.cellSelected]}
            accessibilityRole="button"
            accessibilityLabel={`${d.letter} ${d.dateNum}`}
            accessibilityState={{ selected: isSelected }}
          >
            {d.logged ? (
              <View
                style={[
                  styles.loggedDot,
                  isSelected
                    ? styles.loggedDotSelected
                    : styles.loggedDotMuted,
                ]}
              />
            ) : null}
            <Text
              style={[
                styles.letter,
                { color: isSelected ? DS.accent : DS.textTertiary },
              ]}
            >
              {d.letter}
            </Text>
            <Text
              style={[
                styles.date,
                Tabular,
                { color: isSelected ? DS.text : DS.textSecondary },
              ]}
            >
              {d.dateNum}
            </Text>
            <Text
              style={[
                styles.kcal,
                Tabular,
                {
                  color: isSelected ? DS.accent : DS.textQuaternary,
                },
              ]}
            >
              {d.kcal != null ? fmtNumber(d.kcal) : '—'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  cell: {
    flex: 1,
    minHeight: 72,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: Radius.cardCompact,
    backgroundColor: DS.surface,
    borderWidth: 1,
    borderColor: DS.border,
    alignItems: 'center',
    gap: 4,
    position: 'relative',
  },
  cellSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  loggedDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  loggedDotSelected: {
    backgroundColor: DS.accent,
  },
  loggedDotMuted: {
    backgroundColor: DS.accent,
    opacity: 0.6,
  },
  letter: {
    fontFamily: Font.bold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  date: {
    fontFamily: Font.bold,
    fontSize: 18,
    letterSpacing: -0.3,
  },
  kcal: {
    fontFamily: Font.medium,
    fontSize: 9,
  },
});
