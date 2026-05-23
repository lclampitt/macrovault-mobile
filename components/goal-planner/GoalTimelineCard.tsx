import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import type { ActiveGoal } from '../../hooks/useActiveGoal';

type Props = {
  goal: ActiveGoal;
};

export default function GoalTimelineCard({ goal }: Props) {
  const pct = Math.min(Math.max(goal.percentComplete, 0), 100);
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>GOAL TIMELINE</Text>

      <Text style={styles.week}>
        Week {goal.weekNumber}
        <Text style={styles.weekOf}> of {goal.timeframeWeeks}</Text>
      </Text>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>

      <View style={styles.meta}>
        <Text style={styles.metaText}>{Math.round(pct)}% complete</Text>
        <Text style={styles.metaText}>{goal.daysLeft} days left</Text>
      </View>

      <View style={styles.divider} />
      <Text style={styles.motivation}>{goal.motivation}</Text>
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
  week: {
    color: Colors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
  },
  weekOf: {
    color: Colors.textMuted,
    fontSize: 18,
    fontWeight: '400',
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.trackMuted,
    overflow: 'hidden',
    marginTop: 14,
  },
  fill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  metaText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginVertical: 16,
  },
  motivation: {
    color: Colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
});
