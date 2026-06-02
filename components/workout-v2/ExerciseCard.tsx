import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import {
  AlertCircle,
  BarChart3,
  Edit3,
  FileText,
  GripVertical,
  History,
  MoreHorizontal,
  Plus,
  RefreshCw,
  RotateCcw,
  SkipForward,
  Trash2,
  type LucideIcon,
} from 'lucide-react-native';
import { Font, Tabular } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import type { Tokens } from '../../lib/tokens';
import type { ActiveExercise } from '../../lib/active-workout-context';
import SetRow from './SetRow';

const HINT_COLOR = '#A87C5E';

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
  /** Toggles the per-session skipped flag. Wired to the kebab menu's Skip
   *  item AND the whole skipped-card tap-to-resume affordance. */
  onToggleSkipped: () => void;
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
  onToggleSkipped,
  drag,
}: Props) {
  const t = useTokens();
  const doneSetCount = exercise.sets.filter((s) => s.completed).length;
  const totalSetCount = exercise.sets.length;
  const allDone = totalSetCount > 0 && doneSetCount === totalSetCount;
  const someDone = doneSetCount > 0;
  const isSkipped = !!exercise.skipped;
  // "Last: skipped" hint shows ONLY when the previous session skipped this
  // exercise AND the user hasn't done anything in the current session yet
  // (no sets logged, not already skipped). Logging a set or re-skipping
  // hides the hint per spec.
  const showSkippedHint =
    !!exercise.skippedLastTime && !isSkipped && doneSetCount === 0;

  return (
    <View style={styles.outer}>
      <Pressable
        // Tap anywhere on the skipped card to resume. We don't disable the
        // pressable in non-skipped mode because the inner sets/menus need
        // their own touch handling — but we no-op the tap there.
        onPress={isSkipped ? onToggleSkipped : undefined}
        style={[
          styles.card,
          { backgroundColor: t.bgCard, borderColor: t.borderDefault },
          isSkipped && {
            backgroundColor: t.primaryTintBg,
            borderColor: t.primaryTintBorder,
          },
        ]}
        accessibilityRole={isSkipped ? 'button' : undefined}
        accessibilityLabel={
          isSkipped
            ? `${exercise.name} skipped. Tap to resume.`
            : undefined
        }
      >
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
                color={t.textQuaternary}
                strokeWidth={2}
              />
            </Pressable>
            <View style={styles.titleCol}>
              <View style={styles.titleInline}>
                <Text
                  style={[
                    styles.title,
                    { color: allDone ? t.primary : t.textPrimary },
                  ]}
                  numberOfLines={1}
                >
                  {exercise.name}
                </Text>
                {showSkippedHint ? (
                  // Reanimated FadeOut on unmount makes the hint dissolve
                  // (0.3s ease-out) when the user logs a set rather than
                  // popping out of the layout.
                  <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(300)}
                    style={styles.hintBadge}
                    accessibilityLabel="Skipped in previous session"
                  >
                    <AlertCircle size={10} color={HINT_COLOR} strokeWidth={2.5} />
                    <Text style={styles.hintBadgeText}>Last: skipped</Text>
                  </Animated.View>
                ) : null}
              </View>
              <View style={styles.metaRow}>
                <Text style={[styles.muscleLabel, { color: t.textTertiary }]}>EXERCISE</Text>
                <Text style={[styles.metaDot, { color: t.textQuaternary }]}>·</Text>
                <Text
                  style={[
                    styles.setCount,
                    Tabular,
                    { color: someDone ? t.primary : t.textTertiary },
                  ]}
                >
                  {totalSetCount} sets
                </Text>
              </View>
            </View>
          </View>
          {isSkipped ? (
            // SKIPPED badge replaces the chart + kebab cluster.
            <View
              style={[
                styles.skippedBadge,
                {
                  backgroundColor: t.primaryTintBg,
                  borderColor: t.primaryBorderStrong,
                  shadowColor: t.primary,
                },
              ]}
              accessibilityLabel="Skipped this session"
            >
              <SkipForward size={12} color={t.primary} strokeWidth={2.5} />
              <Text style={[styles.skippedBadgeText, { color: t.primary }]}>SKIPPED</Text>
            </View>
          ) : (
            <>
              <View style={styles.headerActions}>
                <Pressable
                  onPress={onShowMetrics}
                  style={({ pressed }) => [
                    styles.menuBtn,
                    { backgroundColor: t.bgCardElevated },
                    pressed && { backgroundColor: t.borderDefault },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Exercise metrics"
                >
                  <BarChart3
                    size={14}
                    color={t.textSecondary}
                    strokeWidth={2}
                  />
                </Pressable>
              </View>
              <View style={styles.menuWrap}>
                <Pressable
                  onPress={onOpenMenu}
                  style={({ pressed }) => [
                    styles.menuBtn,
                    { backgroundColor: t.bgCardElevated },
                    (isMenuOpen || pressed) && { backgroundColor: t.borderDefault },
                    isMenuOpen && {
                      backgroundColor: t.primaryTintBg,
                      borderWidth: 1,
                      borderColor: t.primaryBorderStrong,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Exercise options"
                  accessibilityState={{ expanded: isMenuOpen }}
                >
                  <MoreHorizontal
                    size={14}
                    color={isMenuOpen ? t.primary : t.textSecondary}
                    strokeWidth={2}
                  />
                </Pressable>
                {isMenuOpen ? (
                  <View
                    style={[
                      styles.menu,
                      { backgroundColor: t.bgCardElevated, borderColor: t.borderStrong },
                    ]}
                    accessibilityRole="menu"
                  >
                    {/* Skip exercise — first item, emerald-tinted with
                        "This session" trailing microtype. */}
                    <Pressable
                      onPress={onToggleSkipped}
                      style={({ pressed }) => [
                        styles.menuItem,
                        styles.menuItemSkip,
                        { backgroundColor: t.primaryTintBg },
                        pressed && { backgroundColor: t.primaryTintBorder },
                      ]}
                      accessibilityRole="menuitem"
                      accessibilityLabel={`Skip ${exercise.name} for this session`}
                    >
                      <SkipForward
                        size={14}
                        color={t.primary}
                        strokeWidth={2.5}
                      />
                      <Text style={[styles.menuItemSkipText, { color: t.primary }]}>
                        Skip exercise
                      </Text>
                      <Text style={[styles.menuItemSkipTrailing, { color: t.primary }]}>
                        This session
                      </Text>
                    </Pressable>
                    <View style={[styles.menuDivider, { backgroundColor: t.borderStrong }]} />
                    <MenuItem
                      tokens={t}
                      Icon={Edit3}
                      label="Rename"
                      onPress={onRename}
                    />
                    <MenuItem
                      tokens={t}
                      Icon={RefreshCw}
                      label="Replace exercise"
                      onPress={onReplace}
                    />
                    <MenuItem
                      tokens={t}
                      Icon={FileText}
                      label="Add note"
                      onPress={onAddNote}
                    />
                    <MenuItem
                      tokens={t}
                      Icon={History}
                      label="View history"
                      onPress={onViewHistory}
                    />
                    <View style={[styles.menuDivider, { backgroundColor: t.borderStrong }]} />
                    <MenuItem
                      tokens={t}
                      Icon={Trash2}
                      label="Remove from template"
                      color={DESTRUCTIVE}
                      onPress={onRemove}
                    />
                  </View>
                ) : null}
              </View>
            </>
          )}
        </View>

        {/* Body — dimmed and non-interactive when skipped */}
        <View
          style={isSkipped ? styles.bodyDimmed : undefined}
          pointerEvents={isSkipped ? 'none' : 'auto'}
        >
        {/* Column headers */}
        <View style={styles.colHeaders}>
          <View style={styles.colHdrNum}>
            <Text style={[styles.colHdrText, { color: t.textTertiary }]}>SET</Text>
          </View>
          <Text style={[styles.colHdrText, styles.colHdrLast, { color: t.textTertiary }]}>LAST</Text>
          <Text style={[styles.colHdrText, styles.colHdrWeight, { color: t.textTertiary }]}>LBS</Text>
          <Text style={[styles.colHdrText, styles.colHdrReps, { color: t.textTertiary }]}>REPS</Text>
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
            { backgroundColor: t.bgCardElevated, borderColor: t.borderDefault },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add set"
        >
          <Plus size={12} color={t.primary} strokeWidth={2.5} />
          <Text style={[styles.addSetText, { color: t.primary }]}>Add set</Text>
        </Pressable>

        {exercise.note ? (
          <View
            style={[
              styles.noteBox,
              { backgroundColor: t.bgCardElevated, borderColor: t.borderDefault },
            ]}
          >
            <Text style={[styles.noteText, { color: t.textSecondary }]}>
              {exercise.note}
            </Text>
          </View>
        ) : null}
        </View>

        {isSkipped ? (
          <View style={[styles.resumeHint, { borderTopColor: t.primaryTintBorder }]}>
            <RotateCcw size={12} color={t.primary} strokeWidth={2.5} />
            <Text style={[styles.resumeHintText, { color: t.primary }]}>Tap card to resume</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

function MenuItem({
  tokens: t,
  Icon,
  label,
  color,
  onPress,
}: {
  tokens: Tokens;
  Icon: LucideIcon;
  label: string;
  color?: string;
  onPress: () => void;
}) {
  const tint = color ?? t.textPrimary;
  const iconTint = color ?? t.textSecondary;
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
    letterSpacing: 0.6,
  },
  metaDot: {
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  menu: {
    position: 'absolute',
    right: 0,
    top: 36,
    zIndex: 50,
    minWidth: 180,
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
  },
  noteBox: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  noteText: {
    fontFamily: Font.medium,
    fontSize: 11,
    lineHeight: 15,
  },
  // Skipped state
  skippedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
  },
  skippedBadgeText: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  bodyDimmed: {
    opacity: 0.35,
  },
  resumeHint: {
    marginTop: 12,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderTopWidth: 1,
  },
  resumeHintText: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 0.2,
  },
  // Inline "Last: skipped" hint in header
  titleInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  hintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(168, 124, 94, 0.12)',
    borderColor: 'rgba(168, 124, 94, 0.25)',
    borderWidth: 1,
  },
  hintBadgeText: {
    fontFamily: Font.bold,
    fontSize: 9,
    color: HINT_COLOR,
  },
  // Kebab Skip item (first menu entry, emerald-tinted)
  menuItemSkip: {
    borderRadius: 8,
    marginHorizontal: 4,
  },
  menuItemSkipText: {
    flex: 1,
    fontFamily: Font.bold,
    fontSize: 11,
  },
  menuItemSkipTrailing: {
    fontFamily: Font.medium,
    fontSize: 9,
    opacity: 0.6,
  },
});
