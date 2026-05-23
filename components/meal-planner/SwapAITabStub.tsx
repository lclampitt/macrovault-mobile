import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

/**
 * Phase 10c will wire this tab to POST /meal-planner/suggest on the FastAPI
 * backend (5 Claude-generated options for this slot).
 */
export default function SwapAITabStub() {
  return (
    <View style={styles.wrap}>
      <View style={styles.bubble}>
        <Feather name="zap" size={22} color={Colors.accentLight} />
      </View>
      <Text style={styles.title}>AI Suggest</Text>
      <Text style={styles.body}>
        Coming soon — Phase 10c. Will use Claude to generate 5 meal options
        that fit your remaining macros for the day.
      </Text>
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Pro+ only</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>300 / month</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingTop: 30,
    paddingHorizontal: 24,
    gap: 10,
  },
  bubble: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  body: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    maxWidth: 320,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.borderAccentSoft,
    backgroundColor: Colors.accentSofter,
  },
  badgeText: {
    color: Colors.accentLight,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
