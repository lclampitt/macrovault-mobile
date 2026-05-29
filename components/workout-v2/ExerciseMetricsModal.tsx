import { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { DS, Font, Tabular } from '../../lib/design-system';
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
      ? DS.textTertiary
      : metrics.change === 0
        ? DS.textSecondary
        : metrics.change > 0
          ? DS.accent
          : '#A87C5E'; // wrong-direction tan, never red

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={styles.modal}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Exercise metrics</Text>
              <Text style={styles.exerciseName} numberOfLines={1}>
                {exercise.name}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={6}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={12} color={DS.textSecondary} strokeWidth={2} />
            </Pressable>
          </View>

          <Text style={styles.sessionLine}>
            <Text style={[styles.sessionLineNum, Tabular]}>
              {metrics.completedSets}
            </Text>{' '}
            of {exercise.sets.length} sets completed this session
          </Text>

          <View style={styles.grid}>
            <Tile
              label="TOTAL VOLUME"
              value={fmtInt(metrics.totalVolume)}
              unit="lb"
            />
            <Tile
              label="VOLUME CHANGE"
              value={changeStr}
              unit={metrics.change == null ? 'vs prior' : 'lb'}
              valueColor={changeColor}
              footnote={metrics.change == null ? 'No prior session yet' : null}
            />
            <Tile
              label="TOTAL REPS"
              value={fmtInt(metrics.totalReps)}
              unit="reps"
            />
            <Tile
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
  label: string;
  value: string;
  unit: string;
  valueColor?: string;
  footnote?: string | null;
};

function Tile({ label, value, unit, valueColor, footnote }: TileProps) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <View style={styles.tileValueRow}>
        <Text
          style={[
            styles.tileValue,
            Tabular,
            valueColor ? { color: valueColor } : null,
          ]}
        >
          {value}
        </Text>
        <Text style={styles.tileUnit}>{unit}</Text>
      </View>
      {footnote ? <Text style={styles.tileFootnote}>{footnote}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: DS.surface,
    borderColor: DS.border,
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
    color: DS.text,
    letterSpacing: -0.3,
  },
  exerciseName: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: DS.surfaceFlat,
    borderColor: DS.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionLine: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DS.textTertiary,
    marginBottom: 14,
  },
  sessionLineNum: {
    fontFamily: Font.bold,
    color: DS.accent,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tile: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: DS.surfaceFlat,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tileLabel: {
    fontFamily: Font.bold,
    fontSize: 9,
    color: DS.textTertiary,
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
    color: DS.text,
    letterSpacing: -0.4,
  },
  tileUnit: {
    fontFamily: Font.medium,
    fontSize: 10,
    color: DS.textTertiary,
  },
  tileFootnote: {
    fontFamily: Font.medium,
    fontSize: 9,
    color: DS.textQuaternary,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
