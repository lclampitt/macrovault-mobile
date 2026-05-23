import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useTodaysFoodLog } from '../../hooks/useTodaysFoodLog';
import { useDeleteFoodLog } from '../../hooks/useDeleteFoodLog';
import LogNutritionTabs, { type LogTab } from './LogNutritionTabs';
import ManualEntryForm from './ManualEntryForm';
import TodaysLogList from './TodaysLogList';
import { LogCardsSkeleton } from './GoalPlannerSkeletons';

export default function LogNutritionCard() {
  const [tab, setTab] = useState<LogTab>('manual');
  const { entries, totals, loading, refetch } = useTodaysFoodLog();
  const { remove, deletingId } = useDeleteFoodLog(refetch);

  function handleTabChange(next: LogTab) {
    if (next === 'food') {
      Alert.alert(
        'Food Search',
        'Coming soon — Phase 10. Use Manual Entry for now.',
      );
      return; // stay on Manual Entry
    }
    setTab(next);
  }

  async function handleDelete(id: string) {
    await remove(id);
  }

  if (loading) {
    return <LogCardsSkeleton />;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Text style={styles.heading}>LOG TODAY'S NUTRITION</Text>
        <LogNutritionTabs active={tab} onChange={handleTabChange} />
        <View style={styles.formWrap}>
          <ManualEntryForm onAdded={refetch} />
        </View>
      </View>

      <TodaysLogList
        entries={entries}
        totals={totals}
        deletingId={deletingId}
        onDelete={handleDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
  },
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
  formWrap: {
    marginTop: 16,
  },
});
