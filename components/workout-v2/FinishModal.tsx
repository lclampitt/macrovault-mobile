import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Check,
  RefreshCw,
  Save,
  SkipForward,
  type LucideIcon,
} from 'lucide-react-native';
import { Font, Radius, Tabular } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import type { Tokens } from '../../lib/tokens';
import type { ActiveExercise } from '../../lib/active-workout-context';

export type FinishOption = 'update' | 'new' | 'keep';

const HINT_COLOR = '#A87C5E';

type Props = {
  visible: boolean;
  workoutName: string;
  templateName: string | null;
  duration: string; // "30:45"
  doneSets: number;
  volumeLb: number;
  /** Live ActiveExercise list — drives the Completed + Skipped sections. */
  exercises: ActiveExercise[];
  saving: boolean;
  onClose: () => void;
  onSave: (option: FinishOption) => void;
};

const OPTIONS: Array<{
  key: FinishOption;
  Icon: LucideIcon;
  label: string;
  sub: string;
}> = [
  { key: 'update', Icon: RefreshCw, label: 'Update template', sub: 'Overwrite with this workout' },
  { key: 'new', Icon: Save, label: 'Save as new template', sub: 'Keep original, add another' },
  { key: 'keep', Icon: Check, label: 'Keep original', sub: 'Just log this workout' },
];

function fmtNum(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

function exerciseVolume(ex: ActiveExercise): number {
  return ex.sets.reduce((sum, s) => {
    if (!s.completed) return sum;
    const w = Number(s.weight);
    const r = Number(s.reps);
    if (!Number.isFinite(w) || !Number.isFinite(r)) return sum;
    return sum + w * r;
  }, 0);
}

function completedSetCount(ex: ActiveExercise): number {
  return ex.sets.filter((s) => s.completed).length;
}

export default function FinishModal({
  visible,
  workoutName,
  templateName,
  duration,
  doneSets,
  volumeLb,
  exercises,
  saving,
  onClose,
  onSave,
}: Props) {
  const t = useTokens();
  const [option, setOption] = useState<FinishOption>('keep');

  // Three buckets — completed / skipped / incomplete — and they're
  // intentionally distinct:
  //   completed:  the user logged ≥1 set
  //   skipped:    the user explicitly tapped Skip from the kebab menu
  //               (sets done MUST be 0 for this to count; logging a set
  //               after skipping promotes the exercise back to completed)
  //   incomplete: anything else — zero sets done, no explicit skip. The
  //               user was distracted, ran out of time, etc. These are
  //               invisible in the summary aside from an optional quiet
  //               microtype tally; they do NOT trigger the next session's
  //               "Last: skipped" hint.
  const { completed, skipped, incompleteCount } = useMemo(() => {
    const c: ActiveExercise[] = [];
    const s: ActiveExercise[] = [];
    let i = 0;
    for (const ex of exercises) {
      const done = completedSetCount(ex);
      if (done > 0) {
        c.push(ex);
      } else if (ex.skipped) {
        s.push(ex);
      } else {
        i += 1;
      }
    }
    return { completed: c, skipped: s, incompleteCount: i };
  }, [exercises]);

  // "All-skipped" only when every exercise in the session was explicitly
  // skipped — leaving things incomplete doesn't trigger the special copy.
  const allSkipped =
    exercises.length > 0 &&
    skipped.length === exercises.length &&
    completed.length === 0;
  // Volume + duration counters in the title block are intentionally gone —
  // the per-exercise breakdown below already shows that info.
  void doneSets;
  void volumeLb;
  void fmtNum;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.backdrop, { backgroundColor: t.bgOverlay }]}
        onPress={onClose}
      >
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: t.bgCard, borderTopColor: t.borderDefault },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <SafeAreaView edges={['bottom']}>
            <View style={[styles.handle, { backgroundColor: t.borderStrong }]} />
            <View style={styles.titleBlock}>
              <Text style={[styles.title, { color: t.textPrimary }]}>
                {allSkipped ? 'Session ended' : 'Finish workout'}
              </Text>
              <Text style={[styles.subtitle, { color: t.textSecondary }]}>
                {allSkipped
                  ? 'All exercises skipped this session. Resume later or revise your routine.'
                  : `${workoutName || 'Workout'} · ${duration}`}
              </Text>
            </View>

            {/* Scrollable summary so long workouts don't push the actions
                off the sheet. */}
            <ScrollView
              style={styles.summaryScroll}
              contentContainerStyle={styles.summaryContent}
              showsVerticalScrollIndicator={false}
            >
              {completed.length > 0 ? (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Check
                      size={12}
                      color={t.primary}
                      strokeWidth={3}
                    />
                    <Text style={[styles.sectionLabel, { color: t.primary }]}>
                      COMPLETED · {completed.length}{' '}
                      {completed.length === 1 ? 'exercise' : 'exercises'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.sectionCard,
                      { backgroundColor: t.bgCard, borderColor: t.borderDefault },
                    ]}
                  >
                    {completed.map((ex, i) => (
                      <View
                        key={ex.id}
                        style={[
                          styles.row,
                          i < completed.length - 1 && {
                            borderBottomWidth: 1,
                            borderBottomColor: t.borderDefault,
                          },
                        ]}
                      >
                        <View style={[styles.rowIconCompleted, { backgroundColor: t.primaryTintBg }]}>
                          <Check size={12} color={t.primary} strokeWidth={3} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.rowName, { color: t.textPrimary }]}>{ex.name}</Text>
                          <Text style={[styles.rowMeta, { color: t.textTertiary }]}>
                            {completedSetCount(ex)}{' '}
                            {completedSetCount(ex) === 1 ? 'set' : 'sets'}
                          </Text>
                        </View>
                        <View style={styles.rowRight}>
                          <Text style={[styles.rowVolume, Tabular, { color: t.textPrimary }]}>
                            {fmtNum(exerciseVolume(ex))} lb
                          </Text>
                          <Text style={[styles.rowVolumeLabel, { color: t.textTertiary }]}>VOLUME</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {skipped.length > 0 ? (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <SkipForward
                      size={12}
                      color={HINT_COLOR}
                      strokeWidth={2.5}
                    />
                    <Text
                      style={[
                        styles.sectionLabel,
                        { color: HINT_COLOR },
                      ]}
                    >
                      SKIPPED · {skipped.length}{' '}
                      {skipped.length === 1 ? 'exercise' : 'exercises'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.sectionCard,
                      { backgroundColor: t.bgCard, borderColor: t.borderDefault },
                    ]}
                  >
                    {skipped.map((ex, i) => (
                      <View
                        key={ex.id}
                        style={[
                          styles.row,
                          i < skipped.length - 1 && {
                            borderBottomWidth: 1,
                            borderBottomColor: t.borderDefault,
                          },
                        ]}
                      >
                        <View style={styles.rowIconSkipped}>
                          <SkipForward
                            size={12}
                            color={HINT_COLOR}
                            strokeWidth={2.5}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.rowNameMuted, { color: t.textSecondary }]}>{ex.name}</Text>
                          <Text style={[styles.rowMetaMuted, { color: t.textTertiary }]}>
                            {ex.sets.length}{' '}
                            {ex.sets.length === 1 ? 'set' : 'sets'} · saved for
                            next time
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {/* Quiet acknowledgement that some exercises were left
                  incomplete (no sets logged AND no explicit Skip). We don't
                  list them by name and don't style this like a section —
                  per spec, incomplete must not look like skipped. */}
              {incompleteCount > 0 && !allSkipped ? (
                <Text style={[styles.incompleteNote, { color: t.textTertiary }]}>
                  {incompleteCount}{' '}
                  {incompleteCount === 1 ? 'exercise had' : 'exercises had'}{' '}
                  no sets logged.
                </Text>
              ) : null}
            </ScrollView>

            {templateName ? (
              <Text style={[styles.templateLine, { color: t.textSecondary }]}>
                Started from{' '}
                <Text style={[styles.templateName, { color: t.primary }]}>{templateName}</Text>. What
                should happen to the template?
              </Text>
            ) : (
              <Text style={[styles.templateLine, { color: t.textSecondary }]}>
                Save this workout. Optionally save it as a new template.
              </Text>
            )}

            <View style={styles.optionsCol}>
              {(templateName
                ? OPTIONS
                : OPTIONS.filter((o) => o.key !== 'update')
              ).map((opt) => {
                const active = option === opt.key;
                const Icon = opt.Icon;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setOption(opt.key)}
                    style={[
                      styles.optionRow,
                      { backgroundColor: t.bgPage, borderColor: t.borderDefault },
                      active && {
                        backgroundColor: t.primaryTintBg,
                        borderColor: t.primaryBorderStrong,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={opt.label}
                  >
                    <View
                      style={[
                        styles.optionIcon,
                        { backgroundColor: t.bgCardElevated },
                        active && { backgroundColor: t.primaryTintBg },
                      ]}
                    >
                      <Icon
                        size={14}
                        color={active ? t.primary : t.textSecondary}
                        strokeWidth={2}
                      />
                    </View>
                    <View style={styles.optionText}>
                      <Text
                        style={[
                          styles.optionLabel,
                          { color: active ? t.textPrimary : t.textSecondary },
                        ]}
                      >
                        {opt.label}
                      </Text>
                      <Text style={[styles.optionSub, { color: t.textTertiary }]}>{opt.sub}</Text>
                    </View>
                    {active ? (
                      <View style={[styles.activeCheck, { backgroundColor: t.primary }]}>
                        <Check size={12} color={t.textOnPrimary} strokeWidth={3} />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                onPress={onClose}
                disabled={saving}
                style={({ pressed }) => [
                  styles.keepGoingBtn,
                  { backgroundColor: t.bgCardElevated, borderColor: t.borderDefault },
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Keep going"
              >
                <Text style={[styles.keepGoingText, { color: t.textSecondary }]}>Keep going</Text>
              </Pressable>
              <Pressable
                onPress={() => onSave(option)}
                disabled={saving}
                style={({ pressed }) => [
                  styles.saveBtn,
                  { backgroundColor: t.primary, borderColor: t.primaryBorderStrong },
                  t.shadowPrimaryGlow,
                  saving && styles.disabled,
                  pressed && !saving && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Save workout"
              >
                {saving ? (
                  <ActivityIndicator size="small" color={t.textOnPrimary} />
                ) : (
                  <Text style={[styles.saveText, { color: t.textOnPrimary }]}>Save workout</Text>
                )}
              </Pressable>
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Stat({
  tokens: t,
  label,
  value,
}: {
  tokens: Tokens;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statCol}>
      <Text style={[styles.statLabel, { color: t.textTertiary }]}>{label}</Text>
      <Text style={[styles.statValue, Tabular, { color: t.textPrimary }]}>{value}</Text>
    </View>
  );
}
void Stat;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 8,
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: Font.bold,
    fontSize: 20,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: Font.medium,
    fontSize: 12,
    marginTop: 4,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statLabel: {
    fontFamily: Font.bold,
    fontSize: 9,
    letterSpacing: 0.6,
  },
  statValue: {
    fontFamily: Font.bold,
    fontSize: 16,
  },
  templateLine: {
    fontFamily: Font.medium,
    fontSize: 12,
    marginBottom: 10,
  },
  templateName: {
    fontFamily: Font.bold,
  },
  optionsCol: {
    gap: 8,
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontFamily: Font.bold,
    fontSize: 13,
  },
  optionSub: {
    fontFamily: Font.medium,
    fontSize: 10,
    marginTop: 2,
  },
  activeCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 24,
    paddingTop: 4,
  },
  keepGoingBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.cardCompact,
    borderWidth: 1,
    alignItems: 'center',
  },
  keepGoingText: {
    fontFamily: Font.bold,
    fontSize: 13,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.cardCompact,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontFamily: Font.bold,
    fontSize: 13,
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  // Summary sections
  summaryScroll: {
    maxHeight: 280,
    marginHorizontal: 20,
  },
  summaryContent: { gap: 14, paddingBottom: 8 },
  section: { gap: 6 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  sectionLabel: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: Radius.card,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  rowIconCompleted: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconSkipped: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(168, 124, 94, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowName: {
    fontFamily: Font.bold,
    fontSize: 13,
  },
  rowNameMuted: {
    fontFamily: Font.bold,
    fontSize: 13,
  },
  rowMeta: {
    fontFamily: Font.medium,
    fontSize: 10,
    marginTop: 2,
  },
  rowMetaMuted: {
    fontFamily: Font.medium,
    fontSize: 10,
    marginTop: 2,
  },
  rowRight: { alignItems: 'flex-end' },
  rowVolume: {
    fontFamily: Font.bold,
    fontSize: 12,
  },
  rowVolumeLabel: {
    fontFamily: Font.bold,
    fontSize: 9,
    letterSpacing: 0.6,
  },
  incompleteNote: {
    fontFamily: Font.medium,
    fontSize: 11,
    textAlign: 'center',
    paddingTop: 2,
  },
});
