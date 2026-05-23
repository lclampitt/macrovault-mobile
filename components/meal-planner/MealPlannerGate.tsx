import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

/**
 * Pro upgrade gate — mirrors the web's MealPlannerGate (non-Pro users can't
 * see the planner). Tapping the upgrade buttons currently surfaces a placeholder
 * alert; real subscription flow lives behind a separate upgrade modal.
 */
export default function MealPlannerGate() {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconBubble}>
        <MaterialCommunityIcons
          name="silverware-fork-knife"
          size={36}
          color={Colors.accentLight}
        />
      </View>
      <Text style={styles.title}>Meal Planner is a Pro feature</Text>
      <Text style={styles.body}>
        Plan your weekly meals and macros with AI-powered suggestions. Track
        calories, protein, carbs, and fat across every meal.
      </Text>
      <Pressable
        style={styles.upgradeBtn}
        onPress={() =>
          Alert.alert(
            'Upgrade to Pro',
            'Subscription flow is wired up separately. For now this is a placeholder.',
          )
        }
        accessibilityRole="button"
      >
        <Text style={styles.upgradeBtnText}>Upgrade to Pro — $4.99/mo</Text>
      </Pressable>
      <Pressable
        onPress={() =>
          Alert.alert(
            'See what’s included',
            'Subscription flow is wired up separately. For now this is a placeholder.',
          )
        }
        hitSlop={8}
      >
        <Text style={styles.link}>See what’s included</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 56,
    gap: 12,
  },
  iconBubble: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 340,
    marginBottom: 8,
  },
  upgradeBtn: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  upgradeBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  link: {
    color: Colors.textMuted,
    fontSize: 13,
    textDecorationLine: 'underline',
    marginTop: 4,
  },
});
