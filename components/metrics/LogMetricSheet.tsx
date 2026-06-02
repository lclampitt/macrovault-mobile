import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
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
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  MessageSquarePlus,
  Pencil,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Font, Radius, Shadow, Tabular } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';
import {
  deltaIsGood,
  formatMetricValue,
  type Metric,
} from '../../lib/metrics-catalog';
import { useMetricEntries } from '../../hooks/useMetricEntries';
import { useLogMetricEntry } from '../../hooks/useLogMetricEntry';
import { useUpdateMetricEntry } from '../../hooks/useUpdateMetricEntry';

type Mode = 'quick' | 'full';

export type EditingEntry = {
  id: string;
  value: number;
  loggedAt: string; // ISO
  notes?: string;
};

type Props = {
  visible: boolean;
  metric: Metric | null;
  initialMode?: Mode;
  /** When present, the sheet renders in amber Edit mode. */
  editingEntry?: EditingEntry | null;
  onClose: () => void;
  onSaved?: (entry: { value: number; date: Date; notes?: string }) => void;
  /** Fires when the user taps "Delete this entry" inside Edit mode.
   *  The caller is responsible for showing the confirm dialog. */
  onRequestDelete?: () => void;
};

const DESTRUCTIVE = '#A87C5E';
const DELETE_COLOR = '#E5736A';
const AMBER = '#F59F00';

/**
 * Universal log sheet for any body metric. Invoked from:
 *   • Measurements tile tap
 *   • Stats "Log new entry" CTA
 *   • (Future) Dashboard quick-actions
 *
 * Design contract:
 *   • Custom 3×4 numeric keypad (NOT the iOS keyboard) for the value
 *   • Pre-fills with the last logged value of the metric
 *   • Quick mode: header, "Now" pill, value, keypad, save
 *   • Full mode: adds notes + recent entries list, expands sheet height
 *   • Save writes via useLogMetricEntry, fires onSaved, dismisses
 */
export default function LogMetricSheet({
  visible,
  metric,
  initialMode = 'quick',
  editingEntry,
  onClose,
  onSaved,
  onRequestDelete,
}: Props) {
  const t = useTokens();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isEdit = !!editingEntry;
  const [mode, setMode] = useState<Mode>(initialMode);
  const [value, setValue] = useState('0');
  const [notes, setNotes] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  const { entries, lastLoggedAt } = useMetricEntries(metric?.id ?? null, 'All');
  const { log, submitting: submittingCreate } = useLogMetricEntry();
  const { update, submitting: submittingUpdate } = useUpdateMetricEntry();
  const submitting = isEdit ? submittingUpdate : submittingCreate;

  // Pre-populate with either the editing entry's value (Edit mode) or the
  // metric's most recent value (Create mode).
  useEffect(() => {
    if (!visible || !metric) return;
    if (editingEntry) {
      setValue(editingEntry.value.toFixed(metric.decimals));
      setNotes(editingEntry.notes ?? '');
    } else {
      const last = entries[entries.length - 1]?.value;
      setValue(
        typeof last === 'number'
          ? last.toFixed(metric.decimals)
          : metric.decimals > 0
            ? `0.${'0'.repeat(metric.decimals)}`
            : '0',
      );
      setNotes('');
    }
    setMode(initialMode);
    setSaveError(null);
  }, [visible, metric, entries, initialMode, editingEntry]);

  if (!metric) return null;
  // Narrowed alias so closures below can reference it without `!`.
  const m: Metric = metric;

  const Icon = m.icon;
  const numeric = Number(value);
  const valid =
    Number.isFinite(numeric) &&
    numeric >= m.bounds.min &&
    numeric <= m.bounds.max;

  const lastValueLabel = useMemo(() => {
    const last = entries[entries.length - 1];
    if (!last) return '—';
    return `${formatMetricValue(last.value, metric)} ${m.unit}`;
  }, [entries, metric]);

  const lastAgoLabel = useMemo(() => {
    if (!lastLoggedAt) return 'no entries yet';
    return relativeDate(new Date(lastLoggedAt));
  }, [lastLoggedAt]);

  // -- Keypad handlers -----------------------------------------------------

  function pushDigit(d: string) {
    setSaveError(null);
    setValue((v) => {
      if (v === '0' || v === '0.0' || v === '0.00') return d;
      // Cap at a reasonable length — keeps the hero number from overflowing.
      if (v.replace('.', '').length >= 6) return v;
      return v + d;
    });
  }
  function pushDecimal() {
    if (m.decimals === 0) return;
    setValue((v) => (v.includes('.') ? v : v + '.'));
  }
  function backspace() {
    setSaveError(null);
    setValue((v) => {
      const next = v.length > 1 ? v.slice(0, -1) : '0';
      return next;
    });
  }

  // -- Save ---------------------------------------------------------------

  async function handleSave() {
    if (!valid) {
      setSaveError(`Value out of range (${m.bounds.min}–${m.bounds.max} ${m.unit}).`);
      return;
    }
    const at = editingEntry ? new Date(editingEntry.loggedAt) : new Date();
    if (editingEntry) {
      // Short-circuit if nothing changed — avoid a needless backend round-trip.
      const sameValue =
        Math.abs(numeric - editingEntry.value) < 1e-6;
      const sameNotes =
        (notes.trim() || '') === (editingEntry.notes ?? '');
      if (sameValue && sameNotes) {
        onClose();
        return;
      }
      const r = await update({
        entryId: editingEntry.id,
        metric: m,
        value: numeric,
        loggedAt: at,
        notes: notes.trim() || undefined,
      });
      if (r.error) {
        setSaveError(r.error);
        return;
      }
    } else {
      const r = await log({
        metric: m,
        value: numeric,
        loggedAt: at,
        notes: notes.trim() || undefined,
      });
      if (r.error) {
        setSaveError(r.error);
        return;
      }
    }
    onSaved?.({ value: numeric, date: at, notes: notes.trim() || undefined });
    onClose();
  }

  // -- Recent entries (Full mode) -----------------------------------------

  const recent = useMemo(() => {
    return entries.slice(-3).reverse();
  }, [entries]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={[styles.sheetWrap, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={[styles.sheet, { backgroundColor: t.bgCard }]}>
          <SafeAreaView edges={[]} style={styles.sheetInner}>
            {/* Drag handle */}
            <View style={styles.handleRow}>
              <View style={[styles.handle, { backgroundColor: t.borderStrong }]} />
            </View>

            {/* Header — amber pencil in Edit mode, emerald metric icon in Create */}
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <View
                  style={[
                    styles.headerIconWrap,
                    { backgroundColor: t.primaryTintBg, borderColor: t.primaryTintBorder },
                    isEdit && styles.headerIconWrapEdit,
                  ]}
                >
                  {isEdit ? (
                    <Pencil size={12} color={AMBER} strokeWidth={2.5} />
                  ) : (
                    <Icon size={14} color={t.primary} strokeWidth={2.5} />
                  )}
                </View>
                <View>
                  <Text
                    style={[
                      styles.headerLabel,
                      { color: t.primary },
                      isEdit && { color: AMBER },
                    ]}
                  >
                    {isEdit ? 'EDITING ENTRY' : `LOG ${m.name.toUpperCase()}`}
                  </Text>
                  <Text style={[styles.headerSub, { color: t.textTertiary }]}>
                    {isEdit
                      ? `Originally logged ${formatLoggedAt(editingEntry!.loggedAt)}`
                      : `Last: ${lastValueLabel} · ${lastAgoLabel}`}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={8}
                style={[styles.closeBtn, { backgroundColor: t.bgCardElevated, borderColor: t.borderDefault }]}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X size={14} color={t.textSecondary} strokeWidth={2.5} />
              </Pressable>
            </View>

            {/* Body Fat exclusive: "Enter manually / Use analyzer"
                segmented toggle. The analyzer used to be a standalone
                page-level CTA on Measurements; we relocated it here so
                the entry point lives WHERE you'd log body fat. Tapping
                "Use analyzer" closes the sheet and pushes the existing
                NHANES analyzer route — that flow already writes back to
                body_metric_entries, so no extra wiring is needed. */}
            {m.id === 'bodyfat' && !isEdit ? (
              <View style={[styles.bfModeRow, { backgroundColor: t.bgCardElevated, borderColor: t.borderDefault }]}>
                <View
                  style={[
                    styles.bfModeChip,
                    {
                      backgroundColor: t.primaryTintBg,
                      borderColor: t.primaryBorderStrong,
                      borderWidth: 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: true }}
                >
                  <Pencil
                    size={12}
                    color={t.primary}
                    strokeWidth={2.5}
                  />
                  <Text
                    style={[styles.bfModeLabel, { color: t.primary }]}
                  >
                    Enter manually
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    onClose();
                    // Defer the navigation so the modal animates out
                    // cleanly before the analyzer mounts on top.
                    setTimeout(() => {
                      router.push('/body-fat-analyzer');
                    }, 220);
                  }}
                  style={({ pressed }) => [
                    styles.bfModeChip,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Open body fat analyzer"
                >
                  <Sparkles
                    size={12}
                    color={t.textSecondary}
                    strokeWidth={2.5}
                  />
                  <Text style={[styles.bfModeLabel, { color: t.textSecondary }]}>Use analyzer</Text>
                </Pressable>
              </View>
            ) : null}

            {/* Date pill — shows original date in Edit mode, "Logged now" in Create */}
            <View style={styles.nowRow}>
              <View
                style={[
                  styles.nowPill,
                  { backgroundColor: t.primaryTintBg, borderColor: t.primaryTintBorder },
                  isEdit && styles.nowPillEdit,
                ]}
              >
                <Clock
                  size={12}
                  color={isEdit ? AMBER : t.primary}
                  strokeWidth={2.5}
                />
                <Text
                  style={[
                    styles.nowPillText,
                    { color: t.primary },
                    isEdit && { color: AMBER },
                  ]}
                >
                  {isEdit
                    ? `Logged ${formatLoggedAt(editingEntry!.loggedAt)}`
                    : `Logged now · ${formatNowLabel()}`}
                </Text>
                <ChevronDown
                  size={12}
                  color={isEdit ? AMBER : t.primary}
                  strokeWidth={2.5}
                />
              </View>
            </View>

            {/* Big number display — amber in Edit mode, emerald in Create */}
            <View style={styles.valueRow}>
              <Text
                style={[
                  styles.valueText,
                  { color: t.primary },
                  Tabular,
                  isEdit && styles.valueTextEdit,
                  !valid && { color: DESTRUCTIVE },
                ]}
              >
                {value}
              </Text>
              <Text style={[styles.valueUnit, { color: t.textTertiary }]}>{m.unit}</Text>
            </View>
            {!valid ? (
              <Text style={styles.validation}>
                Value out of range ({m.bounds.min}–{m.bounds.max}{' '}
                {m.unit}).
              </Text>
            ) : null}

            {/* Mode toggle */}
            <View style={styles.modeRow}>
              <Pressable
                onPress={() => setMode(mode === 'quick' ? 'full' : 'quick')}
                style={[styles.modeBtn, { backgroundColor: t.bgCardElevated, borderColor: t.borderDefault }]}
                accessibilityRole="button"
                accessibilityLabel={mode === 'quick' ? 'Add details' : 'Show less'}
              >
                {mode === 'quick' ? (
                  <ChevronUp size={12} color={t.textSecondary} strokeWidth={2.5} />
                ) : (
                  <ChevronDown
                    size={12}
                    color={t.textSecondary}
                    strokeWidth={2.5}
                  />
                )}
                <Text style={[styles.modeBtnText, { color: t.textSecondary }]}>
                  {mode === 'quick' ? 'Add details' : 'Less'}
                </Text>
              </Pressable>
            </View>

            {/* Full mode extras */}
            {mode === 'full' ? (
              <ScrollView
                style={styles.fullScroll}
                contentContainerStyle={styles.fullScrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={[styles.notesRow, { backgroundColor: t.bgCardElevated, borderColor: t.borderDefault }]}>
                  <MessageSquarePlus
                    size={14}
                    color={t.textTertiary}
                    strokeWidth={2}
                  />
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Add a note (optional)"
                    placeholderTextColor={t.textQuaternary}
                    style={[styles.notesInput, { color: t.textPrimary }]}
                    maxLength={200}
                  />
                </View>

                <Text style={[styles.sectionLabel, { color: t.textTertiary }]}>RECENT ENTRIES</Text>
                {recent.length === 0 ? (
                  <View style={[styles.recentEmptyWrap, { backgroundColor: t.bgCardElevated, borderColor: t.borderDefault }]}>
                    <Text style={[styles.recentEmptyText, { color: t.textTertiary }]}>
                      No earlier entries yet.
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.recentList, { backgroundColor: t.bgCardElevated, borderColor: t.borderDefault }]}>
                    {recent.map((e, i) => {
                      const prior = entries[entries.length - 2 - i];
                      const d = prior ? +(e.value - prior.value).toFixed(2) : null;
                      const dColor =
                        d == null
                          ? t.textTertiary
                          : deltaIsGood(metric, d)
                            ? t.primary
                            : DESTRUCTIVE;
                      return (
                        <View
                          key={e.id}
                          style={[
                            styles.recentRow,
                            i < recent.length - 1 && [styles.recentDivider, { borderBottomColor: t.borderDefault }],
                          ]}
                        >
                          <Text style={[styles.recentDate, { color: t.textSecondary }]}>
                            {shortDate(e.loggedAt)}
                          </Text>
                          <View style={styles.recentRight}>
                            <Text style={[styles.recentValue, { color: t.textPrimary }, Tabular]}>
                              {formatMetricValue(e.value, metric)}
                              <Text style={[styles.recentUnit, { color: t.textTertiary }]}> {m.unit}</Text>
                            </Text>
                            {d != null ? (
                              <Text style={[styles.recentDelta, { color: dColor }]}>
                                {d > 0 ? '+' : ''}
                                {d.toFixed(m.decimals)}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            ) : null}

            {/* Custom numeric keypad */}
            <View style={styles.keypad}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => (
                <KeyButton key={k} label={k} onPress={() => pushDigit(k)} />
              ))}
              <KeyButton
                label={m.decimals > 0 ? '.' : ''}
                onPress={pushDecimal}
                disabled={m.decimals === 0}
              />
              <KeyButton label="0" onPress={() => pushDigit('0')} />
              <KeyButton label="⌫" onPress={backspace} />
            </View>

            {saveError ? (
              <Text style={styles.saveError}>{saveError}</Text>
            ) : null}

            {/* Save — emerald in Create, amber in Edit */}
            <Pressable
              onPress={handleSave}
              disabled={!valid || submitting}
              style={({ pressed }) => [
                styles.saveBtn,
                { backgroundColor: t.primary, shadowColor: t.primary },
                isEdit && styles.saveBtnEdit,
                (!valid || submitting) && styles.saveBtnDisabled,
                pressed && valid && !submitting && styles.saveBtnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={
                isEdit ? `Save ${m.name} changes` : `Save ${m.name} entry`
              }
            >
              <LinearGradient
                colors={
                  isEdit ? [AMBER, '#C47F00'] : [t.primaryGradientStart, t.primaryGradientEnd]
                }
                style={styles.saveBtnFill}
              />
              {submitting ? (
                <ActivityIndicator color={t.textOnPrimary} size="small" />
              ) : (
                <View style={styles.saveBtnContent}>
                  <Check size={16} color={t.textOnPrimary} strokeWidth={3} />
                  <Text style={[styles.saveBtnText, { color: t.textOnPrimary }]}>
                    {isEdit ? 'Save changes' : 'Save entry'}
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Delete link — Edit mode only */}
            {isEdit && onRequestDelete ? (
              <Pressable
                onPress={onRequestDelete}
                style={({ pressed }) => [
                  styles.deleteLink,
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Delete this entry"
              >
                <Trash2 size={14} color={DELETE_COLOR} strokeWidth={2} />
                <Text style={styles.deleteLinkText}>Delete this entry</Text>
              </Pressable>
            ) : null}
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

function KeyButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const t = useTokens();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || label === ''}
      style={({ pressed }) => [
        styles.key,
        { backgroundColor: t.bgCardElevated, borderColor: t.borderDefault },
        disabled && styles.keyDisabled,
        pressed && !disabled && [styles.keyPressed, { backgroundColor: t.borderDefault }],
      ]}
      accessibilityRole="button"
      accessibilityLabel={
        label === '⌫'
          ? 'Delete last digit'
          : label === '.'
            ? 'Decimal point'
            : label || 'unused'
      }
    >
      <Text style={[styles.keyLabel, { color: t.textPrimary }, Tabular]}>{label}</Text>
    </Pressable>
  );
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function formatLoggedAt(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const time = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${date} · ${time}`;
}

function formatNowLabel(): string {
  const now = new Date();
  const d = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const t = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${d}, ${t}`;
}

function relativeDate(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} wk ago`;
  return `${Math.floor(days / 30)} mo ago`;
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// --------------------------------------------------------------------------
// Styles
// --------------------------------------------------------------------------

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16, 185, 129, 0.2)',
    ...Shadow.emeraldGlow,
  },
  sheetInner: {
    paddingBottom: 8,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  headerSub: {
    fontFamily: Font.medium,
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Body-fat-specific "Enter manually / Use analyzer" toggle.
  bfModeRow: {
    flexDirection: 'row',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
  },
  bfModeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  bfModeLabel: {
    fontFamily: Font.bold,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  pressed: { opacity: 0.85 },
  nowRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  nowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  nowPillText: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 0.2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 8,
  },
  valueText: {
    fontFamily: Font.extrabold,
    fontSize: 72,
    letterSpacing: -2.5,
    lineHeight: 76,
    textShadowColor: 'rgba(16, 185, 129, 0.4)',
    textShadowRadius: 32,
  },
  valueUnit: {
    fontFamily: Font.bold,
    fontSize: 20,
  },
  validation: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DESTRUCTIVE,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 4,
  },
  modeRow: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  modeBtnText: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 0.2,
  },
  // Full-mode extras
  fullScroll: {
    maxHeight: 260,
  },
  fullScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 8,
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  notesInput: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: 12,
  },
  sectionLabel: {
    fontFamily: Font.bold,
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 4,
  },
  recentEmptyWrap: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  recentEmptyText: {
    fontFamily: Font.medium,
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  recentList: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  recentDivider: {
    borderBottomWidth: 1,
  },
  recentDate: {
    fontFamily: Font.bold,
    fontSize: 11,
  },
  recentRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  recentValue: {
    fontFamily: Font.bold,
    fontSize: 12,
  },
  recentUnit: {
    fontFamily: Font.bold,
    fontSize: 9,
  },
  recentDelta: {
    fontFamily: Font.bold,
    fontSize: 9,
    fontVariant: ['tabular-nums'],
  },
  // Keypad
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 8,
    gap: 6,
  },
  key: {
    flexBasis: '32%',
    flexGrow: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyDisabled: {
    opacity: 0.3,
  },
  keyPressed: {
    transform: [{ scale: 0.96 }],
  },
  keyLabel: {
    fontFamily: Font.semibold,
    fontSize: 22,
  },
  // Save
  saveError: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DESTRUCTIVE,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginTop: 4,
  },
  saveBtn: {
    height: 48,
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: Radius.card,
    overflow: 'hidden',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnPressed: {
    transform: [{ scale: 0.98 }],
  },
  saveBtnFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  saveBtnContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: {
    fontFamily: Font.bold,
    fontSize: 14,
  },
  // Edit-mode amber theme
  headerIconWrapEdit: {
    backgroundColor: 'rgba(245, 159, 0, 0.15)',
    borderColor: 'rgba(245, 159, 0, 0.25)',
  },
  nowPillEdit: {
    backgroundColor: 'rgba(245, 159, 0, 0.08)',
    borderColor: 'rgba(245, 159, 0, 0.2)',
  },
  valueTextEdit: {
    color: AMBER,
    textShadowColor: 'rgba(245, 159, 0, 0.4)',
  },
  saveBtnEdit: {
    shadowColor: AMBER,
  },
  deleteLink: {
    marginTop: 6,
    marginBottom: 4,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteLinkText: {
    fontFamily: Font.bold,
    fontSize: 12,
    color: DELETE_COLOR,
    letterSpacing: 0.1,
  },
});
