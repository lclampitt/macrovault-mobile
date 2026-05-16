import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import {
  buildRepMaxTable,
  calculateOneRepMax,
} from '../lib/calculators';
import { saveOneRmResult } from '../lib/calculatorStorage';

type Unit = 'lbs' | 'kg';

export default function OneRepMaxCalculatorScreen() {
  const router = useRouter();
  const [unit, setUnit] = useState<Unit>('lbs');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [oneRepMax, setOneRepMax] = useState<number | null>(null);

  const table = useMemo(
    () => (oneRepMax != null ? buildRepMaxTable(oneRepMax) : []),
    [oneRepMax],
  );

  function handleBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/calculators');
  }

  async function handleCalculate() {
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    const result = calculateOneRepMax(w, r);
    if (result == null) {
      setOneRepMax(null);
      return;
    }
    setOneRepMax(result);
    await saveOneRmResult({
      oneRepMax: result,
      unit,
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          hitSlop={10}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="chevron-left" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>One-Rep Max Calculator</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>
          Estimate your 1-rep max and training weights for strength
          programming.
        </Text>

        <View style={styles.card}>
          {/* Unit toggle */}
          <Text style={styles.label}>Unit</Text>
          <View style={styles.unitRow}>
            {(['lbs', 'kg'] as Unit[]).map((u) => {
              const active = unit === u;
              return (
                <Pressable
                  key={u}
                  onPress={() => setUnit(u)}
                  style={[styles.unitPill, active && styles.unitPillActive]}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.unitPillText,
                      active && styles.unitPillTextActive,
                    ]}
                  >
                    {u}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Weight Lifted</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            placeholder={`Enter weight in ${unit}`}
            placeholderTextColor={Colors.textHint}
            keyboardType="numeric"
            inputMode="decimal"
          />

          <Text style={styles.label}>Reps</Text>
          <TextInput
            style={styles.input}
            value={reps}
            onChangeText={setReps}
            placeholder="e.g. 5"
            placeholderTextColor={Colors.textHint}
            keyboardType="numeric"
            inputMode="numeric"
          />

          <Pressable
            style={styles.primaryBtn}
            onPress={handleCalculate}
            accessibilityRole="button"
          >
            <Text style={styles.primaryBtnText}>Calculate 1RM</Text>
          </Pressable>
        </View>

        {oneRepMax != null ? (
          <>
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Estimated One-Rep Max</Text>
              <Text style={styles.resultValue}>
                {oneRepMax}
                <Text style={styles.resultUnit}> {unit}</Text>
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.tableHeading}>1-RM Table</Text>
              <View style={styles.tableHeadRow}>
                <Text style={[styles.th, styles.colReps]}>Reps</Text>
                <Text style={[styles.th, styles.colPct]}>% 1RM</Text>
                <Text style={[styles.th, styles.colWeight]}>
                  Weight ({unit})
                </Text>
              </View>
              {table.map((row, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.tableRow,
                    idx % 2 === 1 && styles.tableRowAlt,
                  ]}
                >
                  <Text style={[styles.td, styles.colReps]}>{row.reps}</Text>
                  <Text style={[styles.td, styles.colPct]}>{row.pct}%</Text>
                  <Text style={[styles.td, styles.colWeight]}>
                    {row.weight}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.aboutTitle}>About this calculator</Text>
          <Text style={styles.aboutBody}>
            This tool estimates your One-Rep Max (1RM) — the maximum weight you
            can lift for one repetition for a given exercise.
          </Text>
          <Text style={[styles.aboutBody, styles.aboutLead]}>
            Use it to guide strength training and progressive overload:
          </Text>
          {[
            'Determine training weights for 70–90% of your 1RM',
            'Track strength progress over time',
            'Compare lifts and plan periodized programs',
          ].map((b) => (
            <View key={b} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
    gap: 14,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 2,
  },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  unitRow: {
    flexDirection: 'row',
    gap: 8,
  },
  unitPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
  },
  unitPillActive: {
    borderColor: Colors.borderAccent,
    backgroundColor: Colors.accentSoft,
  },
  unitPillText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  unitPillTextActive: {
    color: Colors.accentLight,
  },
  input: {
    backgroundColor: Colors.surfaceMuted,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  primaryBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  resultCard: {
    backgroundColor: Colors.accentSoft,
    borderColor: Colors.borderAccent,
    borderWidth: 1,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  resultLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  resultValue: {
    color: Colors.textPrimary,
    fontSize: 40,
    fontWeight: '800',
  },
  resultUnit: {
    color: Colors.accentLight,
    fontSize: 20,
    fontWeight: '700',
  },
  tableHeading: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  tableHeadRow: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  th: {
    color: Colors.textHint,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  tableRowAlt: {
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 8,
  },
  td: {
    color: Colors.textPrimary,
    fontSize: 14,
  },
  colReps: {
    flex: 1,
    paddingLeft: 4,
  },
  colPct: {
    flex: 1,
    textAlign: 'center',
  },
  colWeight: {
    flex: 1.4,
    textAlign: 'right',
    paddingRight: 4,
    fontWeight: '600',
  },
  aboutTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  aboutBody: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  aboutLead: {
    marginTop: 10,
    marginBottom: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 3,
  },
  bulletDot: {
    color: Colors.accentLight,
    fontSize: 13,
    lineHeight: 19,
  },
  bulletText: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
});
