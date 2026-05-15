import { StyleSheet, View } from 'react-native';
import ThisWeekCard from './ThisWeekCard';
import WeightCard from './WeightCard';

type Props = {
  thisWeek: {
    completed: number;
    target: number;
    status: string;
  };
  weight: {
    current: number;
    unit: string;
    lastUpdated: string;
    history: number[];
  };
};

export default function StatCardRow({ thisWeek, weight }: Props) {
  return (
    <View style={styles.row}>
      <ThisWeekCard
        completed={thisWeek.completed}
        target={thisWeek.target}
        status={thisWeek.status}
      />
      <WeightCard
        current={weight.current}
        unit={weight.unit}
        lastUpdated={weight.lastUpdated}
        history={weight.history}
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
