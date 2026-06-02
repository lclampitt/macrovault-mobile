import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Minus,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { Font, Tabular } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import type { ActiveGoal, WeightUnit } from '../../hooks/useActiveGoal';
import {
  useGoalMutations,
  type GoalSavePayload,
  type GoalType,
} from '../../hooks/useGoalMutations';
import DeleteConfirmModal from '../progress/DeleteConfirmModal';

type Props = {
  visible: boolean;
  /** When present, sheet opens in edit mode prefilled from the row. */
  initial: ActiveGoal | null;
  onClose: () => void;
  onSaved: () => void;
};

const GOAL_TYPES: { value: GoalType; label: string; Icon: LucideIcon }[] = [
  { value: 'Cutting', label: 'Cut', Icon: TrendingDown },
  { value: 'Maintenance', label: 'Maintain', Icon: Minus },
  { value: 'Bulking', label: 'Bulk', Icon: TrendingUp },
];

const WEIGHT_UNITS: WeightUnit[] = ['lb', 'kg'];

function intStr(n: number | undefined | null): string {
  if (n == null || !Number.isFinite(n) || n <= 0) return '';
  return String(Math.round(n));
}

function numStr(n: number | undefined | null): string {
  if (n == null || !Number.isFinite(n)) return '';
  return String(n);
}

export default function EditGoalSheet({
  visible,
  initial,
  onClose,
  onSaved,
}: Props) {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const [goalType, setGoalType] = useState<GoalType>('Cutting');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [startWeight, setStartWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('lb');
  const [calorieDelta, setCalorieDelta] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { save, remove, saving, removing } = useGoalMutations();

  // Reset state every time the sheet opens.
  useEffect(() => {
    if (!visible) return;
    if (initial) {
      const raw = initial.goal as GoalType;
      setGoalType(
        GOAL_TYPES.some((g) => g.value === raw) ? raw : 'Cutting',
      );
      setCalories(intStr(initial.calories));
      setProtein(intStr(initial.protein));
      setCarbs(intStr(initial.carbs));
      setFat(intStr(initial.fat));
      setTimeframe(intStr(initial.timeframeWeeks));
      setStartWeight(numStr(initial.startWeight));
      setTargetWeight(numStr(initial.targetWeight));
      setWeightUnit(initial.startWeightUnit ?? 'lb');
      setCalorieDelta(
        initial.calorieDelta != null ? String(initial.calorieDelta) : '',
      );
    } else {
      setGoalType('Cutting');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      setTimeframe('');
      setStartWeight('');
      setTargetWeight('');
      setWeightUnit('lb');
      setCalorieDelta('');
    }
    setError(null);
    setConfirmDelete(false);
  }, [visible, initial]);

  const isEdit = !!initial;
  const title = isEdit ? 'Edit goal' : 'Set up a goal';

  // Today's ISO date for the start anchor when first creating.
  const todayISO = useMemo(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }, []);

  async function handleSave() {
    setError(null);
    const calsN = parseInt(calories, 10);
    const proN = parseInt(protein, 10) || 0;
    const carbN = parseInt(carbs, 10) || 0;
    const fatN = parseInt(fat, 10) || 0;
    const weeksN = parseInt(timeframe, 10);
    const startWN = parseFloat(startWeight);
    const targetWN = parseFloat(targetWeight);
    const deltaN = parseInt(calorieDelta, 10);

    if (!calsN || calsN <= 0) {
      setError('Calories must be greater than 0.');
      return;
    }
    if (!weeksN || weeksN <= 0) {
      setError('Timeframe (weeks) must be greater than 0.');
      return;
    }

    // Compute start/target dates. If editing and the start_date is
    // already set, keep it; otherwise anchor to today.
    const startDateISO = initial?.startDate ?? todayISO;
    const startAnchor = new Date(startDateISO + 'T00:00:00');
    const targetDate = new Date(
      startAnchor.getTime() + weeksN * 7 * 24 * 60 * 60 * 1000,
    );
    const targetDateISO = targetDate.toISOString().slice(0, 10);

    const payload: GoalSavePayload = {
      goal: goalType,
      calories: calsN,
      protein: proN,
      carbs: carbN,
      fat: fatN,
      timeframe_weeks: weeksN,
      start_date: startDateISO,
      target_date: targetDateISO,
      calorie_delta: Number.isFinite(deltaN) ? deltaN : null,
      start_weight_value: Number.isFinite(startWN) ? startWN : null,
      start_weight_unit: Number.isFinite(startWN) ? weightUnit : null,
      target_weight_value: Number.isFinite(targetWN) ? targetWN : null,
      target_weight_unit: Number.isFinite(targetWN) ? weightUnit : null,
    };

    const r = await save(payload);
    if (r.error) {
      setError(r.error);
      return;
    }
    onSaved();
    onClose();
  }

  async function handleDelete() {
    const r = await remove();
    if (r.error) {
      setError(r.error);
      setConfirmDelete(false);
      return;
    }
    setConfirmDelete(false);
    onSaved();
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: t.bgPage }]} edges={['bottom']}>
        <View style={[styles.headerWrap, { paddingTop: insets.top + 8, borderBottomColor: t.borderDefault }]}>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={18} color={t.textPrimary} strokeWidth={2} />
          </Pressable>
          <Text style={[styles.title, { color: t.textPrimary }]}>{title}</Text>
          <View style={styles.iconSpacer} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* GOAL TYPE — segmented pills with icons */}
            <Text style={[styles.sectionLabel, { color: t.textTertiary }]}>GOAL TYPE</Text>
            <View style={styles.segmented}>
              {GOAL_TYPES.map(({ value, label, Icon }) => {
                const active = value === goalType;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setGoalType(value)}
                    style={[
                      styles.segment,
                      {
                        backgroundColor: active ? t.primaryTintBg : t.bgCard,
                        borderColor: active ? t.primaryBorderStrong : t.borderDefault,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Icon
                      size={14}
                      color={active ? t.primary : t.textSecondary}
                      strokeWidth={2.25}
                    />
                    <Text
                      style={[
                        styles.segmentLabel,
                        { color: active ? t.primary : t.textSecondary },
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* CALORIE + DELTA */}
            <Text style={[styles.sectionLabel, { color: t.textTertiary }]}>DAILY CALORIES</Text>
            <View style={styles.row2}>
              <Field
                label="Calories"
                unit="kcal/day"
                value={calories}
                onChange={setCalories}
              />
              <Field
                label="vs Maintenance"
                unit="kcal"
                value={calorieDelta}
                onChange={setCalorieDelta}
                signed
              />
            </View>

            {/* MACROS */}
            <Text style={[styles.sectionLabel, { color: t.textTertiary }]}>MACRONUTRIENTS</Text>
            <View style={styles.row2}>
              <Field
                label="Protein"
                unit="g/day"
                value={protein}
                onChange={setProtein}
              />
              <Field
                label="Carbs"
                unit="g/day"
                value={carbs}
                onChange={setCarbs}
              />
            </View>
            <View style={styles.row2}>
              <Field
                label="Fat"
                unit="g/day"
                value={fat}
                onChange={setFat}
              />
              <View style={styles.fieldSpacer} />
            </View>

            {/* TIMELINE */}
            <Text style={[styles.sectionLabel, { color: t.textTertiary }]}>TIMELINE</Text>
            <View style={styles.row2}>
              <Field
                label="Length"
                unit="weeks"
                value={timeframe}
                onChange={setTimeframe}
              />
              <View style={styles.fieldSpacer} />
            </View>

            {/* WEIGHT TARGETS */}
            <Text style={[styles.sectionLabel, { color: t.textTertiary }]}>WEIGHT (OPTIONAL)</Text>
            <View style={styles.unitToggle}>
              {WEIGHT_UNITS.map((u) => {
                const active = u === weightUnit;
                return (
                  <Pressable
                    key={u}
                    onPress={() => setWeightUnit(u)}
                    style={[
                      styles.unitChip,
                      {
                        backgroundColor: active ? t.primaryTintBg : t.bgCard,
                        borderColor: active ? t.primaryBorderStrong : t.borderDefault,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text
                      style={[
                        styles.unitChipText,
                        { color: active ? t.primary : t.textSecondary },
                      ]}
                    >
                      {u.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.row2}>
              <Field
                label="Starting"
                unit={weightUnit}
                value={startWeight}
                onChange={setStartWeight}
                decimal
              />
              <Field
                label="Target"
                unit={weightUnit}
                value={targetWeight}
                onChange={setTargetWeight}
                decimal
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={[styles.saveBtn, { backgroundColor: t.primary }, saving && styles.saveBtnDisabled]}
              accessibilityRole="button"
            >
              {saving ? (
                <ActivityIndicator size="small" color={t.textOnPrimary} />
              ) : (
                <Text style={[styles.saveBtnText, { color: t.textOnPrimary }]}>
                  {isEdit ? 'Save changes' : 'Save goal'}
                </Text>
              )}
            </Pressable>

            {isEdit ? (
              <Pressable
                onPress={() => setConfirmDelete(true)}
                disabled={removing || saving}
                style={[
                  styles.deleteBtn,
                  (removing || saving) && styles.deleteBtnDisabled,
                ]}
                accessibilityRole="button"
              >
                <Trash2 size={13} color="#E5736A" strokeWidth={2} />
                <Text style={styles.deleteBtnText}>Delete goal</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>

        <DeleteConfirmModal
          visible={confirmDelete}
          title="Delete goal?"
          message="This archives your current goal. Your food logs are preserved."
          confirmLabel="Delete"
          loading={removing}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
        />
      </SafeAreaView>
    </Modal>
  );
}

type FieldProps = {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  signed?: boolean;
  decimal?: boolean;
};

function Field({ label, unit, value, onChange, signed, decimal }: FieldProps) {
  const t = useTokens();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: t.textSecondary }]}>{label}</Text>
      <View style={[styles.fieldInputWrap, { backgroundColor: t.bgCard, borderColor: t.borderDefault }]}>
        <TextInput
          style={[styles.fieldInput, { color: t.textPrimary }, Tabular]}
          value={value}
          onChangeText={(v) => {
            // Strip whitespace; allow optional leading minus for signed,
            // and a decimal point for decimal fields.
            let cleaned = v.replace(/[^0-9.\-]/g, '');
            if (!signed) cleaned = cleaned.replace(/-/g, '');
            if (!decimal) cleaned = cleaned.replace(/\./g, '');
            // Only allow one leading '-'
            if (signed) {
              cleaned = cleaned.replace(/(?!^)-/g, '');
            }
            // Only allow one '.'
            if (decimal) {
              const firstDot = cleaned.indexOf('.');
              if (firstDot !== -1) {
                cleaned =
                  cleaned.slice(0, firstDot + 1) +
                  cleaned.slice(firstDot + 1).replace(/\./g, '');
              }
            }
            onChange(cleaned);
          }}
          placeholder="0"
          placeholderTextColor={t.textQuaternary}
          keyboardType={
            decimal ? 'decimal-pad' : signed ? 'numbers-and-punctuation' : 'number-pad'
          }
          inputMode={decimal ? 'decimal' : 'numeric'}
        />
        <Text style={[styles.fieldUnit, { color: t.textTertiary }]}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  headerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSpacer: { width: 32, height: 32 },
  title: {
    flex: 1,
    fontFamily: Font.bold,
    fontSize: 15,
    textAlign: 'center',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 36,
  },
  sectionLabel: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 0.8,
    marginTop: 18,
    marginBottom: 10,
  },
  segmented: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  segmentLabel: {
    fontFamily: Font.bold,
    fontSize: 12,
  },
  row2: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  field: {
    flex: 1,
    gap: 6,
  },
  fieldSpacer: { flex: 1 },
  fieldLabel: {
    fontFamily: Font.semibold,
    fontSize: 11,
  },
  fieldInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 6,
  },
  fieldInput: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: 14,
  },
  fieldUnit: {
    fontFamily: Font.medium,
    fontSize: 11,
  },
  unitToggle: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  unitChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  unitChipText: {
    fontFamily: Font.bold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  errorText: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: '#E5736A',
    marginTop: 12,
    textAlign: 'center',
  },
  saveBtn: {
    marginTop: 22,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    fontFamily: Font.bold,
    fontSize: 14,
  },
  deleteBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderColor: 'rgba(229, 115, 106, 0.25)',
    borderWidth: 1,
    backgroundColor: 'rgba(229, 115, 106, 0.08)',
  },
  deleteBtnDisabled: { opacity: 0.6 },
  deleteBtnText: {
    fontFamily: Font.semibold,
    fontSize: 13,
    color: '#E5736A',
  },
});
