import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { Font, Tabular } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';

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
  const t = useTokens();
  const perSide = (weightLb - barWeight) / 2;
  const plates = perSide > 0 ? computePlates(perSide) : [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.backdrop, { backgroundColor: t.bgOverlay }]}
        onPress={onClose}
      >
        <Pressable
          style={[
            styles.modal,
            { backgroundColor: t.bgCard, borderColor: t.borderDefault },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: t.textPrimary }]}>Plate calculator</Text>
            <Pressable
              onPress={onClose}
              hitSlop={6}
              style={[
                styles.closeBtn,
                { backgroundColor: t.bgCardElevated, borderColor: t.borderDefault },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={12} color={t.textSecondary} strokeWidth={2} />
            </Pressable>
          </View>

          <View style={[styles.weightBlock, { borderBottomColor: t.borderDefault }]}>
            <Text style={[styles.label, { color: t.textTertiary }]}>TOTAL WEIGHT</Text>
            <Text style={[styles.weight, Tabular, { color: t.textPrimary }]}>{weightLb}</Text>
            <Text style={[styles.unit, Tabular, { color: t.textSecondary }]}>
              lb · {barWeight} lb bar
            </Text>
          </View>

          {perSide > 0 ? (
            <>
              <Text style={[styles.subLabel, { color: t.textTertiary }]}>
                PER SIDE ({perSide} LB)
              </Text>
              <View style={styles.platesCol}>
                {plates.map((p) => (
                  <View
                    key={p.size}
                    style={[
                      styles.plateRow,
                      { backgroundColor: t.bgCardElevated, borderColor: t.borderDefault },
                    ]}
                  >
                    <View style={styles.plateLeft}>
                      <View style={[styles.plateBar, { backgroundColor: t.primary }]} />
                      <Text style={[styles.plateSize, Tabular, { color: t.textPrimary }]}>
                        {p.size} lb
                      </Text>
                    </View>
                    <Text style={[styles.plateCount, Tabular, { color: t.primary }]}>
                      ×{p.count}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={[styles.barOnly, { color: t.textTertiary }]}>
              Bar only — no plates needed
            </Text>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 360,
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
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightBlock: {
    alignItems: 'center',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  label: {
    fontFamily: Font.bold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  weight: {
    fontFamily: Font.bold,
    fontSize: 36,
    letterSpacing: -0.8,
    lineHeight: 40,
    marginTop: 4,
  },
  unit: {
    fontFamily: Font.medium,
    fontSize: 11,
    marginTop: 2,
  },
  subLabel: {
    fontFamily: Font.bold,
    fontSize: 10,
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
  },
  plateSize: {
    fontFamily: Font.bold,
    fontSize: 13,
  },
  plateCount: {
    fontFamily: Font.bold,
    fontSize: 13,
  },
  barOnly: {
    fontFamily: Font.medium,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
