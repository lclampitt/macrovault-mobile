import { StyleSheet, View } from 'react-native';
import ThisWeekCard from './ThisWeekCard';
import WeightCard from './WeightCard';
import type { ThisWeekWorkouts } from '../../hooks/useThisWeekWorkouts';
import type { CurrentWeight } from '../../hooks/useCurrentWeight';

type Props = {
  thisWeek: ThisWeekWorkouts;
  thisWeekLoading: boolean;
  thisWeekError?: string | null;
  weight: CurrentWeight;
  weightUnit: string;
  weightLoading: boolean;
  weightError?: string | null;
};

export default function StatCardRow({
  thisWeek,
  thisWeekLoading,
  thisWeekError,
  weight,
  weightUnit,
  weightLoading,
  weightError,
}: Props) {
  return (
    <View style={styles.row}>
      <ThisWeekCard
        completed={thisWeek.completed}
        target={thisWeek.target}
        loading={thisWeekLoading}
        error={thisWeekError}
      />
      <WeightCard
        current={weight.current}
        unit={weightUnit}
        lastAgo={weight.lastAgo}
        history={weight.history}
        loading={weightLoading}
        error={weightError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
});
