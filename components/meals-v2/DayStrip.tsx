import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Font, Radius, Tabular } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';

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
  const t = useTokens();
  return (
    <View style={styles.row}>
      {days.map((d, i) => {
        const isSelected = i === selectedIndex;
        return (
          <Pressable
            key={i}
            onPress={() => onSelect(i)}
            style={[
              styles.cell,
              { backgroundColor: t.bgCard, borderColor: t.borderDefault },
              isSelected && {
                backgroundColor: t.primaryTintBg,
                borderColor: t.primaryBorderStrong,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${d.letter} ${d.dateNum}`}
            accessibilityState={{ selected: isSelected }}
          >
            {d.logged ? (
              <View
                style={[
                  styles.loggedDot,
                  { backgroundColor: t.primary },
                  !isSelected && styles.loggedDotMuted,
                ]}
              />
            ) : null}
            <Text
              style={[
                styles.letter,
                { color: isSelected ? t.primary : t.textTertiary },
              ]}
            >
              {d.letter}
            </Text>
            <Text
              style={[
                styles.date,
                Tabular,
                { color: isSelected ? t.textPrimary : t.textSecondary },
              ]}
            >
              {d.dateNum}
            </Text>
            <Text
              style={[
                styles.kcal,
                Tabular,
                {
                  color: isSelected ? t.primary : t.textQuaternary,
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
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
    position: 'relative',
  },
  loggedDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  loggedDotMuted: {
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
