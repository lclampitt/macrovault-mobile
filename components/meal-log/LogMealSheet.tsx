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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  Barcode,
  Bookmark,
  Plus,
  ScanLine,
  Search,
  Sparkles,
  X,
} from 'lucide-react-native';
import { Font, Radius, Tabular } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import {
  PERIOD_ICONS,
  PERIOD_LABELS,
  periodFromDate,
  type MealPeriod,
} from '../../lib/meal-periods';
import { useFoodSearch } from '../../hooks/useFoodSearch';
import { scaleByGrams } from '../../lib/foodFacts';
import { useLogMeal } from '../../hooks/useLogMeal';
import type { MealPlanEntry } from '../../hooks/useMealPlanWeek';

const PERIODS: MealPeriod[] = ['morning', 'noon', 'evening', 'snack'];
type Mode = 'quick' | 'plan' | 'search' | 'scan' | 'describe';

type Props = {
  visible: boolean;
  /** Pre-selected period — caller can pass null to let the sheet derive from now. */
  initialPeriod?: MealPeriod | null;
  /** Pre-fill the title field (used when logging a scheduled meal). */
  initialTitle?: string;
  /**
   * Pre-fill the macro fields (used when logging a planned meal from the
   * Meals tab — one-tap confirmation rather than re-entry).
   */
  initialMacros?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  /** Force a specific initial mode. Defaults to Quick add. */
  initialMode?: 'quick' | 'search' | 'plan';
  /** Today's planned meals — powers the "From plan" tab. */
  plannedMeals?: MealPlanEntry[];
  onClose: () => void;
  /** Fired after a successful insert so the parent can refetch the day's log. */
  onLogged?: () => void;
};

// Tab order is deliberate — Quick add lands first (default mode), From plan
// is right next to it as the easiest one-tap entry for users who plan ahead.
const MODE_DEFS: Array<{
  key: Mode;
  label: string;
  Icon: typeof Search;
  available: boolean;
}> = [
  { key: 'quick', label: 'Quick add', Icon: Plus, available: true },
  { key: 'plan', label: 'From plan', Icon: Bookmark, available: true },
  { key: 'search', label: 'Search', Icon: Search, available: true },
  { key: 'scan', label: 'Scan', Icon: ScanLine, available: false },
  { key: 'describe', label: 'Describe', Icon: Sparkles, available: false },
];

/**
 * Shared meal-logging sheet.
 *
 * Reachable from:
 *  • Dashboard → +Log → Meal (or the inline "+ Log meal" affordance near the
 *    Today's Timeline header)
 *  • Meals tab → "Anything else to add?" / empty-slot CTAs / "Add a snack"
 *
 * Modes (matching the design spec):
 *   Search       — Open Food Facts (already wired via `useFoodSearch`)
 *   Scan barcode — NOTE: stubbed. Needs expo-barcode-scanner + permission
 *                  flow. The button is disabled today.
 *   Describe AI  — NOTE: stubbed. Wires into the FastAPI describe endpoint
 *                  on https://gainlytics-1.onrender.com. Disabled today.
 *   Quick add    — Fully wired. Manual macro entry → useLogMeal.
 *   From plan    — NOTE: stubbed. Will pull today's plan slots from
 *                  useMealPlanWeek. Disabled today.
 */
export default function LogMealSheet({
  visible,
  initialPeriod,
  initialTitle,
  initialMacros,
  initialMode = 'quick',
  plannedMeals,
  onClose,
  onLogged,
}: Props) {
  const t = useTokens();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [period, setPeriod] = useState<MealPeriod>(
    () => initialPeriod ?? periodFromDate(),
  );
  // Read the inset directly so the title clears the status bar even on the
  // first animation frame, where SafeAreaView can momentarily report 0.
  const insets = useSafeAreaInsets();

  // Reset state every open so the sheet doesn't leak prior input.
  useEffect(() => {
    if (!visible) return;
    setMode(initialMode);
    setPeriod(initialPeriod ?? periodFromDate());
  }, [visible, initialPeriod, initialMode]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView
        style={[styles.safeArea, { paddingTop: insets.top, backgroundColor: t.bgPage }]}
        edges={['bottom']}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          {/* Drag handle */}
          <View style={[styles.dragHandle, { backgroundColor: t.borderDefault }]} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: t.textPrimary }]}>Log a meal</Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={[styles.closeBtn, { backgroundColor: t.bgCardElevated }]}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={18} color={t.textSecondary} strokeWidth={2} />
            </Pressable>
          </View>

          {/* Period picker */}
          <PeriodPicker selected={period} onSelect={setPeriod} />

          {/* Mode tabs */}
          <ModeTabs active={mode} onChange={setMode} />

          <View style={styles.body}>
            {mode === 'search' ? (
              <SearchMode
                period={period}
                onLogged={() => {
                  onLogged?.();
                  onClose();
                }}
              />
            ) : mode === 'quick' ? (
              <QuickAddMode
                period={period}
                initialTitle={initialTitle}
                initialMacros={initialMacros}
                onLogged={() => {
                  onLogged?.();
                  onClose();
                }}
              />
            ) : mode === 'plan' ? (
              <PlanMode
                period={period}
                plannedMeals={plannedMeals ?? []}
                onLogged={() => {
                  onLogged?.();
                  onClose();
                }}
              />
            ) : (
              <StubMode mode={mode} />
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// --------------------------------------------------------------------------
// PeriodPicker
// --------------------------------------------------------------------------

function PeriodPicker({
  selected,
  onSelect,
}: {
  selected: MealPeriod;
  onSelect: (p: MealPeriod) => void;
}) {
  const t = useTokens();
  return (
    <View style={styles.periodRow}>
      {PERIODS.map((p) => {
        const Icon = PERIOD_ICONS[p];
        const active = selected === p;
        return (
          <Pressable
            key={p}
            onPress={() => onSelect(p)}
            style={({ pressed }) => [
              styles.periodChip,
              {
                backgroundColor: active ? t.primary : t.bgCard,
                borderColor: active ? t.primary : t.borderDefault,
              },
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${PERIOD_LABELS[p]} period`}
          >
            <Icon
              size={14}
              color={active ? t.textOnPrimary : t.textSecondary}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.periodChipLabel,
                { color: active ? t.textOnPrimary : t.textSecondary },
              ]}
            >
              {PERIOD_LABELS[p]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// --------------------------------------------------------------------------
// ModeTabs
// --------------------------------------------------------------------------

function ModeTabs({
  active,
  onChange,
}: {
  active: Mode;
  onChange: (m: Mode) => void;
}) {
  const t = useTokens();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.modeRowContent}
      style={styles.modeRow}
    >
      {MODE_DEFS.map(({ key, label, Icon, available }) => {
        const isActive = key === active;
        return (
          <Pressable
            key={key}
            onPress={() => available && onChange(key)}
            disabled={!available}
            style={({ pressed }) => [
              styles.modeChip,
              {
                backgroundColor: isActive ? t.primaryTintBg : t.bgCardElevated,
                borderColor: isActive ? t.primaryBorderStrong : t.borderDefault,
              },
              !available && styles.modeChipDisabled,
              pressed && available && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive, disabled: !available }}
            accessibilityLabel={label}
          >
            <Icon
              size={13}
              color={
                !available
                  ? t.textQuaternary
                  : isActive
                    ? t.primary
                    : t.textSecondary
              }
              strokeWidth={2}
            />
            <Text
              style={[
                styles.modeChipLabel,
                {
                  color: !available
                    ? t.textQuaternary
                    : isActive
                      ? t.primary
                      : t.textSecondary,
                },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// --------------------------------------------------------------------------
// Quick Add mode
// --------------------------------------------------------------------------

function QuickAddMode({
  period,
  initialTitle,
  initialMacros,
  onLogged,
}: {
  period: MealPeriod;
  initialTitle?: string;
  initialMacros?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  onLogged: () => void;
}) {
  const t = useTokens();
  const [title, setTitle] = useState(initialTitle ?? '');
  const [kcal, setKcal] = useState(
    initialMacros ? String(Math.round(initialMacros.calories)) : '',
  );
  const [protein, setProtein] = useState(
    initialMacros ? String(Math.round(initialMacros.protein)) : '',
  );
  const [carbs, setCarbs] = useState(
    initialMacros ? String(Math.round(initialMacros.carbs)) : '',
  );
  const [fat, setFat] = useState(
    initialMacros ? String(Math.round(initialMacros.fat)) : '',
  );
  const { log, submitting, error } = useLogMeal();

  const canSubmit =
    title.trim().length > 0 && Number(kcal) > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    const r = await log({
      title: title.trim(),
      calories: Number(kcal) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      period,
    });
    if (!r.error) onLogged();
  }

  return (
    <ScrollView
      contentContainerStyle={styles.formContent}
      keyboardShouldPersistTaps="handled"
    >
      <Field label="What did you eat?">
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Greek yogurt + berries"
          placeholderTextColor={t.textQuaternary}
          style={[
            styles.textInput,
            {
              backgroundColor: t.bgCardElevated,
              borderColor: t.borderDefault,
              color: t.textPrimary,
            },
          ]}
          autoCapitalize="sentences"
          returnKeyType="done"
        />
      </Field>

      <View style={styles.macroGrid}>
        <MacroField label="kcal" value={kcal} onChange={setKcal} />
        <MacroField label="Protein" value={protein} onChange={setProtein} suffix="g" />
        <MacroField label="Carbs" value={carbs} onChange={setCarbs} suffix="g" />
        <MacroField label="Fat" value={fat} onChange={setFat} suffix="g" />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable
        onPress={handleSubmit}
        disabled={!canSubmit}
        style={({ pressed }) => [
          styles.cta,
          { backgroundColor: t.primary },
          !canSubmit && styles.ctaDisabled,
          pressed && canSubmit && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Log meal"
        accessibilityState={{ disabled: !canSubmit }}
      >
        {submitting ? (
          <ActivityIndicator color={t.textOnPrimary} />
        ) : (
          <Text style={[styles.ctaText, { color: t.textOnPrimary }]}>Log meal</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const t = useTokens();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: t.textTertiary }]}>{label.toUpperCase()}</Text>
      {children}
    </View>
  );
}

function MacroField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
}) {
  const t = useTokens();
  return (
    <View style={styles.macroField}>
      <Text style={[styles.macroFieldLabel, { color: t.textTertiary }]}>{label.toUpperCase()}</Text>
      <View
        style={[
          styles.macroInputRow,
          { backgroundColor: t.bgCardElevated, borderColor: t.borderDefault },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="0"
          placeholderTextColor={t.textQuaternary}
          keyboardType="decimal-pad"
          inputMode="decimal"
          selectTextOnFocus
          style={[styles.macroInput, { color: t.textPrimary }, Tabular]}
        />
        {suffix ? (
          <Text style={[styles.macroSuffix, { color: t.textTertiary }]}>{suffix}</Text>
        ) : null}
      </View>
    </View>
  );
}

// --------------------------------------------------------------------------
// Search mode — Open Food Facts
// --------------------------------------------------------------------------

function SearchMode({
  period,
  onLogged,
}: {
  period: MealPeriod;
  onLogged: () => void;
}) {
  const t = useTokens();
  const [query, setQuery] = useState('');
  const [grams, setGrams] = useState('100');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { results, loading, searched } = useFoodSearch(query);
  const { log, submitting } = useLogMeal();

  const selected = useMemo(
    () => results.find((p) => p.id === selectedId) ?? null,
    [results, selectedId],
  );

  const scaled = useMemo(() => {
    if (!selected) return null;
    return scaleByGrams(selected, Number(grams) || 0);
  }, [selected, grams]);

  async function handleSubmit() {
    if (!selected || !scaled) return;
    const r = await log({
      title: `${selected.brand ? `${selected.brand} — ` : ''}${selected.name}`,
      calories: scaled.calories,
      protein: scaled.protein,
      carbs: scaled.carbs,
      fat: scaled.fat,
      period,
      ingredients: `${grams}g ${selected.name}`,
    });
    if (!r.error) onLogged();
  }

  return (
    <View style={styles.searchWrap}>
      <View
        style={[
          styles.searchInputWrap,
          { backgroundColor: t.bgCardElevated, borderColor: t.borderDefault },
        ]}
      >
        <Search size={14} color={t.textTertiary} strokeWidth={2} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search food (e.g. yogurt, oats, banana)"
          placeholderTextColor={t.textQuaternary}
          style={[styles.searchInput, { color: t.textPrimary }]}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      {loading ? (
        <View style={styles.searchLoading}>
          <ActivityIndicator color={t.primary} />
        </View>
      ) : !selected ? (
        <ScrollView
          contentContainerStyle={styles.resultsList}
          keyboardShouldPersistTaps="handled"
        >
          {searched && results.length === 0 ? (
            <Text style={[styles.emptyResults, { color: t.textTertiary }]}>
              Nothing found. Try a different name or use Quick add.
            </Text>
          ) : (
            results.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => setSelectedId(p.id)}
                style={({ pressed }) => [
                  styles.resultRow,
                  { backgroundColor: t.bgCard, borderColor: t.borderDefault },
                  pressed && styles.pressed,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.resultName, { color: t.textPrimary }]} numberOfLines={1}>
                    {p.name}
                  </Text>
                  {p.brand ? (
                    <Text style={[styles.resultBrand, { color: t.textTertiary }]}>{p.brand}</Text>
                  ) : null}
                </View>
                <Text style={[styles.resultKcal, { color: t.primary }, Tabular]}>
                  {Math.round(p.per100.calories)} kcal/100g
                </Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.formContent}>
          <Text style={[styles.selectedName, { color: t.textPrimary }]}>{selected.name}</Text>
          {selected.brand ? (
            <Text style={[styles.selectedBrand, { color: t.textTertiary }]}>{selected.brand}</Text>
          ) : null}

          <Field label="Grams">
            <TextInput
              value={grams}
              onChangeText={setGrams}
              keyboardType="numeric"
              inputMode="numeric"
              style={[
                styles.textInput,
                {
                  backgroundColor: t.bgCardElevated,
                  borderColor: t.borderDefault,
                  color: t.textPrimary,
                },
              ]}
              selectTextOnFocus
            />
          </Field>

          {scaled ? (
            <View style={styles.scaledRow}>
              <Stat label="kcal" value={String(scaled.calories)} />
              <Stat label="P" value={`${scaled.protein}g`} />
              <Stat label="C" value={`${scaled.carbs}g`} />
              <Stat label="F" value={`${scaled.fat}g`} />
            </View>
          ) : null}

          <View style={styles.searchActionRow}>
            <Pressable
              onPress={() => setSelectedId(null)}
              style={({ pressed }) => [
                styles.secondaryBtn,
                { backgroundColor: t.bgCard, borderColor: t.borderDefault },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.secondaryBtnText, { color: t.textSecondary }]}>Back</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={({ pressed }) => [
                styles.cta,
                { backgroundColor: t.primary },
                pressed && !submitting && styles.pressed,
                { flex: 1 },
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={t.textOnPrimary} />
              ) : (
                <Text style={[styles.ctaText, { color: t.textOnPrimary }]}>Log meal</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const t = useTokens();
  return (
    <View style={[styles.stat, { backgroundColor: t.bgCard, borderColor: t.borderDefault }]}>
      <Text style={[styles.statValue, { color: t.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: t.textTertiary }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

// --------------------------------------------------------------------------
// Stubbed modes
// --------------------------------------------------------------------------

function StubMode({ mode }: { mode: Mode }) {
  const t = useTokens();
  const copy = {
    scan: 'Barcode scanning is coming soon. It needs camera permission and the OFF lookup hookup.',
    describe:
      'AI Describe — type "1 burrito bowl with chicken, brown rice, black beans" and let the AI estimate macros. Wired to the FastAPI service in the next pass.',
  } as const;
  const key = mode as keyof typeof copy;
  const Icon = mode === 'scan' ? Barcode : Sparkles;
  return (
    <View style={styles.stubWrap}>
      <Icon size={28} color={t.textTertiary} strokeWidth={2} />
      <Text style={[styles.stubBody, { color: t.textSecondary }]}>{copy[key as 'scan' | 'describe']}</Text>
    </View>
  );
}

// --------------------------------------------------------------------------
// From-plan mode
// --------------------------------------------------------------------------

function PlanMode({
  period,
  plannedMeals,
  onLogged,
}: {
  period: MealPeriod;
  plannedMeals: MealPlanEntry[];
  onLogged: () => void;
}) {
  const t = useTokens();
  const { log, submitting } = useLogMeal();
  const [loggingId, setLoggingId] = useState<string | null>(null);

  async function handlePick(entry: MealPlanEntry) {
    if (submitting) return;
    setLoggingId(entry.id);
    const r = await log({
      title: entry.meal_name,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      period,
    });
    setLoggingId(null);
    if (!r.error) onLogged();
  }

  if (plannedMeals.length === 0) {
    return (
      <View style={styles.stubWrap}>
        <Bookmark size={28} color={t.textTertiary} strokeWidth={2} />
        <Text style={[styles.stubBody, { color: t.textSecondary }]}>
          You don't have any meals planned for today. Build a plan in the
          Meals tab and they'll show up here for one-tap logging.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.planList}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.planHint, { color: t.textTertiary }]}>
        Tap a planned meal to log it instantly. Macros are copied as-is.
      </Text>
      {plannedMeals.map((entry) => {
        const isLogging = loggingId === entry.id;
        return (
          <Pressable
            key={entry.id}
            onPress={() => handlePick(entry)}
            disabled={submitting}
            style={({ pressed }) => [
              styles.planRow,
              { backgroundColor: t.bgCard, borderColor: t.borderDefault },
              pressed && !submitting && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Log ${entry.meal_name}, ${Math.round(entry.calories)} kcal`}
          >
            <View
              style={[
                styles.planIcon,
                { backgroundColor: t.primaryTintBg, borderColor: t.primaryTintBorder },
              ]}
            >
              {isLogging ? (
                <ActivityIndicator size="small" color={t.primary} />
              ) : (
                <Bookmark size={14} color={t.primary} strokeWidth={2} />
              )}
            </View>
            <View style={styles.planBody}>
              <Text style={[styles.planName, { color: t.textPrimary }]} numberOfLines={1}>
                {entry.meal_name}
              </Text>
              <Text style={[styles.planMeta, { color: t.textTertiary }]}>
                {Math.round(entry.calories)} kcal · {Math.round(entry.protein)}
                P {Math.round(entry.carbs)}C {Math.round(entry.fat)}F
              </Text>
            </View>
            <Text style={[styles.planKcal, { color: t.primary }, Tabular]}>
              {Math.round(entry.calories)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// --------------------------------------------------------------------------
// Styles
// --------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: { flex: 1 },
  dragHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
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
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 10,
  },
  periodChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  periodChipLabel: {
    fontFamily: Font.bold,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  modeRow: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    flexGrow: 0,
  },
  modeRowContent: {
    gap: 8,
    paddingHorizontal: 8,
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  modeChipDisabled: {
    opacity: 0.45,
  },
  modeChipLabel: {
    fontFamily: Font.semibold,
    fontSize: 11,
  },
  body: { flex: 1 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  formContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 14,
  },
  field: { gap: 6 },
  fieldLabel: {
    fontFamily: Font.bold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: Radius.card,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: Font.medium,
    fontSize: 14,
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  macroField: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: 4,
  },
  macroFieldLabel: {
    fontFamily: Font.bold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  macroInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  macroInput: {
    flex: 1,
    paddingVertical: 10,
    fontFamily: Font.bold,
    fontSize: 15,
  },
  macroSuffix: {
    fontFamily: Font.medium,
    fontSize: 11,
    marginLeft: 4,
  },
  errorText: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: '#E5736A',
  },
  cta: {
    marginTop: 6,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: {
    fontFamily: Font.bold,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  // ---- Search mode
  searchWrap: { flex: 1 },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: 14,
  },
  searchLoading: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  resultsList: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 6,
  },
  emptyResults: {
    fontFamily: Font.medium,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 24,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
  },
  resultName: {
    fontFamily: Font.semibold,
    fontSize: 13,
  },
  resultBrand: {
    fontFamily: Font.medium,
    fontSize: 11,
    marginTop: 2,
  },
  resultKcal: {
    fontFamily: Font.bold,
    fontSize: 11,
  },
  selectedName: {
    fontFamily: Font.bold,
    fontSize: 16,
  },
  selectedBrand: {
    fontFamily: Font.medium,
    fontSize: 12,
    marginTop: -8,
  },
  scaledRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 10,
  },
  statValue: {
    fontFamily: Font.bold,
    fontSize: 14,
  },
  statLabel: {
    fontFamily: Font.bold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  searchActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  secondaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontFamily: Font.bold,
    fontSize: 13,
  },
  // ---- Stub
  stubWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 14,
  },
  stubBody: {
    fontFamily: Font.medium,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  // ---- From-plan list
  planList: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  planHint: {
    fontFamily: Font.medium,
    fontSize: 11,
    marginBottom: 4,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  planIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planBody: { flex: 1, minWidth: 0, gap: 2 },
  planName: {
    fontFamily: Font.bold,
    fontSize: 13,
    letterSpacing: -0.2,
  },
  planMeta: {
    fontFamily: Font.medium,
    fontSize: 10,
  },
  planKcal: {
    fontFamily: Font.bold,
    fontSize: 13,
  },
});
