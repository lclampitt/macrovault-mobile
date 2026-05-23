import { useEffect, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import type { ActiveGoal } from '../../hooks/useActiveGoal';
import {
  useGoalMutations,
  type GoalSavePayload,
} from '../../hooks/useGoalMutations';
import DeleteConfirmModal from '../progress/DeleteConfirmModal';

type Props = {
  visible: boolean;
  /** When present, modal opens in edit mode prefilled from the row. */
  initial: ActiveGoal | null;
  onClose: () => void;
  onSaved: () => void;
};

type GoalType = GoalSavePayload['goal'];
const GOAL_TYPES: GoalType[] = ['Cutting', 'Bulking', 'Maintenance'];

function intStr(n: number | undefined): string {
  if (n == null || !Number.isFinite(n) || n <= 0) return '';
  return String(Math.round(n));
}

export default function GoalEditorModal({
  visible,
  initial,
  onClose,
  onSaved,
}: Props) {
  const [goalType, setGoalType] = useState<GoalType>('Cutting');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { save, remove, saving, removing } = useGoalMutations();

  // Reset state every time the modal opens.
  useEffect(() => {
    if (!visible) return;
    if (initial) {
      const raw = initial.goal as GoalType;
      setGoalType(GOAL_TYPES.includes(raw) ? raw : 'Cutting');
      setCalories(intStr(initial.calories));
      setProtein(intStr(initial.protein));
      setCarbs(intStr(initial.carbs));
      setFat(intStr(initial.fat));
      setTimeframe(intStr(initial.timeframeWeeks));
    } else {
      setGoalType('Cutting');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      setTimeframe('');
    }
    setError(null);
    setConfirmDelete(false);
  }, [visible, initial]);

  async function handleSave() {
    setError(null);
    const calsN = parseInt(calories, 10);
    const proN = parseInt(protein, 10) || 0;
    const carbN = parseInt(carbs, 10) || 0;
    const fatN = parseInt(fat, 10) || 0;
    const weeksN = parseInt(timeframe, 10);
    if (!calsN || calsN <= 0) {
      setError('Calories must be greater than 0.');
      return;
    }
    if (!weeksN || weeksN <= 0) {
      setError('Timeframe (weeks) must be greater than 0.');
      return;
    }
    const r = await save({
      goal: goalType,
      calories: calsN,
      protein: proN,
      carbs: carbN,
      fat: fatN,
      timeframe_weeks: weeksN,
    });
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

  const title = initial ? 'Edit goal' : 'Set up a goal';
  const canDelete = !!initial?.id;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <View style={styles.header}>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Feather name="x" size={18} color={Colors.textPrimary} />
            </Pressable>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.iconSpacer} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionLabel}>GOAL TYPE</Text>
            <View style={styles.pillsRow}>
              {GOAL_TYPES.map((g) => {
                const active = g === goalType;
                return (
                  <Pressable
                    key={g}
                    onPress={() => setGoalType(g)}
                    style={[styles.pill, active && styles.pillActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text
                      style={[styles.pillText, active && styles.pillTextActive]}
                    >
                      {g}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>MACRONUTRIENTS</Text>
            <View style={styles.grid}>
              <Field
                label="Calories"
                unit="kcal/day"
                value={calories}
                onChange={setCalories}
              />
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
              <Field
                label="Fat"
                unit="g/day"
                value={fat}
                onChange={setFat}
              />
            </View>

            <Text style={styles.sectionLabel}>TIMEFRAME</Text>
            <View style={styles.timeframeWrap}>
              <Field
                label="Weeks"
                unit="weeks"
                value={timeframe}
                onChange={setTimeframe}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              accessibilityRole="button"
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>
                  {initial ? 'Save changes' : 'Save goal'}
                </Text>
              )}
            </Pressable>

            {canDelete ? (
              <Pressable
                onPress={() => setConfirmDelete(true)}
                disabled={removing || saving}
                style={[
                  styles.deleteBtn,
                  (removing || saving) && styles.deleteBtnDisabled,
                ]}
                accessibilityRole="button"
              >
                <Feather name="trash-2" size={13} color={Colors.error} />
                <Text style={styles.deleteBtnText}>Delete goal</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>

        <DeleteConfirmModal
          visible={confirmDelete}
          title="Delete goal?"
          message="This removes your current goal entirely. Your food logs are preserved."
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
};

function Field({ label, unit, value, onChange }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldInputWrap}>
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChange}
          placeholder="0"
          placeholderTextColor={Colors.textHint}
          keyboardType="numeric"
          inputMode="numeric"
        />
        <Text style={styles.fieldUnit}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
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
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 32,
    gap: 8,
  },
  sectionLabel: {
    color: Colors.textHint,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginTop: 14,
    marginBottom: 8,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderColor: Colors.border,
    borderWidth: 1,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  pillActive: {
    borderColor: Colors.borderAccent,
    backgroundColor: Colors.accentSoft,
  },
  pillText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  pillTextActive: {
    color: Colors.accentLight,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  field: {
    width: '47%',
    flexGrow: 1,
    gap: 4,
  },
  fieldLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  fieldInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  fieldInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  fieldUnit: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  timeframeWrap: {
    flexDirection: 'row',
    gap: 10,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
  saveBtn: {
    marginTop: 22,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  deleteBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    borderColor: Colors.errorBorder,
    borderWidth: 1,
    backgroundColor: Colors.errorBg,
  },
  deleteBtnDisabled: { opacity: 0.6 },
  deleteBtnText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '600',
  },
});
