import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { DS, Font, Tabular } from '../../lib/design-system';

type Props = {
  step: 1 | 2 | 3;
  onBack: () => void;
  onSkip?: () => void;
  /** When false, the skip target is hidden (Step 1 has no skip). */
  showSkip?: boolean;
};

export default function RegisterStepHeader({
  step,
  onBack,
  onSkip,
  showSkip,
}: Props) {
  const pct = step === 1 ? 33 : step === 2 ? 66 : 100;
  return (
    <View>
      <View style={styles.row}>
        <Pressable
          onPress={onBack}
          hitSlop={8}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowLeft size={16} color={DS.textSecondary} strokeWidth={2} />
        </Pressable>
        <View style={styles.stepRow}>
          <Text style={[styles.stepActive, Tabular]}>{step}</Text>
          <Text style={styles.stepSep}>/</Text>
          <Text style={[styles.stepDim, Tabular]}>3</Text>
        </View>
        {showSkip && onSkip ? (
          <Pressable
            onPress={onSkip}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Skip this step"
          >
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: DS.surface,
    borderWidth: 1,
    borderColor: DS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepActive: {
    fontFamily: Font.bold,
    fontSize: 11,
    color: DS.text,
  },
  stepSep: {
    fontFamily: Font.semibold,
    fontSize: 11,
    color: DS.textQuaternary,
  },
  stepDim: {
    fontFamily: Font.semibold,
    fontSize: 11,
    color: DS.textTertiary,
  },
  skip: {
    fontFamily: Font.bold,
    fontSize: 11,
    color: DS.textTertiary,
  },
  progressTrack: {
    height: 2,
    borderRadius: 1,
    backgroundColor: DS.border,
    overflow: 'hidden',
    marginTop: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: DS.accent,
    shadowColor: DS.accent,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
  },
});
