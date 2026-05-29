import { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Dumbbell, Trash2 } from 'lucide-react-native';
import { DS, Font, Tabular } from '../../lib/design-system';
import { parseLocalYmd } from '../../lib/date';
import { useWorkoutById } from '../../hooks/useWorkoutById';
import { useDeleteWorkout } from '../../hooks/useDeleteWorkout';

const DESTRUCTIVE = '#E5736A';

function fmtFullDate(ymd: string): string {
  if (!ymd) return '';
  return parseLocalYmd(ymd).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function parseNum(s: string): number {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export default function WorkoutDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error } = useWorkoutById(id ?? null);
  const { remove, deletingId } = useDeleteWorkout();

  const totals = useMemo(() => {
    if (!data) return { sets: 0, volume: 0 };
    let sets = 0;
    let volume = 0;
    for (const ex of data.exercises) {
      for (const s of ex.sets) {
        sets += 1;
        volume += parseNum(s.weight) * parseNum(s.reps);
      }
    }
    return { sets, volume };
  }, [data]);

  function handleBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/log-workout');
  }

  function handleDelete() {
    if (!data) return;
    Alert.alert(
      'Delete workout?',
      `"${data.name}" will be removed from your history. This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const r = await remove(data.id);
            if (!r.error) {
              router.replace('/log-workout');
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          hitSlop={8}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeft size={18} color={DS.text} strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>Workout details</Text>
        {data ? (
          <Pressable
            onPress={handleDelete}
            disabled={deletingId === data.id}
            hitSlop={8}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="Delete workout"
          >
            <Trash2
              size={16}
              color={deletingId === data.id ? DS.textTertiary : DESTRUCTIVE}
              strokeWidth={2}
            />
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={DS.accent} />
        </View>
      ) : error || !data ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {error ?? "Couldn't load that workout."}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.workoutName}>{data.name}</Text>
          <Text style={styles.dateLabel}>{fmtFullDate(data.date)}</Text>

          <View style={styles.statsCard}>
            <Stat
              label="EXERCISES"
              value={String(data.exercises.length)}
            />
            <View style={styles.statDivider} />
            <Stat label="SETS" value={String(totals.sets)} />
            <View style={styles.statDivider} />
            <Stat
              label="VOLUME"
              value={Math.round(totals.volume).toLocaleString('en-US')}
              unit="lb"
            />
          </View>

          {data.notes ? (
            <View style={styles.notesCard}>
              <Text style={styles.notesLabel}>NOTES</Text>
              <Text style={styles.notesBody}>{data.notes}</Text>
            </View>
          ) : null}

          {data.exercises.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                No exercises were recorded for this workout.
              </Text>
            </View>
          ) : (
            data.exercises.map((ex, exIdx) => (
              <View key={exIdx} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseIcon}>
                    <Dumbbell size={14} color={DS.accent} strokeWidth={2} />
                  </View>
                  <View style={styles.exerciseTitleCol}>
                    <Text style={styles.exerciseTitle} numberOfLines={1}>
                      {ex.name}
                    </Text>
                    <Text style={styles.exerciseSubtitle}>
                      {ex.sets.length}{' '}
                      {ex.sets.length === 1 ? 'set' : 'sets'}
                    </Text>
                  </View>
                </View>

                {ex.sets.length === 0 ? (
                  <Text style={styles.noSetsText}>No sets recorded.</Text>
                ) : (
                  <View style={styles.setsTable}>
                    <View style={styles.setsHeaderRow}>
                      <Text style={[styles.setsHeaderText, styles.colSet]}>
                        SET
                      </Text>
                      <Text style={[styles.setsHeaderText, styles.colWeight]}>
                        LBS
                      </Text>
                      <Text style={[styles.setsHeaderText, styles.colReps]}>
                        REPS
                      </Text>
                    </View>
                    {ex.sets.map((s, i) => (
                      <View key={i} style={styles.setRow}>
                        <Text style={[styles.setNum, Tabular, styles.colSet]}>
                          {i + 1}
                        </Text>
                        <Text
                          style={[styles.setValue, Tabular, styles.colWeight]}
                        >
                          {s.weight || '—'}
                        </Text>
                        <Text
                          style={[styles.setValue, Tabular, styles.colReps]}
                        >
                          {s.reps || '—'}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <View style={styles.statCol}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statValueRow}>
        <Text style={[styles.statValue, Tabular]}>{value}</Text>
        {unit ? <Text style={styles.statUnit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: DS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Font.bold,
    fontSize: 15,
    color: DS.text,
    letterSpacing: -0.2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontFamily: Font.medium,
    fontSize: 13,
    color: DESTRUCTIVE,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
  },
  workoutName: {
    fontFamily: Font.bold,
    fontSize: 22,
    color: DS.text,
    letterSpacing: -0.4,
  },
  dateLabel: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.textTertiary,
    marginTop: 4,
    marginBottom: 14,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 14,
  },
  statCol: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, backgroundColor: DS.border },
  statLabel: {
    fontFamily: Font.bold,
    fontSize: 9,
    color: DS.textTertiary,
    letterSpacing: 0.6,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statValue: {
    fontFamily: Font.bold,
    fontSize: 17,
    color: DS.text,
  },
  statUnit: {
    fontFamily: Font.medium,
    fontSize: 10,
    color: DS.textTertiary,
  },
  notesCard: {
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 6,
  },
  notesLabel: {
    fontFamily: Font.bold,
    fontSize: 9,
    color: DS.textTertiary,
    letterSpacing: 0.6,
  },
  notesBody: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.text,
    lineHeight: 17,
  },
  emptyCard: {
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 18,
  },
  emptyText: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.textTertiary,
    textAlign: 'center',
  },
  exerciseCard: {
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  exerciseIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseTitleCol: { flex: 1 },
  exerciseTitle: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: DS.text,
  },
  exerciseSubtitle: {
    fontFamily: Font.medium,
    fontSize: 10,
    color: DS.textTertiary,
    marginTop: 2,
  },
  noSetsText: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DS.textTertiary,
    fontStyle: 'italic',
  },
  setsTable: { gap: 4 },
  setsHeaderRow: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: DS.divider,
  },
  setsHeaderText: {
    fontFamily: Font.bold,
    fontSize: 9,
    color: '#555',
    letterSpacing: 0.8,
  },
  setRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: DS.divider,
  },
  setNum: {
    fontFamily: Font.bold,
    fontSize: 12,
    color: DS.textSecondary,
  },
  setValue: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: DS.text,
  },
  colSet: { width: 36 },
  colWeight: { flex: 1, textAlign: 'center' },
  colReps: { flex: 1, textAlign: 'right' },
  bottomSpacer: { height: 120 },
});
