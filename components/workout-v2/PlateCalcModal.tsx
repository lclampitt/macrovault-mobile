import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { DS, Font, Tabular } from '../../lib/design-system';

type Props = {
  visible: boolean;
  weightLb: number;
  /** Bar weight in lb (default 45 — Olympic). */
  barWeight?: number;
  onClose: () => void;
};

const PLATE_SIZES = [45, 35, 25, 10, 5, 2.5];

function computePlates(perSide: number): Array<{ size: number; count: number }> {
  let remaining = Math.max(0, perSide);
  const out: Array<{ size: number; count: number }> = [];
  for (const size of PLATE_SIZES) {
    const count = Math.floor(remaining / size);
    if (count > 0) {
      out.push({ size, count });
      remaining = +(remaining - count * size).toFixed(2);
    }
  }
  return out;
}

export default function PlateCalcModal({
  visible,
  weightLb,
  barWeight = 45,
  onClose,
}: Props) {
  const perSide = (weightLb - barWeight) / 2;
  const plates = perSide > 0 ? computePlates(perSide) : [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={styles.modal}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Plate calculator</Text>
            <Pressable
              onPress={onClose}
              hitSlop={6}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={12} color={DS.textSecondary} strokeWidth={2} />
            </Pressable>
          </View>

          <View style={styles.weightBlock}>
            <Text style={styles.label}>TOTAL WEIGHT</Text>
            <Text style={[styles.weight, Tabular]}>{weightLb}</Text>
            <Text style={[styles.unit, Tabular]}>
              lb · {barWeight} lb bar
            </Text>
          </View>

          {perSide > 0 ? (
            <>
              <Text style={styles.subLabel}>
                PER SIDE ({perSide} LB)
              </Text>
              <View style={styles.platesCol}>
                {plates.map((p) => (
                  <View key={p.size} style={styles.plateRow}>
                    <View style={styles.plateLeft}>
                      <View style={styles.plateBar} />
                      <Text style={[styles.plateSize, Tabular]}>
                        {p.size} lb
                      </Text>
                    </View>
                    <Text style={[styles.plateCount, Tabular]}>
                      ×{p.count}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.barOnly}>Bar only — no plates needed</Text>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: DS.surface,
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontFamily: Font.bold,
    fontSize: 16,
    color: DS.text,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#0F0F0F',
    borderColor: DS.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightBlock: {
    alignItems: 'center',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: DS.border,
  },
  label: {
    fontFamily: Font.bold,
    fontSize: 10,
    color: DS.textTertiary,
    letterSpacing: 0.8,
  },
  weight: {
    fontFamily: Font.bold,
    fontSize: 36,
    color: DS.text,
    letterSpacing: -0.8,
    lineHeight: 40,
    marginTop: 4,
  },
  unit: {
    fontFamily: Font.medium,
    fontSize: 11,
    color: DS.textSecondary,
    marginTop: 2,
  },
  subLabel: {
    fontFamily: Font.bold,
    fontSize: 10,
    color: DS.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  platesCol: {
    gap: 6,
  },
  plateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F0F0F',
    borderColor: DS.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  plateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  plateBar: {
    width: 6,
    height: 22,
    borderRadius: 3,
    backgroundColor: DS.accent,
  },
  plateSize: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: DS.text,
  },
  plateCount: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: DS.accent,
  },
  barOnly: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.textTertiary,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
