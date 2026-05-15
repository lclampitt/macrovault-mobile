import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import type { TodayMacros } from '../../hooks/useTodayMacros';
import type { UserGoals } from '../../hooks/useUserGoals';
import CaloriesRing from './CaloriesRing';
import MacroRow from './MacroRow';
import GreetingCardSkeleton from './skeletons/GreetingCardSkeleton';

type Props = {
  time: string;
  period: string;
  macros: TodayMacros;
  goals: UserGoals | null;
  loading: boolean;
  error?: string | null;
};

export default function GreetingCard({ time, period, macros, goals, loading, error }: Props) {
  if (loading) return <GreetingCardSkeleton />;

  const goalCalories = goals?.calories ?? 0;
  const goalProtein = goals?.protein ?? 0;
  const goalCarbs = goals?.carbs ?? 0;
  const goalFat = goals?.fat ?? 0;

  const isEmpty = macros.calories === 0;
  const kcalDisplay = isEmpty ? '—' : macros.calories.toLocaleString();
  const remaining = Math.max(0, goalCalories - macros.calories);

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
          {error ? (
            <Text style={styles.errorText}>Failed to load · pull to retry</Text>
          ) : isEmpty ? (
            goalCalories > 0 ? (
              <Text style={styles.remaining}>
                <Text style={styles.remainingValueMuted}>
                  {goalCalories.toLocaleString()} kcal
                </Text>{' '}
                to spend
              </Text>
            ) : (
              <Text style={styles.remaining}>Set a calorie goal to get started.</Text>
            )
          ) : (
            <Text style={styles.remaining}>
              <Text style={styles.remainingValue}>{remaining.toLocaleString()} kcal</Text>
              {goalCalories > 0 ? ` left · ${goalCalories.toLocaleString()} target` : ' logged'}
            </Text>
          )}
        </View>
        <CaloriesRing consumed={macros.calories} goal={goalCalories} size={76} />
      </View>

      <View style={styles.bars}>
        <MacroRow
          label="Protein"
          current={macros.protein}
          goal={goalProtein}
          unit="g"
          color={Colors.proteinColor}
        />
        <MacroRow
          label="Carbs"
          current={macros.carbs}
          goal={goalCarbs}
          unit="g"
          color={Colors.carbsColor}
        />
        <MacroRow
          label="Fat"
          current={macros.fat}
          goal={goalFat}
          unit="g"
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
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 6,
  },
  bars: {
    gap: 9,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
});
