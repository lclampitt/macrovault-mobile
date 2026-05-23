import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import type { MealPlanEntry } from '../../hooks/useMealPlanWeek';

type Props = {
  entry: MealPlanEntry;
  isFavorite: boolean;
  deleting: boolean;
  onToggleFavorite: () => void;
  onSwap: () => void;
  onDelete: () => void;
};

function fmtMacro(n: number): string {
  return Math.round(n).toString();
}

export default function MealCard({
  entry,
  isFavorite,
  deleting,
  onToggleFavorite,
  onSwap,
  onDelete,
}: Props) {
  const [showIngredients, setShowIngredients] = useState(false);
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{entry.meal_name}</Text>
        <Pressable
          onPress={onToggleFavorite}
          hitSlop={8}
          style={[styles.heartBtn, isFavorite && styles.heartBtnActive]}
          accessibilityRole="button"
          accessibilityState={{ selected: isFavorite }}
          accessibilityLabel={
            isFavorite ? 'Remove from saved meals' : 'Save meal'
          }
        >
          <Feather
            name="heart"
            size={13}
            color={isFavorite ? Colors.accentLight : Colors.textMuted}
          />
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
          size={12}
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
          onPress={onSwap}
          style={styles.swapBtn}
          accessibilityRole="button"
          accessibilityLabel="Swap meal"
        >
          <Feather name="refresh-cw" size={12} color={Colors.textSecondary} />
          <Text style={styles.swapText}>Swap meal</Text>
        </Pressable>
        <Pressable
          onPress={onDelete}
          disabled={deleting}
          style={[styles.removeBtn, deleting && styles.removeBtnDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Remove meal"
        >
          <Feather name="x" size={14} color={Colors.error} />
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
    borderRadius: 12,
    padding: 13,
    gap: 9,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  heartBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderColor: Colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBtnActive: {
    borderColor: Colors.borderAccent,
    backgroundColor: Colors.accentSofter,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    borderColor: Colors.borderAccentSoft,
    borderWidth: 1,
    backgroundColor: Colors.accentSofter,
  },
  chipText: {
    color: Colors.accentLight,
    fontSize: 11,
    fontWeight: '600',
  },
  ingredientsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
  },
  ingredientsToggleText: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  ingredientsBody: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    paddingTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 1,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  swapBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 9,
    borderColor: Colors.border,
    borderWidth: 1,
    paddingVertical: 9,
    backgroundColor: Colors.background,
  },
  swapText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  removeBtn: {
    width: 38,
    borderRadius: 9,
    borderColor: Colors.errorBorder,
    borderWidth: 1,
    backgroundColor: Colors.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnDisabled: {
    opacity: 0.5,
  },
});
