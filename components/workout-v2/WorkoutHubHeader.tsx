import { StyleSheet, Text, View } from 'react-native';
import { DS, Font, Tabular } from '../../lib/design-system';
import PulseDot from '../ds/PulseDot';

type Props = {
  workoutsThisMonth: number;
  templateCount: number;
};

export default function WorkoutHubHeader({
  workoutsThisMonth,
  templateCount,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Workouts</Text>
      <View style={styles.banner}>
        <PulseDot size={6} />
        <Text style={[styles.metric, Tabular]}>
          {workoutsThisMonth}{' '}
          {workoutsThisMonth === 1
            ? 'WORKOUT THIS MONTH'
            : 'WORKOUTS THIS MONTH'}
        </Text>
        <Text style={styles.dot}>·</Text>
        <Text style={[styles.subMetric, Tabular]}>
          {templateCount} {templateCount === 1 ? 'template' : 'templates'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    fontFamily: Font.bold,
    fontSize: 28,
    color: DS.text,
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  metric: {
    fontFamily: Font.semibold,
    fontSize: 11,
    color: DS.accent,
    letterSpacing: 0.6,
  },
  dot: {
    color: DS.textDimmest,
    fontSize: 11,
  },
  subMetric: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DS.textSecondary,
  },
});
