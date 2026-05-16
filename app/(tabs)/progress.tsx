import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useBodyCompositionData } from '../../hooks/useBodyCompositionData';
import type { TimeRange } from '../../lib/bodyComp';
import BodyCompositionSection from '../../components/progress/BodyCompositionSection';
import BodyCompEntryForm from '../../components/progress/BodyCompEntryForm';
import BodyCompHistoryList from '../../components/progress/BodyCompHistoryList';

export default function ProgressScreen() {
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const { entries, allEntries, stats, loading, error, refetch } =
    useBodyCompositionData(timeRange);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <BodyCompositionSection
          entries={entries}
          allEntries={allEntries}
          stats={stats}
          loading={loading}
          error={error}
          timeRange={timeRange}
          onRangeChange={setTimeRange}
        />

        <View style={styles.gap} />
        <BodyCompEntryForm onSaved={refetch} />

        <View style={styles.gap} />
        <BodyCompHistoryList entries={allEntries} onDeleted={refetch} />
        {/* Workout Progress section: future phase 6c */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24, // clearance below the persistent top bar
    paddingBottom: 120, // clearance for the floating bottom navbar
  },
  gap: {
    height: 16,
  },
});
