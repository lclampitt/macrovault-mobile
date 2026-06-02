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
import { Font, Tabular } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import type { Tokens } from '../../lib/tokens';
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
  const t = useTokens();
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
          <ChevronLeft size={18} color={t.textPrimary} strokeWidth={2} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Workout details</Text>
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
              color={deletingId === data.id ? t.textTertiary : DESTRUCTIVE}
              strokeWidth={2}
            />
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={t.primary} />
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
          <Text style={[styles.workoutName, { color: t.textPrimary }]}>{data.name}</Text>
          <Text style={[styles.dateLabel, { color: t.textTertiary }]}>{fmtFullDate(data.date)}</Text>

          <View
            style={[
              styles.statsCard,
              { backgroundColor: t.bgCard, borderColor: t.borderDefault },
            ]}
          >
            <Stat
              tokens={t}
              label="EXERCISES"
              value={String(data.exercises.length)}
            />
            <View style={[styles.statDivider, { backgroundColor: t.borderDefault }]} />
            <Stat tokens={t} label="SETS" value={String(totals.sets)} />
            <View style={[styles.statDivider, { backgroundColor: t.borderDefault }]} />
            <Stat
              tokens={t}
              label="VOLUME"
              value={Math.round(totals.volume).toLocaleString('en-US')}
              unit="lb"
            />
          </View>

          {data.notes ? (
            <View
              style={[
                styles.notesCard,
                { backgroundColor: t.bgCard, borderColor: t.borderDefault },
              ]}
            >
              <Text style={[styles.notesLabel, { color: t.textTertiary }]}>NOTES</Text>
              <Text style={[styles.notesBody, { color: t.textPrimary }]}>{data.notes}</Text>
            </View>
          ) : null}

          {data.exercises.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: t.bgCard, borderColor: t.borderDefault },
              ]}
            >
              <Text style={[styles.emptyText, { color: t.textTertiary }]}>
                No exercises were recorded for this workout.
              </Text>
            </View>
          ) : (
            data.exercises.map((ex, exIdx) => (
              <View
                key={exIdx}
                style={[
                  styles.exerciseCard,
                  { backgroundColor: t.bgCard, borderColor: t.borderDefault },
                ]}
              >
                <View style={styles.exerciseHeader}>
                  <View
                    style={[
                      styles.exerciseIcon,
                      {
                        backgroundColor: t.primaryTintBg,
                        borderColor: t.primaryTintBorder,
                      },
                    ]}
                  >
                    <Dumbbell size={14} color={t.primary} strokeWidth={2} />
                  </View>
                  <View style={styles.exerciseTitleCol}>
                    <Text style={[styles.exerciseTitle, { color: t.textPrimary }]} numberOfLines={1}>
                      {ex.name}
                    </Text>
                    <Text style={[styles.exerciseSubtitle, { color: t.textTertiary }]}>
                      {ex.sets.length}{' '}
                      {ex.sets.length === 1 ? 'set' : 'sets'}
                    </Text>
                  </View>
                </View>

                {ex.sets.length === 0 ? (
                  <Text style={[styles.noSetsText, { color: t.textTertiary }]}>No sets recorded.</Text>
                ) : (
                  <View style={styles.setsTable}>
                    <View style={[styles.setsHeaderRow, { borderBottomColor: t.borderSubtle }]}>
                      <Text style={[styles.setsHeaderText, styles.colSet, { color: t.textTertiary }]}>
                        SET
                      </Text>
                      <Text style={[styles.setsHeaderText, styles.colWeight, { color: t.textTertiary }]}>
                        LBS
                      </Text>
                      <Text style={[styles.setsHeaderText, styles.colReps, { color: t.textTertiary }]}>
                        REPS
                      </Text>
                    </View>
                    {ex.sets.map((s, i) => (
                      <View
                        key={i}
                        style={[styles.setRow, { borderBottomColor: t.borderSubtle }]}
                      >
                        <Text style={[styles.setNum, Tabular, styles.colSet, { color: t.textSecondary }]}>
                          {i + 1}
                        </Text>
                        <Text
                          style={[styles.setValue, Tabular, styles.colWeight, { color: t.textPrimary }]}
                        >
                          {s.weight || '—'}
                        </Text>
                        <Text
                          style={[styles.setValue, Tabular, styles.colReps, { color: t.textPrimary }]}
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
  tokens: t,
  label,
  value,
  unit,
}: {
  tokens: Tokens;
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <View style={styles.statCol}>
      <Text style={[styles.statLabel, { color: t.textTertiary }]}>{label}</Text>
      <View style={styles.statValueRow}>
        <Text style={[styles.statValue, Tabular, { color: t.textPrimary }]}>{value}</Text>
        {unit ? <Text style={[styles.statUnit, { color: t.textTertiary }]}>{unit}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
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
    letterSpacing: -0.4,
  },
  dateLabel: {
    fontFamily: Font.medium,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 14,
  },
  statsCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 14,
  },
  statCol: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1 },
  statLabel: {
    fontFamily: Font.bold,
    fontSize: 9,
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
  },
  statUnit: {
    fontFamily: Font.medium,
    fontSize: 10,
  },
  notesCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 6,
  },
  notesLabel: {
    fontFamily: Font.bold,
    fontSize: 9,
    letterSpacing: 0.6,
  },
  notesBody: {
    fontFamily: Font.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 18,
  },
  emptyText: {
    fontFamily: Font.medium,
    fontSize: 12,
    textAlign: 'center',
  },
  exerciseCard: {
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
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseTitleCol: { flex: 1 },
  exerciseTitle: {
    fontFamily: Font.bold,
    fontSize: 13,
  },
  exerciseSubtitle: {
    fontFamily: Font.medium,
    fontSize: 10,
    marginTop: 2,
  },
  noSetsText: {
    fontFamily: Font.medium,
    fontSize: 11,
    fontStyle: 'italic',
  },
  setsTable: { gap: 4 },
  setsHeaderRow: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
  },
  setsHeaderText: {
    fontFamily: Font.bold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  setRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  setNum: {
    fontFamily: Font.bold,
    fontSize: 12,
  },
  setValue: {
    fontFamily: Font.bold,
    fontSize: 13,
  },
  colSet: { width: 36 },
  colWeight: { flex: 1, textAlign: 'center' },
  colReps: { flex: 1, textAlign: 'right' },
  bottomSpacer: { height: 120 },
});
