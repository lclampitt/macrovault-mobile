import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import CaloriesRing from './CaloriesRing';
import MacroRow from './MacroRow';

type Macro = { current: number; goal: number; unit: string };

type Props = {
  time: string;
  period: string;
  calories: { remaining: number; consumed: number; goal: number };
  macros: {
    protein: Macro;
    carbs: Macro;
    fat: Macro;
  };
};

export default function GreetingCard({ time, period, calories, macros }: Props) {
  const isEmpty = calories.consumed === 0;
  const kcalDisplay = isEmpty ? '—' : calories.consumed.toLocaleString();

  return (
    <View style={styles.card}>
      <View style={styles.kicker}>
        <View style={styles.kickerDot} />
        <Text style={styles.kickerText}>
          {time} · {period}
        </Text>
      </View>

      <View style={styles.main}>
        <View style={styles.left}>
          <Text style={styles.label}>CALORIES TODAY</Text>
          <Text style={[styles.kcal, isEmpty && styles.kcalEmpty]}>{kcalDisplay}</Text>
          <Text style={styles.remaining}>
            <Text style={[styles.remainingValue, isEmpty && styles.remainingValueMuted]}>
              {isEmpty
                ? `${calories.remaining.toLocaleString()} kcal`
                : `${Math.max(0, calories.goal - calories.consumed).toLocaleString()} kcal`}
            </Text>
            {isEmpty ? ' to spend' : ` left · ${calories.goal.toLocaleString()} target`}
          </Text>
        </View>
        <CaloriesRing consumed={calories.consumed} goal={calories.goal} size={76} />
      </View>

      <View style={styles.bars}>
        <MacroRow
          label="Protein"
          current={macros.protein.current}
          goal={macros.protein.goal}
          unit={macros.protein.unit}
          color={Colors.proteinColor}
        />
        <MacroRow
          label="Carbs"
          current={macros.carbs.current}
          goal={macros.carbs.goal}
          unit={macros.carbs.unit}
          color={Colors.carbsColor}
        />
        <MacroRow
          label="Fat"
          current={macros.fat.current}
          goal={macros.fat.goal}
          unit={macros.fat.unit}
          color={Colors.fatColor}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
  },
  kicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 8,
  },
  kickerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.accentLight,
  },
  kickerText: {
    color: Colors.accentLight,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  main: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: 16,
  },
  left: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    color: Colors.textHint,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  kcal: {
    color: Colors.textPrimary,
    fontSize: 34,
    fontWeight: '500',
    letterSpacing: -1,
    lineHeight: 38,
    fontVariant: ['tabular-nums'],
  },
  kcalEmpty: {
    color: Colors.textHint,
  },
  remaining: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 6,
  },
  remainingValue: {
    color: Colors.accentLight,
    fontWeight: '500',
  },
  remainingValueMuted: {
    color: Colors.textMuted,
  },
  bars: {
    gap: 9,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
});
