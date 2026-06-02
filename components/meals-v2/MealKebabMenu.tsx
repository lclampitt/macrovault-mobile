import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Copy, RefreshCw, Trash2 } from 'lucide-react-native';
import { Font } from '../../lib/design-system';
import { useTokens } from '../../lib/theme-context';

type Props = {
  onSwap: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
};

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
  const t = useTokens();
  return (
    <View
      style={[
        styles.menu,
        {
          backgroundColor: t.bgCard,
          borderColor: t.borderStrong,
        },
        t.shadowElevated,
      ]}
      accessibilityRole="menu"
    >
      <Pressable
        onPress={onSwap}
        style={({ pressed }) => [
          styles.item,
          pressed && { backgroundColor: t.bgCardElevated },
        ]}
        accessibilityRole="menuitem"
        accessibilityLabel="Swap meal"
      >
        <RefreshCw size={14} color={t.textSecondary} strokeWidth={2} />
        <Text style={[styles.itemLabel, { color: t.textPrimary }]}>Swap meal</Text>
      </Pressable>
      <Pressable
        onPress={onDuplicate}
        style={({ pressed }) => [
          styles.item,
          pressed && { backgroundColor: t.bgCardElevated },
        ]}
        accessibilityRole="menuitem"
        accessibilityLabel="Duplicate meal"
      >
        <Copy size={14} color={t.textSecondary} strokeWidth={2} />
        <Text style={[styles.itemLabel, { color: t.textPrimary }]}>Duplicate</Text>
      </Pressable>
      <View style={[styles.divider, { backgroundColor: t.borderSubtle }]} />
      <Pressable
        onPress={onRemove}
        style={({ pressed }) => [
          styles.item,
          pressed && { backgroundColor: t.bgCardElevated },
        ]}
        accessibilityRole="menuitem"
        accessibilityLabel="Remove meal"
      >
        <Trash2 size={14} color={t.destructive} strokeWidth={2} />
        <Text style={[styles.itemLabel, { color: t.destructive }]}>Remove</Text>
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
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  itemLabel: {
    fontFamily: Font.medium,
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginHorizontal: 8,
    marginVertical: 4,
  },
});
