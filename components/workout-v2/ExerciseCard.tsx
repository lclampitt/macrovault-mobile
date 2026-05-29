import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BarChart3,
  Edit3,
  FileText,
  GripVertical,
  History,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Trash2,
  type LucideIcon,
} from 'lucide-react-native';
import { DS, Font, Tabular } from '../../lib/design-system';
import type { ActiveExercise } from '../../lib/active-workout-context';
import SetRow from './SetRow';

type Props = {
  exercise: ActiveExercise;
  isMenuOpen: boolean;
  onOpenMenu: () => void;
  onUpdateSet: (setId: string, field: 'weight' | 'reps', value: string) => void;
  onToggleSetComplete: (setId: string) => void;
  onAddSet: () => void;
  onDeleteSet: (setId: string) => void;
  onRename: () => void;
  onReplace: () => void;
  onAddNote: () => void;
  onViewHistory: () => void;
  onRemove: () => void;
  onShowMetrics: () => void;
  /** Drag handle binding from react-native-draggable-flatlist. */
  drag?: () => void;
};

const DESTRUCTIVE = '#E5736A';

export default function ExerciseCard({
  exercise,
  isMenuOpen,
  onOpenMenu,
  onUpdateSet,
  onToggleSetComplete,
  onAddSet,
  onDeleteSet,
  onRename,
  onReplace,
  onAddNote,
  onViewHistory,
  onRemove,
  onShowMetrics,
  drag,
}: Props) {
  const doneSetCount = exercise.sets.filter((s) => s.completed).length;
  const totalSetCount = exercise.sets.length;
  const allDone = totalSetCount > 0 && doneSetCount === totalSetCount;
  const someDone = doneSetCount > 0;

  return (
    <View style={styles.outer}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Pressable
              onLongPress={drag}
              delayLongPress={120}
              style={styles.gripBtn}
              accessibilityRole="button"
              accessibilityLabel="Drag to reorder"
            >
              <GripVertical
                size={16}
                color={DS.textQuaternary}
                strokeWidth={2}
              />
            </Pressable>
            <View style={styles.titleCol}>
              <Text
                style={[
                  styles.title,
                  { color: allDone ? DS.accent : DS.text },
                ]}
                numberOfLines={1}
              >
                {exercise.name}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.muscleLabel}>EXERCISE</Text>
                <Text style={styles.metaDot}>·</Text>
                <Text
                  style={[
                    styles.setCount,
                    Tabular,
                    { color: someDone ? DS.accent : DS.textTertiary },
                  ]}
                >
                  {doneSetCount}/{totalSetCount} sets
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={onShowMetrics}
              style={({ pressed }) => [
                styles.menuBtn,
                pressed && styles.menuBtnActive,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Exercise metrics"
            >
              <BarChart3
                size={14}
                color={DS.textSecondary}
                strokeWidth={2}
              />
            </Pressable>
          </View>
          <View style={styles.menuWrap}>
            <Pressable
              onPress={onOpenMenu}
              style={({ pressed }) => [
                styles.menuBtn,
                (isMenuOpen || pressed) && styles.menuBtnActive,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Exercise options"
              accessibilityState={{ expanded: isMenuOpen }}
            >
              <MoreHorizontal
                size={14}
                color={DS.textSecondary}
                strokeWidth={2}
              />
            </Pressable>
            {isMenuOpen ? (
              <View style={styles.menu} accessibilityRole="menu">
                <MenuItem Icon={Edit3} label="Rename" onPress={onRename} />
                <MenuItem
                  Icon={RefreshCw}
                  label="Replace exercise"
                  onPress={onReplace}
                />
                <MenuItem
                  Icon={FileText}
                  label="Add note"
                  onPress={onAddNote}
                />
                <MenuItem
                  Icon={History}
                  label="View history"
                  onPress={onViewHistory}
                />
                <View style={styles.menuDivider} />
                <MenuItem
                  Icon={Trash2}
                  label="Remove"
                  color={DESTRUCTIVE}
                  onPress={onRemove}
                />
              </View>
            ) : null}
          </View>
        </View>

        {/* Column headers */}
        <View style={styles.colHeaders}>
          <View style={styles.colHdrNum}>
            <Text style={styles.colHdrText}>SET</Text>
          </View>
          <Text style={[styles.colHdrText, styles.colHdrLast]}>LAST</Text>
          <Text style={[styles.colHdrText, styles.colHdrWeight]}>LBS</Text>
          <Text style={[styles.colHdrText, styles.colHdrReps]}>REPS</Text>
          <View style={styles.colHdrCheck} />
        </View>

        {/* Sets */}
        <View style={styles.setsCol}>
          {exercise.sets.map((set, i) => {
            const pw =
              set.prevWeight && set.prevWeight !== ''
                ? Number(set.prevWeight)
                : null;
            const pr =
              set.prevReps && set.prevReps !== ''
                ? Number(set.prevReps)
                : null;
            return (
              <SetRow
                key={set.id}
                set={set}
                setIndex={i}
                prevWeight={pw}
                prevReps={pr}
                isPR={false}
                onUpdate={(field, value) =>
                  onUpdateSet(set.id, field, value)
                }
                onToggleComplete={() => onToggleSetComplete(set.id)}
                onDelete={() => onDeleteSet(set.id)}
              />
            );
          })}
        </View>

        {/* Add set */}
        <Pressable
          onPress={onAddSet}
          style={({ pressed }) => [
            styles.addSetBtn,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add set"
        >
          <Plus size={12} color={DS.accent} strokeWidth={2.5} />
          <Text style={styles.addSetText}>Add set</Text>
        </Pressable>

        {exercise.note ? (
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>{exercise.note}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function MenuItem({
  Icon,
  label,
  color,
  onPress,
}: {
  Icon: LucideIcon;
  label: string;
  color?: string;
  onPress: () => void;
}) {
  const tint = color ?? DS.text;
  const iconTint = color ?? DS.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        pressed && styles.menuItemPressed,
      ]}
      accessibilityRole="menuitem"
      accessibilityLabel={label}
    >
      <Icon size={14} color={iconTint} strokeWidth={2} />
      <Text style={[styles.menuItemText, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  card: {
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gripBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
  },
  title: {
    fontFamily: Font.bold,
    fontSize: 13,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  muscleLabel: {
    fontFamily: Font.semibold,
    fontSize: 9,
    color: DS.textTertiary,
    letterSpacing: 0.6,
  },
  metaDot: {
    color: DS.textDimmest,
    fontSize: 9,
  },
  setCount: {
    fontFamily: Font.medium,
    fontSize: 9,
  },
  menuWrap: {
    position: 'relative',
  },
  menuBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#0F0F0F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtnActive: {
    backgroundColor: DS.border,
  },
  menu: {
    position: 'absolute',
    right: 0,
    top: 36,
    zIndex: 50,
    minWidth: 180,
    backgroundColor: '#141414',
    borderColor: '#2A2A2A',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  menuItemPressed: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  menuItemText: {
    fontFamily: Font.medium,
    fontSize: 11,
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 8,
    marginVertical: 4,
    backgroundColor: '#2A2A2A',
  },
  colHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 0,
    marginBottom: 8,
  },
  colHdrNum: {
    width: 24,
    alignItems: 'center',
  },
  colHdrText: {
    fontFamily: Font.bold,
    fontSize: 8,
    color: '#555',
    letterSpacing: 0.8,
  },
  colHdrLast: {
    flex: 1,
    textAlign: 'center',
  },
  colHdrWeight: {
    width: 72,
    textAlign: 'center',
  },
  colHdrReps: {
    flex: 1,
    textAlign: 'center',
  },
  colHdrCheck: {
    width: 36,
  },
  setsCol: {
    gap: 6,
  },
  addSetBtn: {
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0F0F0F',
    borderColor: DS.border,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  addSetText: {
    fontFamily: Font.bold,
    fontSize: 10,
    color: DS.accent,
  },
  noteBox: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: DS.surfaceFlat,
    borderRadius: 8,
    borderColor: DS.border,
    borderWidth: 1,
  },
  noteText: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DS.textSecondary,
    lineHeight: 15,
  },
});
