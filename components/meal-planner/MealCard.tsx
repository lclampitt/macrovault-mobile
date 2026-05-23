import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import type { MealPlanEntry } from '../../hooks/useMealPlanWeek';

type Props = {
  entry: MealPlanEntry;
};

function fmtMacro(n: number): string {
  return Math.round(n).toString();
}

export default function MealCard({ entry }: Props) {
  const [showIngredients, setShowIngredients] = useState(false);
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{entry.meal_name}</Text>
        <Pressable
          onPress={() =>
            Alert.alert(
              'Save meal',
              'Coming soon — Phase 10b. Will save this meal to your favorites.',
            )
          }
          hitSlop={8}
          style={styles.heartBtn}
          accessibilityRole="button"
          accessibilityLabel="Favorite meal"
        >
          <Feather name="heart" size={16} color={Colors.textMuted} />
        </Pressable>
      </View>

      <View style={styles.chipsRow}>
        <Chip label={`Cal: ${fmtMacro(entry.calories)}`} />
        <Chip label={`P: ${fmtMacro(entry.protein)}g`} />
        <Chip label={`C: ${fmtMacro(entry.carbs)}g`} />
        <Chip label={`F: ${fmtMacro(entry.fat)}g`} />
      </View>

      <Pressable
        onPress={() => setShowIngredients((v) => !v)}
        style={styles.ingredientsToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: showIngredients }}
      >
        <Feather
          name={showIngredients ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={Colors.textMuted}
        />
        <Text style={styles.ingredientsToggleText}>
          {showIngredients ? 'Hide ingredients' : 'Show ingredients'}
        </Text>
      </Pressable>

      {showIngredients ? (
        <Text style={styles.ingredientsBody}>
          {entry.ingredients?.trim() || 'No ingredients listed.'}
        </Text>
      ) : null}

      <View style={styles.actionsRow}>
        <Pressable
          onPress={() =>
            Alert.alert(
              'Swap meal',
              'Coming soon — Phase 10b. Opens the swap modal (AI / saved / search / manual).',
            )
          }
          style={styles.swapBtn}
          accessibilityRole="button"
          accessibilityLabel="Swap meal"
        >
          <Feather name="refresh-cw" size={14} color={Colors.textSecondary} />
          <Text style={styles.swapText}>Swap meal</Text>
        </Pressable>
        <Pressable
          onPress={() =>
            Alert.alert(
              'Remove meal',
              'Coming soon — Phase 10b. Will remove this meal from your plan.',
            )
          }
          style={styles.removeBtn}
          accessibilityRole="button"
          accessibilityLabel="Remove meal"
        >
          <Feather name="x" size={16} color={Colors.error} />
        </Pressable>
      </View>
    </View>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  heartBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderColor: Colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderColor: Colors.borderAccentSoft,
    borderWidth: 1,
    backgroundColor: Colors.accentSofter,
  },
  chipText: {
    color: Colors.accentLight,
    fontSize: 12,
    fontWeight: '600',
  },
  ingredientsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  ingredientsToggleText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  ingredientsBody: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    paddingTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  swapBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    borderColor: Colors.border,
    borderWidth: 1,
    paddingVertical: 11,
    backgroundColor: Colors.background,
  },
  swapText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  removeBtn: {
    width: 44,
    borderRadius: 10,
    borderColor: Colors.errorBorder,
    borderWidth: 1,
    backgroundColor: Colors.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
