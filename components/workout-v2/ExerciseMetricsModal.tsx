import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { Font, Tabular } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import type { Tokens } from '../../lib/tokens';
import type { ActiveExercise } from '../../lib/active-workout-context';

type Props = {
  visible: boolean;
  exercise: ActiveExercise | null;
  /** Same-exercise total volume from the user's most recent prior session,
   *  or null when unavailable. Used to compute the volume-change tile. */
  priorTotalVolume?: number | null;
  onClose: () => void;
};

function parseNum(s: string): number {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

function fmtPerRep(n: number): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export default function ExerciseMetricsModal({
  visible,
  exercise,
  priorTotalVolume = null,
  onClose,
}: Props) {
  const t = useTokens();
  const metrics = useMemo(() => {
    if (!exercise) {
      return {
        totalVolume: 0,
        totalReps: 0,
        avgPerRep: 0,
        change: null as number | null,
        completedSets: 0,
      };
    }
    let vol = 0;
    let reps = 0;
    let done = 0;
    for (const s of exercise.sets) {
      if (!s.completed) continue;
      done += 1;
      vol += parseNum(s.weight) * parseNum(s.reps);
      reps += parseNum(s.reps);
    }
    return {
      totalVolume: vol,
      totalReps: reps,
      avgPerRep: reps > 0 ? vol / reps : 0,
      change:
        priorTotalVolume != null && priorTotalVolume > 0
          ? vol - priorTotalVolume
          : null,
      completedSets: done,
    };
  }, [exercise, priorTotalVolume]);

  if (!exercise) return null;

  const changeStr =
    metrics.change == null
      ? '—'
      : `${metrics.change > 0 ? '+' : metrics.change < 0 ? '−' : ''}${fmtInt(Math.abs(metrics.change))}`;
  const changeColor =
    metrics.change == null
      ? t.textTertiary
      : metrics.change === 0
        ? t.textSecondary
        : metrics.change > 0
          ? t.primary
          : '#A87C5E'; // wrong-direction tan, never red

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.backdrop, { backgroundColor: t.bgOverlay }]}
        onPress={onClose}
      >
        <Pressable
          style={[
            styles.modal,
            { backgroundColor: t.bgCard, borderColor: t.borderDefault },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.title, { color: t.textPrimary }]}>Exercise metrics</Text>
              <Text
                style={[styles.exerciseName, { color: t.textSecondary }]}
                numberOfLines={1}
              >
                {exercise.name}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={6}
              style={[
                styles.closeBtn,
                { backgroundColor: t.bgCardElevated, borderColor: t.borderDefault },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={12} color={t.textSecondary} strokeWidth={2} />
            </Pressable>
          </View>

          <Text style={[styles.sessionLine, { color: t.textTertiary }]}>
            <Text style={[styles.sessionLineNum, Tabular, { color: t.primary }]}>
              {metrics.completedSets}
            </Text>{' '}
            of {exercise.sets.length} sets completed this session
          </Text>

          <View style={styles.grid}>
            <Tile
              tokens={t}
              label="TOTAL VOLUME"
              value={fmtInt(metrics.totalVolume)}
              unit="lb"
            />
            <Tile
              tokens={t}
              label="VOLUME CHANGE"
              value={changeStr}
              unit={metrics.change == null ? 'vs prior' : 'lb'}
              valueColor={changeColor}
              footnote={metrics.change == null ? 'No prior session yet' : null}
            />
            <Tile
              tokens={t}
              label="TOTAL REPS"
              value={fmtInt(metrics.totalReps)}
              unit="reps"
            />
            <Tile
              tokens={t}
              label="AVG WEIGHT / REP"
              value={
                metrics.totalReps > 0 ? fmtPerRep(metrics.avgPerRep) : '—'
              }
              unit="lb/rep"
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type TileProps = {
  tokens: Tokens;
  label: string;
  value: string;
  unit: string;
  valueColor?: string;
  footnote?: string | null;
};

function Tile({ tokens: t, label, value, unit, valueColor, footnote }: TileProps) {
  return (
    <View
      style={[
        styles.tile,
        { backgroundColor: t.bgCardElevated, borderColor: t.borderDefault },
      ]}
    >
      <Text style={[styles.tileLabel, { color: t.textTertiary }]}>{label}</Text>
      <View style={styles.tileValueRow}>
        <Text
          style={[
            styles.tileValue,
            Tabular,
            { color: valueColor ?? t.textPrimary },
          ]}
        >
          {value}
        </Text>
        <Text style={[styles.tileUnit, { color: t.textTertiary }]}>{unit}</Text>
      </View>
      {footnote ? (
        <Text style={[styles.tileFootnote, { color: t.textQuaternary }]}>{footnote}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontFamily: Font.bold,
    fontSize: 16,
    letterSpacing: -0.3,
  },
  exerciseName: {
    fontFamily: Font.medium,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionLine: {
    fontFamily: Font.medium,
    fontSize: 11,
    marginBottom: 14,
  },
  sessionLineNum: {
    fontFamily: Font.bold,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tile: {
    width: '48%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tileLabel: {
    fontFamily: Font.bold,
    fontSize: 9,
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  tileValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  tileValue: {
    fontFamily: Font.bold,
    fontSize: 20,
    letterSpacing: -0.4,
  },
  tileUnit: {
    fontFamily: Font.medium,
    fontSize: 10,
  },
  tileFootnote: {
    fontFamily: Font.medium,
    fontSize: 9,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
