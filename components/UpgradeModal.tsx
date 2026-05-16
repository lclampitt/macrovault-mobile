import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const PERKS = [
  'Unlimited workout logging',
  'Progress charts',
  'Meal Planner',
  'Goal Planner',
];

export default function UpgradeModal({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.crown}>
            <MaterialCommunityIcons name="crown" size={22} color={Colors.favoriteStar} />
          </View>
          <Text style={styles.title}>You&apos;ve hit the free limit</Text>
          <Text style={styles.message}>
            Free accounts can log up to 7 workouts. Upgrade to Pro for
            unlimited logging and more.
          </Text>

          <View style={styles.perks}>
            {PERKS.map((p) => (
              <View key={p} style={styles.perkRow}>
                <Feather name="check" size={15} color={Colors.accentLight} />
                <Text style={styles.perkText}>{p}</Text>
              </View>
            ))}
          </View>

          <Pressable
            style={styles.primaryBtn}
            onPress={() => {
              // Placeholder — real Stripe checkout is a future phase.
              console.log('Upgrade to Pro tapped — Stripe checkout (future phase)');
            }}
            accessibilityRole="button"
            accessibilityLabel="Upgrade to Pro"
          >
            <Text style={styles.primaryText}>Upgrade to Pro</Text>
          </Pressable>
          <Pressable
            style={styles.ghostBtn}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Maybe later"
          >
            <Text style={styles.ghostText}>Maybe later</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 22,
  },
  crown: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  perks: {
    gap: 8,
    marginBottom: 20,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  perkText: {
    color: Colors.textPrimary,
    fontSize: 14,
  },
  primaryBtn: {
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  ghostBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  ghostText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
