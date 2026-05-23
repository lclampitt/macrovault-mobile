import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { findExerciseById, titleCase } from '../../lib/exercises';
import { useActiveGoal } from '../../hooks/useActiveGoal';

const GOAL_LABEL: Record<string, string> = {
  cutting: 'Cutting',
  bulking: 'Bulking',
  maintenance: 'Maintenance',
};

export default function ExerciseDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { goal: activeGoal } = useActiveGoal();
  const exercise = id ? findExerciseById(id) : null;

  function handleBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/exercise-library');
  }

  if (!exercise) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            hitSlop={10}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Feather name="chevron-left" size={20} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Exercise</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.center}>
          <Text style={styles.missingText}>Couldn&apos;t find that exercise.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Sets/reps guidance — show all 3 phases; highlight the user's current
  // active phase if they have one set.
  const sr = exercise.setsRepsGuidance;
  const userPhase = activeGoal?.phaseType ?? null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          hitSlop={10}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="chevron-left" size={20} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {exercise.name}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroName}>{exercise.name}</Text>
          <View style={styles.chipsRow}>
            <HeroChip label={titleCase(exercise.bodyPart)} accent />
            <HeroChip label={titleCase(exercise.equipment)} />
            <HeroChip label={titleCase(exercise.difficulty)} />
          </View>
          <View style={styles.musclesBlock}>
            <Text style={styles.muscleLabel}>Target muscle</Text>
            <Text style={styles.muscleValue}>
              {titleCase(exercise.targetMuscle)}
            </Text>
            {exercise.secondaryMuscles?.length ? (
              <>
                <Text style={[styles.muscleLabel, { marginTop: 8 }]}>
                  Also works
                </Text>
                <Text style={styles.muscleValue}>
                  {exercise.secondaryMuscles.map(titleCase).join(', ')}
                </Text>
              </>
            ) : null}
          </View>
        </View>

        <Section title="HOW TO PERFORM">
          {exercise.instructions.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </Section>

        {exercise.formCues?.length ? (
          <Section title="FORM CUES">
            {exercise.formCues.map((c, i) => (
              <BulletRow key={i} text={c} tint={Colors.accentLight} />
            ))}
          </Section>
        ) : null}

        {exercise.commonMistakes?.length ? (
          <Section title="COMMON MISTAKES">
            {exercise.commonMistakes.map((c, i) => (
              <BulletRow key={i} text={c} tint={Colors.fatColor} />
            ))}
          </Section>
        ) : null}

        {sr ? (
          <Section title="SETS & REPS">
            {(['cutting', 'bulking', 'maintenance'] as const).map((p) => {
              const value = sr[p];
              if (!value) return null;
              const highlighted = userPhase === p;
              return (
                <View
                  key={p}
                  style={[styles.srRow, highlighted && styles.srRowActive]}
                >
                  <Text
                    style={[
                      styles.srLabel,
                      highlighted && styles.srLabelActive,
                    ]}
                  >
                    {GOAL_LABEL[p]}
                  </Text>
                  <Text style={styles.srValue}>{value}</Text>
                </View>
              );
            })}
            {userPhase ? (
              <Text style={styles.srHint}>
                Highlighted row matches your current Goal Planner phase.
              </Text>
            ) : null}
          </Section>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeader}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function HeroChip({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <View style={[styles.heroChip, accent && styles.heroChipAccent]}>
      <Text style={[styles.heroChipText, accent && styles.heroChipTextAccent]}>
        {label}
      </Text>
    </View>
  );
}

function BulletRow({ text, tint }: { text: string; tint: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={[styles.bulletDot, { backgroundColor: tint }]} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  headerSpacer: { width: 32, height: 32 },
  scroll: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 140,
    gap: 14,
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  heroName: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  heroChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    borderColor: Colors.border,
    borderWidth: 1,
    backgroundColor: Colors.background,
  },
  heroChipAccent: {
    borderColor: Colors.borderAccentSoft,
    backgroundColor: Colors.accentSofter,
  },
  heroChipText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  heroChipTextAccent: {
    color: Colors.accentLight,
  },
  musclesBlock: {
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  muscleLabel: {
    color: Colors.textHint,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 6,
  },
  muscleValue: {
    color: Colors.textPrimary,
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    color: Colors.textHint,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    paddingHorizontal: 2,
  },
  sectionBody: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 10,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    color: Colors.accentLight,
    fontSize: 11,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  srRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 9,
    backgroundColor: Colors.background,
    borderColor: Colors.borderSubtle,
    borderWidth: 1,
  },
  srRowActive: {
    borderColor: Colors.borderAccent,
    backgroundColor: Colors.accentSofter,
  },
  srLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  srLabelActive: {
    color: Colors.accentLight,
  },
  srValue: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 12,
    textAlign: 'right',
  },
  srHint: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
});
