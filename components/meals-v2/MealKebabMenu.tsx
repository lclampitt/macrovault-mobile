import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Copy, RefreshCw, Trash2 } from 'lucide-react-native';
import { DS, Font } from '../../lib/design-system';

type Props = {
  onSwap: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
};

/** Desaturated coral for destructive actions only — per design system spec. */
const DESTRUCTIVE = '#E5736A';

/**
 * Floating dropdown anchored at top-right of the kebab button. Background
 * #141414 with #2A2A2A border + elevated shadow.
 *
 * Caller is responsible for showing/hiding via `openMenuId` state and for
 * rendering the click-outside overlay (see MealsDashboardV2).
 */
export default function MealKebabMenu({
  onSwap,
  onDuplicate,
  onRemove,
}: Props) {
  return (
    <View
      style={styles.menu}
      accessibilityRole="menu"
    >
      <Pressable
        onPress={onSwap}
        style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
        accessibilityRole="menuitem"
        accessibilityLabel="Swap meal"
      >
        <RefreshCw size={14} color={DS.textSecondary} strokeWidth={2} />
        <Text style={styles.itemLabel}>Swap meal</Text>
      </Pressable>
      <Pressable
        onPress={onDuplicate}
        style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
        accessibilityRole="menuitem"
        accessibilityLabel="Duplicate meal"
      >
        <Copy size={14} color={DS.textSecondary} strokeWidth={2} />
        <Text style={styles.itemLabel}>Duplicate</Text>
      </Pressable>
      <View style={styles.divider} />
      <Pressable
        onPress={onRemove}
        style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
        accessibilityRole="menuitem"
        accessibilityLabel="Remove meal"
      >
        <Trash2 size={14} color={DESTRUCTIVE} strokeWidth={2} />
        <Text style={[styles.itemLabel, { color: DESTRUCTIVE }]}>Remove</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    right: 0,
    top: 36,
    zIndex: 50,
    minWidth: 160,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    paddingVertical: 4,
    // Elevated shadow per spec
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  itemPressed: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  itemLabel: {
    fontFamily: Font.medium,
    fontSize: 12,
    color: DS.text,
  },
  divider: {
    height: 1,
    marginHorizontal: 8,
    marginVertical: 4,
    backgroundColor: '#2A2A2A',
  },
});
