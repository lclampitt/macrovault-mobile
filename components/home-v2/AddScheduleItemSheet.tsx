import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {
  Calendar,
  Clock,
  Dumbbell,
  Scale,
  Utensils,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { DS, Font, Radius, Tabular } from '../../lib/design-system';
import {
  PERIOD_ICONS,
  PERIOD_LABELS,
  periodFromHour,
  type MealPeriod,
} from '../../lib/meal-periods';
import type { ScheduleKind } from '../../lib/schedule-store';
import type { MealPlanEntry } from '../../hooks/useMealPlanWeek';

const KINDS: Array<{ key: ScheduleKind; label: string; Icon: LucideIcon }> = [
  { key: 'meal', label: 'Meal', Icon: Utensils },
  { key: 'workout', label: 'Workout', Icon: Dumbbell },
  { key: 'weight', label: 'Weigh-in', Icon: Scale },
  { key: 'other', label: 'Other', Icon: Calendar },
];

export type ScheduleSubmitInput = {
  time: string; // "HH:MM"
  period: MealPeriod;
  kind: ScheduleKind;
  title: string;
  notes?: string;
  macros?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
};

type Props = {
  visible: boolean;
  /** Optional time prefill (HH:MM 24h). Defaults to "now" rounded to :00. */
  initialTime?: string;
  /** Meal-plan entries scheduled for today — surfaces a "From your plan" picker. */
  plannedMeals?: MealPlanEntry[];
  onClose: () => void;
  onAdd: (input: ScheduleSubmitInput) => void | Promise<void>;
};

// --------------------------------------------------------------------------
// Time helpers
// --------------------------------------------------------------------------

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function fmtTime24(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function fmtTime12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:${pad2(m)} ${ampm}`;
}

function timeToDate(hhmm: string): Date {
  const d = new Date();
  const [h, m] = hhmm.split(':').map(Number);
  d.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
  return d;
}

function periodFromTime(hhmm: string): MealPeriod {
  const [h] = hhmm.split(':').map(Number);
  return periodFromHour(Number.isFinite(h) ? h : new Date().getHours());
}

function defaultNowTime(): string {
  const d = new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

// --------------------------------------------------------------------------
// Sheet
// --------------------------------------------------------------------------

export default function AddScheduleItemSheet({
  visible,
  initialTime,
  plannedMeals,
  onClose,
  onAdd,
}: Props) {
  const [time, setTime] = useState<string>(() => initialTime ?? defaultNowTime());
  const [kind, setKind] = useState<ScheduleKind>('meal');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [macros, setMacros] = useState<ScheduleSubmitInput['macros']>();
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  // Read the inset directly so the title clears the status bar even on the
  // first animation frame, where SafeAreaView can momentarily report 0.
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) return;
    setTime(initialTime ?? defaultNowTime());
    setKind('meal');
    setTitle('');
    setNotes('');
    setMacros(undefined);
    setSaving(false);
    setPickerOpen(false);
  }, [visible, initialTime]);

  const canSubmit = title.trim().length > 0 && !saving;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSaving(true);
    await onAdd({
      time,
      period: periodFromTime(time),
      kind,
      title: title.trim(),
      notes: notes.trim() || undefined,
      macros,
    });
    setSaving(false);
    onClose();
  }

  function handlePickerChange(_e: DateTimePickerEvent, picked?: Date) {
    if (Platform.OS === 'android') {
      // Android picker auto-dismisses — apply on change.
      setPickerOpen(false);
      if (picked) setTime(fmtTime24(picked));
      return;
    }
    if (picked) setTime(fmtTime24(picked));
  }

  function pickPlannedMeal(entry: MealPlanEntry) {
    setKind('meal');
    setTitle(entry.meal_name);
    setMacros({
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
    });
  }

  const period = periodFromTime(time);
  const PeriodIcon = PERIOD_ICONS[period];
  const showPlanPicker = kind === 'meal' && (plannedMeals?.length ?? 0) > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView
        style={[styles.safeArea, { paddingTop: insets.top }]}
        edges={['bottom']}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <View style={styles.dragHandle} />

          <View style={styles.header}>
            <Text style={styles.title}>Add to schedule</Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={18} color={DS.textSecondary} strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Label>WHEN</Label>
            <Pressable
              onPress={() => setPickerOpen((v) => !v)}
              style={({ pressed }) => [
                styles.timeRow,
                pickerOpen && styles.timeRowActive,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Time: ${fmtTime12(time)}`}
            >
              <View style={styles.timeIconWrap}>
                <Clock size={16} color={DS.accent} strokeWidth={2} />
              </View>
              <View style={styles.timeBody}>
                <Text style={[styles.timeValue, Tabular]}>{fmtTime12(time)}</Text>
                <View style={styles.timeMetaRow}>
                  <PeriodIcon
                    size={11}
                    color={DS.textTertiary}
                    strokeWidth={2}
                  />
                  <Text style={styles.timeMeta}>{PERIOD_LABELS[period]}</Text>
                </View>
              </View>
              <Text style={styles.timeChange}>
                {pickerOpen ? 'Done' : 'Change'}
              </Text>
            </Pressable>

            {pickerOpen ? (
              Platform.OS === 'ios' ? (
                <View style={styles.iosPickerWrap}>
                  <DateTimePicker
                    mode="time"
                    display="spinner"
                    value={timeToDate(time)}
                    onChange={handlePickerChange}
                    themeVariant="dark"
                    textColor={DS.text}
                  />
                </View>
              ) : (
                <DateTimePicker
                  mode="time"
                  display="default"
                  value={timeToDate(time)}
                  onChange={handlePickerChange}
                />
              )
            ) : null}

            <Label>WHAT</Label>
            <View style={styles.kindRow}>
              {KINDS.map(({ key, label, Icon }) => {
                const active = kind === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setKind(key)}
                    style={({ pressed }) => [
                      styles.kindChip,
                      active && styles.kindChipActive,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Icon
                      size={14}
                      color={active ? DS.accent : DS.textSecondary}
                      strokeWidth={2}
                    />
                    <Text
                      style={[
                        styles.kindLabel,
                        { color: active ? DS.accent : DS.textSecondary },
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {showPlanPicker ? (
              <>
                <Label>FROM YOUR PLAN</Label>
                <Text style={styles.planHint}>
                  Tap a planned meal to schedule it with its macros attached.
                </Text>
                <View style={styles.planList}>
                  {plannedMeals!.map((entry) => {
                    const selected =
                      title.trim() === entry.meal_name.trim() && !!macros;
                    return (
                      <Pressable
                        key={entry.id}
                        onPress={() => pickPlannedMeal(entry)}
                        style={({ pressed }) => [
                          styles.planRow,
                          selected && styles.planRowSelected,
                          pressed && styles.pressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`${entry.meal_name}, ${Math.round(entry.calories)} kcal`}
                      >
                        <View
                          style={[
                            styles.planIcon,
                            selected && styles.planIconActive,
                          ]}
                        >
                          <Utensils
                            size={12}
                            color={selected ? '#000' : DS.accent}
                            strokeWidth={2}
                          />
                        </View>
                        <View style={styles.planBody}>
                          <Text style={styles.planName} numberOfLines={1}>
                            {entry.meal_name}
                          </Text>
                          <Text style={styles.planMeta}>
                            {Math.round(entry.calories)} kcal ·{' '}
                            {Math.round(entry.protein)}P{' '}
                            {Math.round(entry.carbs)}C {Math.round(entry.fat)}F
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}

            <Label style={{ marginTop: 14 }}>TITLE</Label>
            <TextInput
              value={title}
              onChangeText={(v) => {
                setTitle(v);
                // Once the user edits the title, drop the macros snapshot —
                // they're customizing the entry, not scheduling the plan.
                if (macros) setMacros(undefined);
              }}
              placeholder={
                kind === 'meal'
                  ? 'e.g. Chicken bowl'
                  : kind === 'workout'
                    ? 'e.g. Pull · Back / Biceps'
                    : kind === 'weight'
                      ? 'e.g. Morning weigh-in'
                      : 'e.g. Stretch session'
              }
              placeholderTextColor={DS.textQuaternary}
              style={styles.input}
              autoCapitalize="sentences"
              returnKeyType="next"
            />

            <Label style={{ marginTop: 14 }}>NOTES (optional)</Label>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Anything else?"
              placeholderTextColor={DS.textQuaternary}
              style={[styles.input, styles.inputMultiline]}
              multiline
              numberOfLines={3}
            />

            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.cta,
                !canSubmit && styles.ctaDisabled,
                pressed && canSubmit && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSubmit }}
            >
              <Text style={styles.ctaText}>
                {saving ? 'Adding…' : 'Add to schedule'}
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function Label({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  return <Text style={[styles.fieldLabel, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: DS.bg },
  flex: { flex: 1 },
  dragHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: DS.border,
    marginTop: 6,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontFamily: Font.bold,
    fontSize: 18,
    color: DS.text,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: DS.surfaceFlat,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 40,
  },
  fieldLabel: {
    fontFamily: Font.bold,
    fontSize: 9,
    letterSpacing: 0.8,
    color: DS.textTertiary,
    marginBottom: 8,
    marginTop: 14,
  },
  // --- Time row
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: Radius.card,
  },
  timeRowActive: {
    borderColor: DS.accentBorderStrong,
    backgroundColor: DS.accentSoft,
  },
  timeIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: DS.accentSoft,
    borderColor: DS.accentBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeBody: { flex: 1 },
  timeValue: {
    fontFamily: Font.bold,
    fontSize: 18,
    color: DS.text,
    letterSpacing: -0.3,
  },
  timeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  timeMeta: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DS.textTertiary,
  },
  timeChange: {
    fontFamily: Font.bold,
    fontSize: 11,
    color: DS.accent,
    letterSpacing: 0.3,
  },
  iosPickerWrap: {
    marginTop: 4,
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: Radius.card,
    overflow: 'hidden',
  },
  // --- Kind row
  kindRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kindChip: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: DS.surface,
    borderWidth: 1,
    borderColor: DS.border,
  },
  kindChipActive: {
    backgroundColor: DS.accentSoft,
    borderColor: DS.accentBorderStrong,
  },
  kindLabel: {
    fontFamily: Font.bold,
    fontSize: 12,
    letterSpacing: -0.1,
  },
  // --- From your plan
  planHint: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DS.textTertiary,
    marginBottom: 8,
    marginTop: -4,
  },
  planList: { gap: 6 },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: 10,
  },
  planRowSelected: {
    borderColor: DS.accentBorderStrong,
    backgroundColor: DS.accentSoft,
  },
  planIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: DS.accentSoft,
    borderColor: DS.accentBorder,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planIconActive: {
    backgroundColor: DS.accent,
    borderColor: DS.accent,
  },
  planBody: { flex: 1, minWidth: 0 },
  planName: {
    fontFamily: Font.bold,
    fontSize: 12,
    color: DS.text,
    letterSpacing: -0.2,
  },
  planMeta: {
    fontFamily: Font.medium,
    fontSize: 10,
    color: DS.textTertiary,
    marginTop: 2,
  },
  // --- Inputs / CTA
  input: {
    backgroundColor: DS.surface,
    borderWidth: 1,
    borderColor: DS.border,
    borderRadius: Radius.card,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: DS.text,
    fontFamily: Font.medium,
    fontSize: 14,
  },
  inputMultiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  cta: {
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: DS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: {
    fontFamily: Font.bold,
    fontSize: 14,
    color: '#000',
    letterSpacing: 0.2,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
