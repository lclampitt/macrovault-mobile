import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import type { ActiveGoal } from '../../hooks/useActiveGoal';
import MacroProgressBar from './MacroProgressBar';

type Props = {
  goal: ActiveGoal;
  onEditGoal: () => void;
};

export default function ActiveGoalCard({ goal, onEditGoal }: Props) {
  // Web: max = protein + carbs + fat (composition share, not today's intake).
  const totalMacroG = goal.protein + goal.carbs + goal.fat || 1;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <Text style={styles.phaseName}>{goal.phaseName}</Text>
          <Text style={styles.subtitle}>
            {goal.hasTimeframe ? `${goal.timeframeWeeks} weeks · ` : ''}
            {goal.calories} kcal/day
          </Text>
        </View>
        <View style={styles.activePill}>
          <Text style={styles.activePillText}>Active</Text>
        </View>
      </View>

      <View style={styles.bars}>
        <MacroProgressBar
          label="Protein"
          value={goal.protein}
          max={totalMacroG}
          color={Colors.proteinColor}
        />
        <MacroProgressBar
          label="Carbs"
          value={goal.carbs}
          max={totalMacroG}
          color={Colors.carbsColor}
        />
        <MacroProgressBar
          label="Fat"
          value={goal.fat}
          max={totalMacroG}
          color={Colors.fatColor}
        />
      </View>

      <Pressable
        style={styles.editBtn}
        onPress={onEditGoal}
        accessibilityRole="button"
        accessibilityLabel="Edit goal"
      >
        <Text style={styles.editBtnText}>Edit goal</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    gap: 18,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  topLeft: {
    flex: 1,
    gap: 4,
  },
  phaseName: {
    color: Colors.accentLight,
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  activePill: {
    borderColor: Colors.borderAccent,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: Colors.accentSofter,
  },
  activePillText: {
    color: Colors.accentLight,
    fontSize: 11,
    fontWeight: '700',
  },
  bars: {
    gap: 14,
  },
  editBtn: {
    alignSelf: 'flex-start',
    borderColor: Colors.borderAccent,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  editBtnText: {
    color: Colors.accentLight,
    fontSize: 13,
    fontWeight: '600',
  },
});
