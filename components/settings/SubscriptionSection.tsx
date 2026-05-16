import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import SectionHeader from './SectionHeader';

/**
 * Static subscription card. Plan state is hardcoded to Pro+ until a
 * billing source is wired; "Manage billing" is a stub for now.
 */
export default function SubscriptionSection() {
  return (
    <View style={styles.card}>
      <SectionHeader
        icon={<Feather name="credit-card" size={14} color={Colors.accentLight} />}
        title="Subscription"
      />

      <View style={styles.body}>
        <View style={styles.field}>
          <Text style={styles.label}>Current plan</Text>
          <Text style={styles.sub}>
            Full access to all Pro+ features including AI suggestions
          </Text>
          <View style={styles.badge}>
            <MaterialCommunityIcons name="crown" size={12} color={Colors.accentLight} />
            <Text style={styles.badgeText}>Pro+</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.field}>
          <Text style={styles.label}>Billing &amp; invoices</Text>
          <Text style={styles.sub}>
            Update payment method, view invoices, or cancel
          </Text>
          <Pressable
            onPress={() => console.log('TODO: manage billing')}
            accessibilityRole="button"
            accessibilityLabel="Manage billing"
            style={({ pressed }) => [styles.manageButton, pressed && styles.manageButtonPressed]}
          >
            <Text style={styles.manageButtonText}>Manage billing</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
  },
  field: {
    gap: 6,
  },
  label: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  sub: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: 18,
    marginHorizontal: -20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Colors.accentSoft,
    borderWidth: 1,
    borderColor: Colors.borderAccentSoft,
  },
  badgeText: {
    color: Colors.accentLight,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  manageButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceMuted,
  },
  manageButtonPressed: {
    opacity: 0.7,
  },
  manageButtonText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
});
