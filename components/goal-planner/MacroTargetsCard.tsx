import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import type { ActiveGoal } from '../../hooks/useActiveGoal';
import MacroTargetTile from './MacroTargetTile';

type Props = {
  goal: ActiveGoal;
};

export default function MacroTargetsCard({ goal }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>MACRO TARGETS</Text>
      <View style={styles.grid}>
        <View style={styles.row}>
          <MacroTargetTile label="Calories" value={goal.calories} unit="kcal" />
          <MacroTargetTile label="Protein" value={goal.protein} unit="g" />
        </View>
        <View style={styles.row}>
          <MacroTargetTile label="Carbs" value={goal.carbs} unit="g" />
          <MacroTargetTile label="Fat" value={goal.fat} unit="g" />
        </View>
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
    padding: 18,
  },
  heading: {
    color: Colors.textHint,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  grid: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
});
